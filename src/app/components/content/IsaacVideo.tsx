import React, { useCallback, useContext, useRef } from "react";
import { VideoDTO } from "../../../IsaacApiTypes";
import { selectors, useAppDispatch, useAppSelector } from "../../state";
import { NOT_FOUND, api, ACTION_TYPE, API_PATH } from "../../services";
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

type WistiaPostMessageArg = string | number | Record<string, unknown>;

interface WistiaPostMessageData {
  method: string;
  args: Array<WistiaPostMessageArg>;
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
  destroy?: () => void;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, config: unknown) => YouTubePlayer;
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
    _wq?: Array<{ id: string; onReady?: (video: WistiaVideoApi) => void; [key: string]: unknown }>;
  }

  // eslint-disable-next-line no-var
  var YT: Window["YT"];
  // eslint-disable-next-line no-var
  var Wistia: Window["Wistia"];
  // eslint-disable-next-line no-var
  var _wq: Window["_wq"];
}

type WistiaEventCallback = (...args: unknown[]) => void;

interface WistiaVideoApi {
  duration?: () => number;
  time?: () => number;
  bind?: (eventName: string, callback: WistiaEventCallback) => void;
  unbind?: (eventName: string, callback: WistiaEventCallback) => void;
  [key: string]: unknown;
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

const VIDEO_WATCH_THRESHOLD = 0.6;
const SEEK_DETECTION_TOLERANCE_SECONDS = 2.5;
const VIDEO_PROGRESS_STORAGE_PREFIX = "video-progress:";

export interface WatchedSegment {
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
export function extractVideoId(embedSrc: string, pattern: RegExp): string | null {
  const match = pattern.exec(embedSrc);
  return match ? match[1] : null;
}

// The video progress storage key is a combination of the user storage scope (logged-in or not logged in users) and the video id. This is to ensure that the video progress is scoped to the user.
export function getVideoProgressStorageKey(userStorageScope: string, videoId: string): string {
  return `${VIDEO_PROGRESS_STORAGE_PREFIX}${userStorageScope}:${videoId}`;
}

export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

//clamp function is to ensure tat the value of video segments is between 0 and total video duration
export function clampVideoProgressValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function mergeSegments(segments: WatchedSegment[]): WatchedSegment[] {
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

export function getUniqueWatchedSeconds(segments: WatchedSegment[]): number {
  return segments.reduce(
    (total, segment) => total + Math.max(0, segment.watchedSegmentEnd - segment.watchedSegmentStart),
    0,
  );
}

export function getWatchPercent(uniqueWatchedSeconds: number, totalVideoDurationInSeconds: number): number {
  if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return 0;
  return uniqueWatchedSeconds / totalVideoDurationInSeconds;
}

export function loadVideoProgress(userStorageScope: string, videoId: string): VideoProgressStore | null {
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

export function createEmptyVideoProgressState(): VideoProgressState {
  return {
    totalVideoDurationInSeconds: null,
    segments: [],
    currentSegmentStart: null,
    lastKnownTime: null,
    isPlaying: false,
    thresholdLogged: false,
  };
}

export function createInitialVideoProgressState(
  userStorageScope: string | null,
  videoId: string | null,
): VideoProgressState {
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

export function saveVideoProgress(userStorageScope: string | null, videoId: string, state: VideoProgressState): void {
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

export function sendVideoEngagementBeacon(eventDetails: VideoEventDetails): boolean {
  try {
    void fetch(`${API_PATH}/log`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventDetails),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
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

export function updateWistiaTimeFromArgs(lastKnownTime: number, args: Array<WistiaPostMessageArg>): number {
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

interface WistiaTriggerMessage {
  eventName: string;
  eventData: WistiaEventData;
  args: WistiaPostMessageArg[];
}

function parseWistiaTriggerMessage(rawData: unknown): WistiaTriggerMessage | null {
  const data: WistiaPostMessageData =
    typeof rawData === "string" ? JSON.parse(rawData) : (rawData as WistiaPostMessageData);
  if (data.method !== "_trigger" || !Array.isArray(data.args) || data.args.length === 0) {
    return null;
  }

  const rawEventName = data.args[0];
  if (typeof rawEventName !== "string") {
    return null;
  }

  return {
    eventName: rawEventName,
    eventData: (data.args[1] || {}) as WistiaEventData,
    args: data.args,
  };
}

function isWistiaMessageForIframe(event: MessageEvent, iframeContentWindow: Window | null): boolean {
  return isValidWistiaOrigin(event.origin) && event.source === iframeContentWindow;
}

function logWistiaMessageParseError(error: unknown): void {
  if (process.env.NODE_ENV === "development" && error instanceof Error && !error.message.includes("not valid JSON")) {
    console.warn("Error handling Wistia message:", error);
  }
}

export function processWistiaMessage(
  origin: string,
  rawData: unknown,
  context: WistiaMessageProcessingContext,
): WistiaMessageProcessingResult {
  if (!isValidWistiaOrigin(origin)) {
    return { lastKnownTime: context.lastKnownTime };
  }

  const message = parseWistiaTriggerMessage(rawData);
  if (!message) {
    return { lastKnownTime: context.lastKnownTime };
  }

  const eventName = message.eventName.toLowerCase();
  if (isWistiaTimeChangeEvent(eventName)) {
    return {
      lastKnownTime: updateWistiaTimeFromArgs(context.lastKnownTime, message.args),
    };
  }

  const nextKnownTime = updateWistiaTimeFromEventData(context.lastKnownTime, message.eventData);
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
  const youtubeNodeRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerCreatedRef = useRef<boolean>(false);
  const youtubeReadyFiredRef = useRef<boolean>(false);
  const youtubeReadyRetryUsedRef = useRef<boolean>(false);
  const youtubeReadyWatchdogRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const thresholdSendInFlightRef = useRef<boolean>(false);
  // True once the official Wistia player API (E-v1.js) has attached; the postMessage
  // fallback below must then stand down to avoid double-logging and double-counting.
  const wistiaApiAttachedRef = useRef<boolean>(false);

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
  const progressScopeAndVideoRef = useRef({ userStorageScope, canonicalVideoId });
  if (
    progressScopeAndVideoRef.current.userStorageScope !== userStorageScope ||
    progressScopeAndVideoRef.current.canonicalVideoId !== canonicalVideoId
  ) {
    progressReference.current = createInitialVideoProgressState(userStorageScope, canonicalVideoId);
    progressScopeAndVideoRef.current = { userStorageScope, canonicalVideoId };
  }

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
    (videoId: string, videoUrl: string, liveCurrentTime?: number) => {
      if (
        !userStorageScope ||
        !canonicalVideoId ||
        progressReference.current.thresholdLogged ||
        thresholdSendInFlightRef.current
      ) {
        return;
      }
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) {
        return;
      }

      const segments = [...progressReference.current.segments];
      const openSegmentStart = progressReference.current.currentSegmentStart;
      if (
        progressReference.current.isPlaying &&
        isValidNumber(openSegmentStart) &&
        isValidNumber(liveCurrentTime) &&
        liveCurrentTime > openSegmentStart
      ) {
        segments.push({ watchedSegmentStart: openSegmentStart, watchedSegmentEnd: liveCurrentTime });
      }

      const uniqueWatchedSeconds = getUniqueWatchedSeconds(mergeSegments(segments));
      const watchPercent = getWatchPercent(uniqueWatchedSeconds, totalVideoDurationInSeconds);
      if (watchPercent < VIDEO_WATCH_THRESHOLD) {
        return;
      }

      const eventDetails = createEventDetails("VIDEO_60_PERCENT_WATCHED", videoUrl, videoId, {
        pageId,
        videoDurationSeconds: totalVideoDurationInSeconds,
        watchedSeconds: uniqueWatchedSeconds,
        watchPercent,
      });

      thresholdSendInFlightRef.current = true;
      dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
      api.logger
        .log(eventDetails)
        .then(() => {
          progressReference.current.thresholdLogged = true;
          saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
        })
        .catch(() => {
          // Swallow the failure: thresholdLogged stays false, so the next playback tick retries.
        })
        .finally(() => {
          thresholdSendInFlightRef.current = false;
        });
    },
    [canonicalVideoId, dispatch, pageId, userStorageScope],
  );

  const appendSegment = useCallback(
    (segmentStart: number, segmentEnd: number, videoId: string, videoUrl: string) => {
      if (!userStorageScope) {
        return;
      }
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) {
        return;
      }

      const clampedStart = clampVideoProgressValue(segmentStart, 0, totalVideoDurationInSeconds);
      const clampedEnd = clampVideoProgressValue(segmentEnd, 0, totalVideoDurationInSeconds);
      if (clampedEnd - clampedStart < 0.5) {
        return;
      }

      progressReference.current.segments = mergeSegments([
        ...progressReference.current.segments,
        { watchedSegmentStart: clampedStart, watchedSegmentEnd: clampedEnd },
      ]);
      saveVideoProgress(userStorageScope, videoId, progressReference.current);
      checkIf60PercentWatchedAndLog(videoId, videoUrl);
    },
    [checkIf60PercentWatchedAndLog, userStorageScope],
  );

  const startCurrentSegment = useCallback((segmentStart: number) => {
    progressReference.current.currentSegmentStart = segmentStart;
    progressReference.current.lastKnownTime = segmentStart; // this will set a baseline time when a new segment starts, so that we can detect seeks
  }, []);

  const closeCurrentSegment = useCallback(
    (segmentEnd: number, videoUrl: string, videoId: string) => {
      const currentSegmentStart = progressReference.current.currentSegmentStart;
      if (!isValidNumber(currentSegmentStart)) {
        return;
      }
      appendSegment(currentSegmentStart, segmentEnd, videoId, videoUrl);
      progressReference.current.currentSegmentStart = null;
    },
    [appendSegment],
  );

  const closeCurrentSegmentRef = useRef(closeCurrentSegment);
  closeCurrentSegmentRef.current = closeCurrentSegment;

  // this function is used to update the playback progress of the video, and detect seeks by comparing the current time with the last known time.
  const updatePlaybackProgress = useCallback(
    (currentTime: number, videoUrl: string, videoId: string) => {
      if (!isValidNumber(currentTime)) {
        return;
      }
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

      checkIf60PercentWatchedAndLog(videoId, videoUrl, currentTime);
    },
    [checkIf60PercentWatchedAndLog, closeCurrentSegment, startCurrentSegment],
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

  // Latest render's callbacks/values for the Wistia API effect, which deliberately only
  // re-runs when the video changes (re-pushing to _wq would double-bind handlers).
  const wistiaCallbacksRef = useRef({
    embedSrc,
    logPlayerEvent,
    updatePlaybackProgress,
    startCurrentSegment,
    closeCurrentSegment,
    setTotalVideoDurationIfPresent,
  });
  wistiaCallbacksRef.current = {
    embedSrc,
    logPlayerEvent,
    updatePlaybackProgress,
    startCurrentSegment,
    closeCurrentSegment,
    setTotalVideoDurationIfPresent,
  };

  // Load Wistia API script
  React.useEffect(() => {
    if (!isWistia) return;
    if (globalThis.Wistia) {
      return;
    }

    const script = document.createElement("script");
    // Must be fast.wistia.net (not .com): the site CSP's script-src only allows the .net domain
    script.src = "https://fast.wistia.net/assets/external/E-v1.js";
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

    const updateTimeFromArgs = (args: Array<WistiaPostMessageArg>): number | null => {
      if (typeof args[1] === "number") {
        return args[1];
      } else if (typeof (args[1] as WistiaEventData)?.seconds === "number") {
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

    const applyWistiaTimeChange = (args: WistiaPostMessageArg[], eventData: WistiaEventData): void => {
      const currentTime = updateTimeFromArgs(args);
      if (isValidNumber(currentTime)) {
        updatePlaybackProgress(currentTime, embedSrc || "", wistiaVideoId);
      }
      const totalVideoDurationInSeconds = getTotalDurationInSecondsForWistiaVideoFromEventData(eventData);
      if (isValidNumber(totalVideoDurationInSeconds) && totalVideoDurationInSeconds > 0) {
        setTotalVideoDurationIfPresent(totalVideoDurationInSeconds);
      }
    };

    const handleWistiaMessage = (event: MessageEvent): void => {
      if (wistiaApiAttachedRef.current || !isWistiaMessageForIframe(event, iframe.contentWindow)) {
        return;
      }

      try {
        const message = parseWistiaTriggerMessage(event.data);
        if (!message) {
          return;
        }

        if (isWistiaTimeChangeEvent(message.eventName)) {
          applyWistiaTimeChange(message.args, message.eventData);
          return;
        }

        handleVideoEvent(message.eventName, message.eventData);
      } catch (error) {
        logWistiaMessageParseError(error);
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

    // Give iframe time to load
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
    if (!player || !youtubeVideoId) {
      return;
    }
    const currentTime = player.getCurrentTime();
    updatePlaybackProgress(currentTime, player.getVideoUrl(), youtubeVideoId);
  }, [updatePlaybackProgress, youtubeVideoId]);

  const startYouTubePollTimer = useCallback(() => {
    stopYouTubePollTimer();
    youtubePollTimerRef.current = globalThis.setInterval(pollYouTubePlayerProgress, 1000);
  }, [pollYouTubePlayerProgress, stopYouTubePollTimer]);

  const handleYouTubePlayerReady = useCallback(
    (event: YouTubeEvent) => {
      youtubePlayerRef.current = event.target;
      youtubeReadyFiredRef.current = true;
      const duration = event.target.getDuration();
      setTotalVideoDurationIfPresent(duration);
    },
    [setTotalVideoDurationIfPresent],
  );

  const handleYouTubePlayerStateChange = useCallback(
    (event: YouTubeEvent) => {
      const YT = globalThis.YT;
      if (!YT || !youtubeVideoId) {
        return;
      }

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

  // YouTube video initialization.
  const youtubeRef = useCallback((node: HTMLDivElement | null) => {
    youtubeNodeRef.current = node;
  }, []);

  const handleYouTubePlayerReadyRef = useRef(handleYouTubePlayerReady);
  handleYouTubePlayerReadyRef.current = handleYouTubePlayerReady;
  const handleYouTubePlayerStateChangeRef = useRef(handleYouTubePlayerStateChange);
  handleYouTubePlayerStateChangeRef.current = handleYouTubePlayerStateChange;

  const createYouTubePlayer = useCallback(
    (container: HTMLDivElement) => {
      const YT = globalThis.YT;
      if (!YT || !youtubeVideoId || youtubePlayerCreatedRef.current) return;
      youtubePlayerCreatedRef.current = true;
      try {
        YT.ready(() => {
          const playerHost = document.createElement("div");
          playerHost.className = "mw-100";
          container.replaceChildren(playerHost);
          youtubeReadyFiredRef.current = false;
          youtubePlayerRef.current = new YT.Player(playerHost, {
            videoId: youtubeVideoId,
            playerVars: {
              enablejsapi: 1,
              rel: 0,
              fs: 1,
              modestbranding: 1,
              origin: globalThis.location.origin,
            },
            events: {
              onReady: (event: YouTubeEvent) => handleYouTubePlayerReadyRef.current(event),
              onStateChange: (event: YouTubeEvent) => handleYouTubePlayerStateChangeRef.current(event),
            },
          });
          youtubeReadyWatchdogRef.current = globalThis.setTimeout(() => {
            if (youtubeReadyFiredRef.current || youtubeReadyRetryUsedRef.current) return;
            const node = youtubeNodeRef.current;
            if (!node) return; // unmounted while waiting
            youtubeReadyRetryUsedRef.current = true;
            try {
              youtubePlayerRef.current?.destroy?.();
            } catch {
              /* ignore teardown errors on a broken player */
            }
            youtubePlayerRef.current = null;
            youtubePlayerCreatedRef.current = false;
            node.replaceChildren();
            createYouTubePlayerRef.current(node);
          }, 8000);
        });
      } catch (error) {
        youtubePlayerCreatedRef.current = false; // allow a later retry
        const errorMessage = error instanceof Error ? error.message : "problem with YT library";
        console.error("Error with YouTube library: ", error);
        ReactGA.gtag("event", "exception", {
          description: `youtube_error: ${errorMessage}`,
          fatal: false,
        });
      }
    },
    [youtubeVideoId],
  );

  const createYouTubePlayerRef = useRef(createYouTubePlayer);
  createYouTubePlayerRef.current = createYouTubePlayer;

  React.useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;
    youtubePlayerCreatedRef.current = false; // fresh video id -> allow a new construction
    youtubeReadyRetryUsedRef.current = false; // fresh video id -> watchdog may retry once again
    let pollTimer: ReturnType<typeof globalThis.setInterval> | null = null;
    let giveUpTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

    const tryCreate = (): boolean => {
      const node = youtubeNodeRef.current;
      if (youtubePlayerCreatedRef.current) return true;
      if (!node) {
        return false;
      }
      if (!globalThis.YT) {
        return false;
      }
      createYouTubePlayerRef.current(node);
      return true;
    };

    if (!tryCreate()) {
      pollTimer = globalThis.setInterval(() => {
        if (tryCreate() && pollTimer) {
          globalThis.clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 250);
      giveUpTimer = globalThis.setTimeout(() => {
        if (pollTimer) globalThis.clearInterval(pollTimer);
      }, 15000);
    }

    return () => {
      if (pollTimer) globalThis.clearInterval(pollTimer);
      if (giveUpTimer) globalThis.clearTimeout(giveUpTimer);
      if (youtubeReadyWatchdogRef.current) {
        globalThis.clearTimeout(youtubeReadyWatchdogRef.current);
        youtubeReadyWatchdogRef.current = null;
      }
      if (youtubePollTimerRef.current) {
        globalThis.clearInterval(youtubePollTimerRef.current);
        youtubePollTimerRef.current = null;
      }
      const player = youtubePlayerRef.current;
      // Flush an open segment before teardown (SPA navigate-away / video-change backstop).
      if (player && progressReference.current.isPlaying) {
        try {
          closeCurrentSegmentRef.current(player.getCurrentTime(), player.getVideoUrl(), youtubeVideoId);
        } catch {
          /* ignore read/close errors during teardown */
        }
        progressReference.current.isPlaying = false;
      }
      if (player?.destroy) {
        try {
          player.destroy();
        } catch {
          /* ignore */
        }
      }
      youtubePlayerRef.current = null;
      youtubePlayerCreatedRef.current = false;
      youtubeNodeRef.current?.replaceChildren();
    };
  }, [isYouTube, youtubeVideoId]);

  React.useEffect(() => {
    if (!userStorageScope || !canonicalVideoId) return;
    const videoUrl = embedSrc || "";

    const flushThreshold = () => {
      if (progressReference.current.thresholdLogged || thresholdSendInFlightRef.current) return;
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return;

      const segments = [...progressReference.current.segments];
      const openSegmentStart = progressReference.current.currentSegmentStart;
      const openSegmentEnd = progressReference.current.lastKnownTime;
      if (
        progressReference.current.isPlaying &&
        isValidNumber(openSegmentStart) &&
        isValidNumber(openSegmentEnd) &&
        openSegmentEnd > openSegmentStart
      ) {
        segments.push({ watchedSegmentStart: openSegmentStart, watchedSegmentEnd: openSegmentEnd });
      }
      const uniqueWatchedSeconds = getUniqueWatchedSeconds(mergeSegments(segments));
      const watchPercent = getWatchPercent(uniqueWatchedSeconds, totalVideoDurationInSeconds);
      if (watchPercent < VIDEO_WATCH_THRESHOLD) return;

      const eventDetails = createEventDetails("VIDEO_60_PERCENT_WATCHED", videoUrl, canonicalVideoId, {
        pageId,
        videoDurationSeconds: totalVideoDurationInSeconds,
        watchedSeconds: uniqueWatchedSeconds,
        watchPercent,
      });
      dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
      if (sendVideoEngagementBeacon(eventDetails)) {
        progressReference.current.thresholdLogged = true;
        saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
      }
    };

    const onPageHide = () => flushThreshold();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushThreshold();
    };

    globalThis.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      globalThis.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userStorageScope, canonicalVideoId, embedSrc, pageId, dispatch]);

  // Wistia: official player API (E-v1.js / _wq). This is the primary tracking path —
  // real play/pause/end events carry no payload and the postMessage protocol above is
  // undocumented, so duration and time ticks are only reliable through the API handle.
  React.useEffect(() => {
    if (!isWistia || !wistiaVideoId) return;

    let cancelled = false;
    let boundVideo: WistiaVideoApi | null = null;
    const boundHandlers: Array<[string, WistiaEventCallback]> = [];

    const bindVideoEvent = (video: WistiaVideoApi, eventName: string, handler: WistiaEventCallback) => {
      video.bind?.(eventName, handler);
      boundHandlers.push([eventName, handler]);
    };

    const wistiaQueue = (globalThis._wq = globalThis._wq || []);
    wistiaQueue.push({
      id: wistiaVideoId,
      onReady: (video: WistiaVideoApi) => {
        if (cancelled || boundVideo) return;
        boundVideo = video;
        wistiaApiAttachedRef.current = true;

        const readDuration = () => {
          try {
            const duration = video.duration?.();
            if (isValidNumber(duration) && duration > 0) {
              wistiaCallbacksRef.current.setTotalVideoDurationIfPresent(duration);
            }
          } catch {
            /* ignore duration read errors */
          }
        };
        readDuration();

        const readCurrentTime = (): number => {
          try {
            const time = video.time?.();
            return isValidNumber(time) ? time : progressReference.current.lastKnownTime ?? 0;
          } catch {
            return progressReference.current.lastKnownTime ?? 0;
          }
        };

        bindVideoEvent(video, "play", () => {
          readDuration();
          const time = readCurrentTime();
          const { embedSrc: videoUrl, startCurrentSegment, logPlayerEvent } = wistiaCallbacksRef.current;
          progressReference.current.isPlaying = true;
          startCurrentSegment(time);
          logPlayerEvent("VIDEO_PLAY", videoUrl || "", wistiaVideoId, time);
        });

        bindVideoEvent(video, "pause", () => {
          const time = readCurrentTime();
          const { embedSrc: videoUrl, closeCurrentSegment, logPlayerEvent } = wistiaCallbacksRef.current;
          progressReference.current.isPlaying = false;
          closeCurrentSegment(time, videoUrl || "", wistiaVideoId);
          progressReference.current.lastKnownTime = time;
          logPlayerEvent("VIDEO_PAUSE", videoUrl || "", wistiaVideoId, time);
        });

        bindVideoEvent(video, "end", () => {
          const time = readCurrentTime();
          const { embedSrc: videoUrl, closeCurrentSegment, logPlayerEvent } = wistiaCallbacksRef.current;
          progressReference.current.isPlaying = false;
          closeCurrentSegment(time, videoUrl || "", wistiaVideoId);
          progressReference.current.lastKnownTime = time;
          logPlayerEvent("VIDEO_ENDED", videoUrl || "", wistiaVideoId);
        });

        bindVideoEvent(video, "timechange", (t: unknown) => {
          if (!isValidNumber(t)) return;
          if (progressReference.current.totalVideoDurationInSeconds === null) readDuration();
          const { embedSrc: videoUrl, updatePlaybackProgress } = wistiaCallbacksRef.current;
          updatePlaybackProgress(t, videoUrl || "", wistiaVideoId);
        });
      },
    });

    return () => {
      cancelled = true;
      wistiaApiAttachedRef.current = false;
      if (boundVideo) {
        for (const [eventName, handler] of boundHandlers) {
          try {
            boundVideo.unbind?.(eventName, handler);
          } catch {
            /* ignore unbind errors during teardown */
          }
        }
      }
    };
  }, [isWistia, wistiaVideoId]);

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
                // wistia_embed lets E-v1.js discover the iframe and expose the player API (_wq onReady)
                className={isWistia ? "mw-100 wistia_embed" : "mw-100"}
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
