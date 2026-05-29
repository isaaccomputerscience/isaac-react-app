import React, { useCallback, useContext, useRef } from "react";
import { VideoDTO } from "../../../IsaacApiTypes";
import { selectors, useAppDispatch, useAppSelector } from "../../state";
import { NOT_FOUND, api, ACTION_TYPE } from "../../services";
import ReactGA from "react-ga4";
import { AccordionSectionContext } from "../../../IsaacAppTypes";

interface IsaacVideoProps {
  doc: VideoDTO;
}

interface VideoEventDetails {
  type: "VIDEO_PLAY" | "VIDEO_PAUSE" | "VIDEO_ENDED" | "VIDEO_60_PERCENT_WATCHED";
  videoId: string;
  videoUrl: string;
  videoDurationSeconds?: number;
  videoPosition?: number;
  pageId?: string;
  watchedSeconds?: number;
  watchPercent?: number;
}

interface VideoProgressStore {
  totalVideoDurationInSeconds: number | null;
  segments: WatchedSegment[];
  thresholdLogged: boolean;
}

interface WistiaPostMessageData {
  method: string;
  args: Array<string | number | Record<string, unknown>>;
}

interface WistiaEventData {
  secondsWatched?: number;
  seconds?: number;
  [key: string]: unknown;
}

interface WistiaMessageProcessingContext {
  lastKnownTime: number;
  embedSrc: string;
  videoId: string;
  pageId?: string;
}

interface WistiaMessageProcessingResult {
  lastKnownTime: number;
  eventDetails?: VideoEventDetails;
}

interface YouTubePlayer {
  getVideoUrl: () => string;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

const VIDEO_WATCH_THRESHOLD = 0.6;
const SEEK_DETECTION_TOLERANCE_SECONDS = 2.5;
const VIDEO_PROGRESS_STORAGE_PREFIX = "video-progress:";

interface WatchedSegment {
  watchedSegmentStart: number;
  watchedSegmentEnd: number;
}

const WISTIA_EVENT_TYPE_MAP: Record<string, VideoEventDetails["type"]> = {
  play: "VIDEO_PLAY",
  playing: "VIDEO_PLAY",
  pause: "VIDEO_PAUSE",
  paused: "VIDEO_PAUSE",
  end: "VIDEO_ENDED",
  ended: "VIDEO_ENDED",
};

interface VideoProgressState {
  totalVideoDurationInSeconds: number | null;
  segments: WatchedSegment[];
  currentSegmentStart: number | null;
  lastKnownTime: number | null;
  isPlaying: boolean;
  thresholdLogged: boolean;
}

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, config: unknown) => void;
      ready: (callback: () => void) => void;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    Wistia?: {
      [key: string]: unknown;
    };
  }

  // eslint-disable-next-line no-var
  var YT: Window["YT"];
  // eslint-disable-next-line no-var
  var Wistia: Window["Wistia"];
}

// Constants
const VIDEO_PLATFORMS = {
  YOUTUBE: {
    hosts: ["youtube.com", "www.youtube.com", "youtu.be"],
    idPattern: /(v=|\/embed\/|\/)([^?&/.]{11})/,
    timePatterns: {
      start: /[?&](t|start)=(\d+)/,
      end: /[?&]end=(\d+)/,
    },
  },
  WISTIA: {
    hosts: ["wistia.com", "www.wistia.com", "fast.wistia.net", "wistia.net"],
    idPattern: /\/(?:embed\/iframe|medias)\/([a-zA-Z0-9]+)/,
    allowedOrigins: [
      "https://fast.wistia.net",
      "https://fast.wistia.com",
      "https://embed-ssl.wistia.com",
      "https://embed-cloudfront.wistia.com",
    ],
  },
} as const;

/**
 * Check if a URL hostname matches allowed hosts for a platform
 */
function isHostAllowed(hostname: string, allowedHosts: readonly string[]): boolean {
  const lowerHostname = hostname.toLowerCase();
  return allowedHosts.some(
    (allowed) => lowerHostname === allowed || lowerHostname.endsWith("." + allowed.split(".").slice(-2).join(".")),
  );
}

/**
 * Detect video platform from URL
 */
function detectPlatform(src: string): "youtube" | "wistia" | null {
  try {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();

    if (isHostAllowed(hostname, VIDEO_PLATFORMS.YOUTUBE.hosts)) return "youtube";
    if (isHostAllowed(hostname, VIDEO_PLATFORMS.WISTIA.hosts)) return "wistia";
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Rewrite video URL to embeddable format
 */
export function rewrite(src: string): string | undefined {
  const platform = detectPlatform(src);
  if (!platform) return undefined;

  if (platform === "youtube") return rewriteYouTube(src);
  if (platform === "wistia") return rewriteWistia(src);
}

function rewriteYouTube(src: string): string | undefined {
  const videoIdMatch = VIDEO_PLATFORMS.YOUTUBE.idPattern.exec(src);
  if (!videoIdMatch) return undefined;

  const videoId = videoIdMatch[2];
  const startMatch = VIDEO_PLATFORMS.YOUTUBE.timePatterns.start.exec(src);
  const endMatch = VIDEO_PLATFORMS.YOUTUBE.timePatterns.end.exec(src);

  const optionalStart = startMatch ? `&start=${startMatch[2]}` : "";
  const optionalEnd = endMatch ? `&end=${endMatch[1]}` : "";

  return (
    `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&fs=1&modestbranding=1` +
    `${optionalStart}${optionalEnd}&origin=${globalThis.location.origin}`
  );
}

function rewriteWistia(src: string): string | undefined {
  const videoIdMatch = VIDEO_PLATFORMS.WISTIA.idPattern.exec(src);
  if (!videoIdMatch) return undefined;

  const videoId = videoIdMatch[1];
  return `https://fast.wistia.net/embed/iframe/${videoId}?videoFoam=true&playerColor=1fadad&wmode=transparent`;
}

/**
 * Extract video ID from embed URL
 */
function extractVideoId(embedSrc: string, pattern: RegExp): string | null {
  const match = pattern.exec(embedSrc);
  return match ? match[1] : null;
}

// The video progress storage key is a combination of the user storage scope (logged-in or not logged in users) and the video id. This is to ensure that the video progress is scoped to the user.
function getVideoProgressStorageKey(userStorageScope: string, videoId: string): string {
  return `${VIDEO_PROGRESS_STORAGE_PREFIX}${userStorageScope}:${videoId}`;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

//clamp function is to ensure tat the value of video segments is between 0 and total video duration
function clampVideoProgressValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function mergeSegments(segments: WatchedSegment[]): WatchedSegment[] {
  if (segments.length === 0) return [];

  const sortedSegments = [...segments].sort((a, b) => a.watchedSegmentStart - b.watchedSegmentStart);

  // Initialize merged segments with the first segment
  const mergedSegments: WatchedSegment[] = [{ ...sortedSegments[0] }];
  // Iterate through sorted segments from the second one onwards
  for (let i = 1; i < sortedSegments.length; i++) {
    const currentSegment = sortedSegments[i];
    const lastMergedSegment = mergedSegments.at(-1)!;

    if (currentSegment.watchedSegmentStart <= lastMergedSegment.watchedSegmentEnd + 0.5) {
      lastMergedSegment.watchedSegmentEnd = Math.max(
        lastMergedSegment.watchedSegmentEnd,
        currentSegment.watchedSegmentEnd,
      );
    } else {
      mergedSegments.push({ ...currentSegment });
    }
  }
  return mergedSegments;
}

function getUniqueWatchedSeconds(segments: WatchedSegment[]): number {
  return segments.reduce(
    (total, segment) => total + Math.max(0, segment.watchedSegmentEnd - segment.watchedSegmentStart),
    0,
  );
}

function getWatchPercent(uniqueWatchedSeconds: number, totalVideoDurationInSeconds: number): number {
  if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return 0;
  return uniqueWatchedSeconds / totalVideoDurationInSeconds;
}

function loadVideoProgress(userStorageScope: string, videoId: string): VideoProgressStore | null {
  try {
    const localStorageVideoData = globalThis.localStorage?.getItem(
      getVideoProgressStorageKey(userStorageScope, videoId),
    );
    if (!localStorageVideoData) return null;
    const parsed = JSON.parse(localStorageVideoData) as Partial<VideoProgressStore>;
    const totalVideoDurationInSeconds =
      isValidNumber(parsed.totalVideoDurationInSeconds) && parsed.totalVideoDurationInSeconds > 0
        ? parsed.totalVideoDurationInSeconds
        : null;
    const segments = Array.isArray(parsed.segments)
      ? mergeSegments(
          parsed.segments
            .filter(
              (s): s is WatchedSegment => isValidNumber(s.watchedSegmentStart) && isValidNumber(s.watchedSegmentEnd),
            )
            .map((s) => ({ watchedSegmentStart: s.watchedSegmentStart, watchedSegmentEnd: s.watchedSegmentEnd })),
        )
      : [];
    const thresholdLogged = parsed.thresholdLogged === true;
    return { totalVideoDurationInSeconds, segments, thresholdLogged };
  } catch {
    return null;
  }
}

function createEmptyVideoProgressState(): VideoProgressState {
  return {
    totalVideoDurationInSeconds: null,
    segments: [],
    currentSegmentStart: null,
    lastKnownTime: null,
    isPlaying: false,
    thresholdLogged: false,
  };
}

function createInitialVideoProgressState(userStorageScope: string | null, videoId: string | null): VideoProgressState {
  if (!userStorageScope || !videoId) {
    return createEmptyVideoProgressState();
  }

  const stored = loadVideoProgress(userStorageScope, videoId);
  return {
    totalVideoDurationInSeconds: stored?.totalVideoDurationInSeconds ?? null,
    segments: stored?.segments ?? [],
    currentSegmentStart: null,
    lastKnownTime: null,
    isPlaying: false,
    thresholdLogged: stored?.thresholdLogged ?? false,
  };
}

function saveVideoProgress(userStorageScope: string | null, videoId: string, state: VideoProgressState): void {
  if (!userStorageScope) return;
  try {
    const toStore: VideoProgressStore = {
      totalVideoDurationInSeconds: state.totalVideoDurationInSeconds,
      segments: state.segments,
      thresholdLogged: state.thresholdLogged,
    };
    globalThis.localStorage?.setItem(getVideoProgressStorageKey(userStorageScope, videoId), JSON.stringify(toStore));
  } catch {
    // ignore localStorage failures
  }
}

/**
 * Log video events to the backend
 */
export async function logVideoEvent(
  eventDetails: VideoEventDetails,
  dispatch?: ReturnType<typeof useAppDispatch>,
): Promise<void> {
  if (dispatch) {
    dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
  }

  try {
    await api.logger.log(eventDetails);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to log video event:", error);
    }
  }
}

/**
 * Create video event details object
 */
export function createEventDetails(
  type: VideoEventDetails["type"],
  videoUrl: string,
  videoId: string,
  options?: {
    pageId?: string;
    videoPosition?: number;
    videoDurationSeconds?: number;
    watchedSeconds?: number;
    watchPercent?: number;
  },
): VideoEventDetails {
  const details: VideoEventDetails = { type, videoUrl, videoId };
  if (options?.pageId) details.pageId = options.pageId;
  if (options?.videoPosition !== undefined) details.videoPosition = options.videoPosition;
  if (options?.videoDurationSeconds !== undefined) details.videoDurationSeconds = options.videoDurationSeconds;
  if (options?.watchedSeconds !== undefined) details.watchedSeconds = options.watchedSeconds;
  if (options?.watchPercent !== undefined) details.watchPercent = options.watchPercent;
  return details;
}

export function updateWistiaTimeFromEventData(lastKnownTime: number, eventData: WistiaEventData): number {
  if (typeof eventData.seconds === "number") {
    return eventData.seconds;
  }
  if (typeof eventData.secondsWatched === "number") {
    return eventData.secondsWatched;
  }
  return lastKnownTime;
}

export function updateWistiaTimeFromArgs(
  lastKnownTime: number,
  args: Array<string | number | Record<string, unknown>>,
): number {
  if (typeof args[1] === "number") {
    return args[1];
  }
  if (typeof (args[1] as WistiaEventData)?.seconds === "number") {
    return (args[1] as WistiaEventData).seconds as number;
  }
  return lastKnownTime;
}

export function isWistiaTimeChangeEvent(eventName: string): boolean {
  return eventName === "timechange" || eventName === "secondchange";
}

export function processWistiaMessage(
  origin: string,
  rawData: unknown,
  context: WistiaMessageProcessingContext,
): WistiaMessageProcessingResult {
  if (!isValidWistiaOrigin(origin)) {
    return { lastKnownTime: context.lastKnownTime };
  }

  const data: WistiaPostMessageData =
    typeof rawData === "string" ? JSON.parse(rawData) : (rawData as WistiaPostMessageData);
  if (data.method !== "_trigger" || !Array.isArray(data.args) || data.args.length === 0) {
    return { lastKnownTime: context.lastKnownTime };
  }

  const eventName = String(data.args[0]).toLowerCase();
  if (isWistiaTimeChangeEvent(eventName)) {
    return {
      lastKnownTime: updateWistiaTimeFromArgs(context.lastKnownTime, data.args),
    };
  }

  const nextKnownTime = updateWistiaTimeFromEventData(context.lastKnownTime, (data.args[1] || {}) as WistiaEventData);
  const eventType = WISTIA_EVENT_TYPE_MAP[eventName];
  if (!eventType) {
    return { lastKnownTime: nextKnownTime };
  }

  return {
    lastKnownTime: nextKnownTime,
    eventDetails: createEventDetails(eventType, context.embedSrc, context.videoId, {
      pageId: context.pageId,
      videoPosition: eventType === "VIDEO_ENDED" ? undefined : nextKnownTime,
    }),
  };
}

export function isValidWistiaOrigin(origin: string): boolean {
  return VIDEO_PLATFORMS.WISTIA.allowedOrigins.some(
    (allowed) => origin === allowed || origin.endsWith(".wistia.net") || origin.endsWith(".wistia.com"),
  );
}

export function onPlayerStateChange(
  event: YouTubeEvent,
  videoId: string,
  pageId?: string,
  dispatch?: ReturnType<typeof useAppDispatch>,
): void {
  const YT = globalThis.YT;
  if (!YT) return;

  const videoUrl = event.target.getVideoUrl();
  const videoPosition = event.target.getCurrentTime();
  let eventType: VideoEventDetails["type"] | null = null;

  switch (event.data) {
    case YT.PlayerState.PLAYING:
      eventType = "VIDEO_PLAY";
      break;
    case YT.PlayerState.PAUSED:
      eventType = "VIDEO_PAUSE";
      break;
    case YT.PlayerState.ENDED:
      eventType = "VIDEO_ENDED";
      break;
    default:
      return;
  }

  const eventDetails = createEventDetails(eventType, videoUrl, videoId, {
    pageId,
    videoPosition: eventType === "VIDEO_ENDED" ? undefined : videoPosition,
  });

  logVideoEvent(eventDetails, dispatch);
}

export function pauseAllVideos(): void {
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo" }), "*");
  });
}

export function IsaacVideo(props: IsaacVideoProps) {
  const dispatch = useAppDispatch();
  const {
    doc: { src, altText },
  } = props;
  const page = useAppSelector(selectors.doc.get);
  const user = useAppSelector(selectors.user.loggedInOrNull);

  // Progress tracking and 60% KPI logging are scoped to logged-in users only.
  const userStorageScope = user?.id == null ? null : String(user.id);
  const pageId = (page && page !== NOT_FOUND && page.id) || undefined;
  const embedSrc = src && rewrite(src);
  const altTextToUse = `Embedded video: ${altText || src}.`;

  const wistiaIframeRef = useRef<HTMLIFrameElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const youtubePollTimerRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  const platform = React.useMemo(() => (src ? detectPlatform(src) : null), [src]);
  const isYouTube = platform === "youtube";
  const isWistia = platform === "wistia";

  const wistiaVideoId = React.useMemo(
    () => (isWistia && embedSrc ? extractVideoId(embedSrc, /embed\/iframe\/([a-zA-Z0-9]+)/) : null),
    [isWistia, embedSrc],
  );

  const youtubeVideoId = React.useMemo(
    () => (isYouTube && embedSrc ? extractVideoId(embedSrc, /embed\/([^?]+)/) : null),
    [isYouTube, embedSrc],
  );

  const canonicalVideoId = youtubeVideoId || wistiaVideoId;
  const progressReference = useRef<VideoProgressState>(
    createInitialVideoProgressState(userStorageScope, canonicalVideoId),
  );

  React.useEffect(() => {
    progressReference.current = createInitialVideoProgressState(userStorageScope, canonicalVideoId);
  }, [canonicalVideoId, userStorageScope]);

  const setTotalVideoDurationIfPresent = useCallback(
    (totalVideoDurationInSeconds: number | null | undefined) => {
      if (!canonicalVideoId || !isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return;
      if (progressReference.current.totalVideoDurationInSeconds === totalVideoDurationInSeconds) return;
      progressReference.current.totalVideoDurationInSeconds = totalVideoDurationInSeconds;
      saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
    },
    [canonicalVideoId, userStorageScope],
  );

  const checkIf60PercentWatchedAndLog = useCallback(
    (videoId: string, videoUrl: string) => {
      if (!userStorageScope || !canonicalVideoId || progressReference.current.thresholdLogged) return;
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return;

      const uniqueWatchedSeconds = getUniqueWatchedSeconds(progressReference.current.segments);
      const watchPercent = getWatchPercent(uniqueWatchedSeconds, totalVideoDurationInSeconds);
      if (watchPercent < VIDEO_WATCH_THRESHOLD) return;

      progressReference.current.thresholdLogged = true;
      saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);

      const eventDetails = createEventDetails("VIDEO_60_PERCENT_WATCHED", videoUrl, videoId, {
        pageId,
        videoDurationSeconds: totalVideoDurationInSeconds,
        watchedSeconds: uniqueWatchedSeconds,
        watchPercent,
      });
      logVideoEvent(eventDetails, dispatch);
    },
    [canonicalVideoId, dispatch, pageId, userStorageScope],
  );

  const appendSegment = useCallback(
    (segmentStart: number, segmentEnd: number, videoId: string, videoUrl: string) => {
      if (!userStorageScope) return;
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return;

      const clampedStart = clampVideoProgressValue(segmentStart, 0, totalVideoDurationInSeconds);
      const clampedEnd = clampVideoProgressValue(segmentEnd, 0, totalVideoDurationInSeconds);
      if (clampedEnd - clampedStart < 0.5) return;

      progressReference.current.segments = mergeSegments([
        ...progressReference.current.segments,
        { watchedSegmentStart: clampedStart, watchedSegmentEnd: clampedEnd },
      ]);
      if (canonicalVideoId) {
        saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
      }
      checkIf60PercentWatchedAndLog(videoId, videoUrl);
    },
    [canonicalVideoId, checkIf60PercentWatchedAndLog, userStorageScope],
  );

  const startCurrentSegment = useCallback((segmentStart: number) => {
    progressReference.current.currentSegmentStart = segmentStart;
    progressReference.current.lastKnownTime = segmentStart; // this will set a baseline time when a new segment starts, so that we can detect seeks
  }, []);

  const closeCurrentSegment = useCallback(
    (segmentEnd: number, videoUrl: string, videoId: string) => {
      const currentSegmentStart = progressReference.current.currentSegmentStart;
      if (!isValidNumber(currentSegmentStart)) return;
      appendSegment(currentSegmentStart, segmentEnd, videoId, videoUrl);
      progressReference.current.currentSegmentStart = null;
    },
    [appendSegment],
  );

  // this function is used to update the playback progress of the video, and detect seeks by comparing the current time with the last known time.
  const updatePlaybackProgress = useCallback(
    (currentTime: number, videoUrl: string, videoId: string) => {
      if (!isValidNumber(currentTime)) return;
      const lastKnownTime = progressReference.current.lastKnownTime;
      if (!progressReference.current.isPlaying || !isValidNumber(lastKnownTime)) {
        progressReference.current.lastKnownTime = currentTime;
        return;
      }

      const diff = currentTime - lastKnownTime;
      const isSeek = Math.abs(diff) > SEEK_DETECTION_TOLERANCE_SECONDS;
      if (isSeek) {
        closeCurrentSegment(lastKnownTime, videoUrl, videoId);
        startCurrentSegment(currentTime);
      }
      progressReference.current.lastKnownTime = currentTime;
    },
    [closeCurrentSegment, startCurrentSegment],
  );

  const logPlayerEvent = useCallback(
    (eventType: VideoEventDetails["type"], videoUrl: string, videoId: string, videoPosition?: number) => {
      const eventDetails = createEventDetails(eventType, videoUrl, videoId, {
        pageId,
        videoPosition: eventType === "VIDEO_ENDED" ? undefined : videoPosition,
        videoDurationSeconds: progressReference.current.totalVideoDurationInSeconds ?? undefined,
      });
      logVideoEvent(eventDetails, dispatch);
    },
    [dispatch, pageId],
  );

  // Load Wistia API script
  React.useEffect(() => {
    if (!isWistia || globalThis.Wistia) return;

    const script = document.createElement("script");
    script.src = "https://fast.wistia.com/assets/external/E-v1.js";
    script.async = true;
    document.body.appendChild(script);
  }, [isWistia]);

  // Wistia: postMessage API — play/pause/end and time ticks feed the same segment tracker as YouTube
  React.useEffect(() => {
    if (!isWistia || !wistiaVideoId || !wistiaIframeRef.current) return;

    const iframe = wistiaIframeRef.current;

    const updateTimeFromEventData = (eventData: WistiaEventData): number | null => {
      if (typeof eventData.seconds === "number") return eventData.seconds;
      if (typeof eventData.secondsWatched === "number") return eventData.secondsWatched;
      return null;
    };

    const updateTimeFromArgs = (args: Array<string | number | Record<string, unknown>>): number | null => {
      if (typeof args[1] === "number") {
        return args[1];
      }
      if (typeof (args[1] as WistiaEventData)?.seconds === "number") {
        return (args[1] as WistiaEventData).seconds as number;
      }
      return null;
    };

    const getTotalDurationInSecondsForWistiaVideoFromEventData = (eventData: WistiaEventData): number | null => {
      const videoDuration = eventData["duration"];
      return isValidNumber(videoDuration) ? videoDuration : null;
    };

    const handleVideoEvent = (eventName: string, eventData: WistiaEventData): void => {
      const videoUrl = embedSrc || "";
      const eventTime = updateTimeFromEventData(eventData) ?? progressReference.current.lastKnownTime ?? 0;
      const totalVideoDurationInSeconds = getTotalDurationInSecondsForWistiaVideoFromEventData(eventData);
      if (isValidNumber(totalVideoDurationInSeconds) && totalVideoDurationInSeconds > 0) {
        setTotalVideoDurationIfPresent(totalVideoDurationInSeconds);
      }

      const eventType = WISTIA_EVENT_TYPE_MAP[eventName.toLowerCase()];
      if (!eventType) return;

      if (eventType === "VIDEO_PLAY") {
        progressReference.current.isPlaying = true;
        startCurrentSegment(eventTime);
      } else {
        progressReference.current.isPlaying = false;
        closeCurrentSegment(eventTime, videoUrl, wistiaVideoId);
        progressReference.current.lastKnownTime = eventTime;
      }

      logPlayerEvent(eventType, videoUrl, wistiaVideoId, eventType === "VIDEO_ENDED" ? undefined : eventTime);
    };

    const handleWistiaMessage = (event: MessageEvent): void => {
      if (!isValidWistiaOrigin(event.origin)) return;

      // Only accept messages from this iframe's content window (avoids cross-video / XSS issues).
      if (event.source !== iframe.contentWindow) return;

      try {
        const data: WistiaPostMessageData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.method !== "_trigger" || !Array.isArray(data.args) || data.args.length === 0) {
          return;
        }

        const eventName = data.args[0] as string;
        const eventData = (data.args[1] || {}) as WistiaEventData;

        if (isWistiaTimeChangeEvent(eventName)) {
          const currentTime = updateTimeFromArgs(data.args);
          if (isValidNumber(currentTime)) {
            updatePlaybackProgress(currentTime, embedSrc || "", wistiaVideoId);
          }
          const totalVideoDurationInSeconds = getTotalDurationInSecondsForWistiaVideoFromEventData(eventData);
          if (isValidNumber(totalVideoDurationInSeconds) && totalVideoDurationInSeconds > 0) {
            setTotalVideoDurationIfPresent(totalVideoDurationInSeconds);
          }
        } else {
          handleVideoEvent(eventName, eventData);
        }
      } catch (error) {
        if (
          process.env.NODE_ENV === "development" &&
          error instanceof Error &&
          !error.message.includes("not valid JSON")
        ) {
          console.warn("Error handling Wistia message:", error);
        }
      }
    };

    globalThis.addEventListener("message", handleWistiaMessage);

    const setupWistiaBindings = () => {
      if (iframe.contentWindow) {
        const eventsToTrack = ["play", "pause", "end", "timechange", "secondchange", "durationchange"];
        eventsToTrack.forEach((eventName) => {
          iframe.contentWindow?.postMessage(
            JSON.stringify({
              method: "bind",
              args: [eventName],
            }),
            "https://fast.wistia.net",
          );
        });
      }
    };

    const timer = setTimeout(setupWistiaBindings, 1000);

    return () => {
      globalThis.removeEventListener("message", handleWistiaMessage);
      clearTimeout(timer);
      const lastTime = progressReference.current.lastKnownTime;
      if (progressReference.current.isPlaying && isValidNumber(lastTime)) {
        closeCurrentSegment(lastTime, embedSrc || "", wistiaVideoId);
      }
      progressReference.current.isPlaying = false;
    };
  }, [
    isWistia,
    wistiaVideoId,
    embedSrc,
    closeCurrentSegment,
    logPlayerEvent,
    setTotalVideoDurationIfPresent,
    startCurrentSegment,
    updatePlaybackProgress,
  ]);

  const stopYouTubePollTimer = useCallback(() => {
    if (!youtubePollTimerRef.current) return;
    globalThis.clearInterval(youtubePollTimerRef.current);
    youtubePollTimerRef.current = null;
  }, []);

  const pollYouTubePlayerProgress = useCallback(() => {
    const player = youtubePlayerRef.current;
    if (!player || !youtubeVideoId) return;
    updatePlaybackProgress(player.getCurrentTime(), player.getVideoUrl(), youtubeVideoId);
  }, [updatePlaybackProgress, youtubeVideoId]);

  const startYouTubePollTimer = useCallback(() => {
    stopYouTubePollTimer();
    youtubePollTimerRef.current = globalThis.setInterval(pollYouTubePlayerProgress, 1000);
  }, [pollYouTubePlayerProgress, stopYouTubePollTimer]);

  const handleYouTubePlayerReady = useCallback(
    (event: YouTubeEvent) => {
      youtubePlayerRef.current = event.target;
      setTotalVideoDurationIfPresent(event.target.getDuration());
    },
    [setTotalVideoDurationIfPresent],
  );

  const handleYouTubePlayerStateChange = useCallback(
    (event: YouTubeEvent) => {
      const YT = globalThis.YT;
      if (!YT || !youtubeVideoId) return;

      youtubePlayerRef.current = event.target;
      setTotalVideoDurationIfPresent(event.target.getDuration());

      const videoUrl = event.target.getVideoUrl();
      const videoPosition = event.target.getCurrentTime();
      let eventType: VideoEventDetails["type"] | null = null;

      switch (event.data) {
        case YT.PlayerState.PLAYING:
          eventType = "VIDEO_PLAY";
          progressReference.current.isPlaying = true;
          startCurrentSegment(videoPosition);
          startYouTubePollTimer();
          break;
        case YT.PlayerState.PAUSED:
          eventType = "VIDEO_PAUSE";
          progressReference.current.isPlaying = false;
          closeCurrentSegment(videoPosition, videoUrl, youtubeVideoId);
          progressReference.current.lastKnownTime = videoPosition;
          stopYouTubePollTimer();
          break;
        case YT.PlayerState.ENDED:
          eventType = "VIDEO_ENDED";
          progressReference.current.isPlaying = false;
          closeCurrentSegment(videoPosition, videoUrl, youtubeVideoId);
          progressReference.current.lastKnownTime = videoPosition;
          stopYouTubePollTimer();
          break;
        default:
          return;
      }

      logPlayerEvent(eventType, videoUrl, youtubeVideoId, eventType === "VIDEO_ENDED" ? undefined : videoPosition);
    },
    [
      closeCurrentSegment,
      logPlayerEvent,
      setTotalVideoDurationIfPresent,
      startCurrentSegment,
      startYouTubePollTimer,
      stopYouTubePollTimer,
      youtubeVideoId,
    ],
  );

  // YouTube video initialization
  const youtubeRef = useCallback(
    (node: HTMLDivElement | null) => {
      const YT = globalThis.YT;
      if (!node || !youtubeVideoId || !YT) return;

      try {
        YT.ready(() => {
          new YT.Player(node, {
            videoId: youtubeVideoId,
            playerVars: {
              enablejsapi: 1,
              rel: 0,
              fs: 1,
              modestbranding: 1,
              origin: globalThis.location.origin,
            },
            events: {
              onReady: handleYouTubePlayerReady,
              onStateChange: handleYouTubePlayerStateChange,
            },
          });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "problem with YT library";
        console.error("Error with YouTube library: ", error);
        ReactGA.gtag("event", "exception", {
          description: `youtube_error: ${errorMessage}`,
          fatal: false,
        });
      }
    },
    [handleYouTubePlayerReady, handleYouTubePlayerStateChange, youtubeVideoId],
  );

  // Close any open YouTube segment and stop polling when leaving the page or changing video
  React.useEffect(() => {
    return () => {
      if (youtubePollTimerRef.current) {
        globalThis.clearInterval(youtubePollTimerRef.current);
        youtubePollTimerRef.current = null;
      }
      const player = youtubePlayerRef.current;
      if (player && youtubeVideoId) {
        closeCurrentSegment(player.getCurrentTime(), player.getVideoUrl(), youtubeVideoId);
        progressReference.current.isPlaying = false;
      }
    };
  }, [closeCurrentSegment, youtubeVideoId]);

  const detailsForPrintOut = <div className="only-print py-2 mb-4">{altTextToUse}</div>;

  const accordionSectionContext = useContext(AccordionSectionContext);
  const videoInAnAccordionSection = accordionSectionContext.open !== null;
  if (videoInAnAccordionSection && !accordionSectionContext.open) {
    return detailsForPrintOut;
  }

  return (
    <div>
      <div className="no-print content-value text-center">
        {embedSrc ? (
          <div className="content-video-container">
            {isYouTube ? (
              <div ref={youtubeRef} className="mw-100" title={altTextToUse} />
            ) : (
              <iframe
                ref={isWistia ? wistiaIframeRef : null}
                className="mw-100"
                title={altTextToUse}
                src={embedSrc}
                frameBorder="0"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          altText
        )}
      </div>
      {detailsForPrintOut}
    </div>
  );
}
