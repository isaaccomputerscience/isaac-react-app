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
    // Wistia's E-v1.js embed exposes a `_wq` command queue; pushing a handler with an
    // `onReady` callback yields a video API object we can read the true duration from.
    _wq?: Array<{ id: string; onReady?: (video: WistiaVideoApi) => void; [key: string]: unknown }>;
  }

  // eslint-disable-next-line no-var
  var YT: Window["YT"];
  // eslint-disable-next-line no-var
  var Wistia: Window["Wistia"];
  // eslint-disable-next-line no-var
  var _wq: Window["_wq"];
}

interface WistiaVideoApi {
  duration?: () => number;
  time?: () => number;
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
 * TODO(#855) TEMPORARY diagnostic logging for the video KPI flow — currently logs unconditionally on every
 * environment (including production). MUST be removed (this block and its call sites) before the prod release.
 */
export function videoDebugLog(message: string, data?: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line no-console
    console.info(`[video-kpi] ${message}`, data ?? "");
  } catch {
    // ignore (e.g. console unavailable)
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

  videoDebugLog("logVideoEvent -> POST /log", {
    type: eventDetails.type,
    videoId: eventDetails.videoId,
    watchPercent: eventDetails.watchPercent,
    watchedSeconds: eventDetails.watchedSeconds,
    videoDurationSeconds: eventDetails.videoDurationSeconds,
    dispatched: Boolean(dispatch),
  });

  try {
    await api.logger.log(eventDetails);
    videoDebugLog("logVideoEvent POST /log succeeded", { type: eventDetails.type, videoId: eventDetails.videoId });
  } catch (error) {
    videoDebugLog("logVideoEvent POST /log FAILED", {
      type: eventDetails.type,
      videoId: eventDetails.videoId,
      error: error instanceof Error ? error.message : String(error),
    });
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to log video event:", error);
    }
  }
}

/**
 * Reliably POST a video-engagement event to /log when the page is being hidden/unloaded.
 *
 * A normal in-page XHR/axios POST is cancelled by the browser on navigation or tab close, which
 * silently drops a threshold reached at the last moment. fetch with `keepalive: true` matches the
 * existing axios request (same JSON content type + credentials, so it satisfies the identical
 * cookie auth and CORS) but is allowed to outlive the document. Returns whether the request was
 * dispatched (not whether the server accepted it — there is no response to await during unload).
 */
export function sendVideoEngagementBeacon(eventDetails: VideoEventDetails): boolean {
  try {
    void fetch(`${API_PATH}/log`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventDetails),
      keepalive: true,
    });
    videoDebugLog("sendVideoEngagementBeacon dispatched", {
      videoId: eventDetails.videoId,
      watchPercent: eventDetails.watchPercent,
    });
    return true;
  } catch (error) {
    videoDebugLog("sendVideoEngagementBeacon FAILED", {
      videoId: eventDetails.videoId,
      error: error instanceof Error ? error.message : String(error),
    });
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
  // The YouTube iframe API is loaded `async` (public/index.html), so `globalThis.YT` is often not
  // yet defined when this component's div mounts. The ref callback captures the node here; a waiter
  // effect then constructs the player as soon as YT is available. `youtubePlayerCreatedRef` guards
  // against constructing twice (ref callback re-fire + waiter poll).
  const youtubeNodeRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerCreatedRef = useRef<boolean>(false);
  // Prevents re-sending VIDEO_60_PERCENT_WATCHED while an attempt is in flight. Because the KPI is
  // now only persisted (thresholdLogged) after the backend confirms, without this guard the
  // per-tick playback check would fire duplicate requests until the first one resolved.
  const thresholdSendInFlightRef = useRef<boolean>(false);

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

  // TODO(#855) TEMPORARY diagnostic: log the resolved tracking scope whenever it changes, so it is
  // obvious whether the 60% KPI is enabled on this video and, if not, exactly why.
  React.useEffect(() => {
    videoDebugLog("scope resolved", {
      userStorageScope,
      canonicalVideoId,
      loggedIn: Boolean(user),
      trackingEnabled: Boolean(userStorageScope && canonicalVideoId),
      reason: !userStorageScope ? "not-logged-in" : !canonicalVideoId ? "no-canonical-video-id" : "enabled",
    });
  }, [userStorageScope, canonicalVideoId, user]);

  const setTotalVideoDurationIfPresent = useCallback(
    (totalVideoDurationInSeconds: number | null | undefined) => {
      if (!canonicalVideoId || !isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) return;
      if (progressReference.current.totalVideoDurationInSeconds === totalVideoDurationInSeconds) return;
      progressReference.current.totalVideoDurationInSeconds = totalVideoDurationInSeconds;
      saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
      videoDebugLog("video duration captured", { videoId: canonicalVideoId, totalVideoDurationInSeconds });
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
        videoDebugLog("checkIf60% skipped", {
          videoId,
          reason: !userStorageScope
            ? "not-logged-in"
            : !canonicalVideoId
            ? "no-video-id"
            : progressReference.current.thresholdLogged
            ? "already-logged-this-video"
            : "send-in-flight",
        });
        return;
      }
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) {
        videoDebugLog("checkIf60% skipped", { videoId, reason: "no-duration-yet", totalVideoDurationInSeconds });
        return;
      }

      // Include the segment currently being watched (not yet committed while playing straight through) so the
      // KPI fires as soon as cumulative watch time crosses the threshold, without needing a pause/seek/end/unmount.
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
        videoDebugLog("checkIf60% below threshold", {
          videoId,
          watchPercent: Number(watchPercent.toFixed(3)),
          uniqueWatchedSeconds: Number(uniqueWatchedSeconds.toFixed(1)),
          totalVideoDurationInSeconds,
        });
        return;
      }

      videoDebugLog("checkIf60% THRESHOLD REACHED -> logging", {
        videoId,
        watchPercent: Number(watchPercent.toFixed(3)),
        uniqueWatchedSeconds: Number(uniqueWatchedSeconds.toFixed(1)),
        totalVideoDurationInSeconds,
      });

      const eventDetails = createEventDetails("VIDEO_60_PERCENT_WATCHED", videoUrl, videoId, {
        pageId,
        videoDurationSeconds: totalVideoDurationInSeconds,
        watchedSeconds: uniqueWatchedSeconds,
        watchPercent,
      });

      // Block duplicate sends from later playback ticks until this attempt resolves.
      thresholdSendInFlightRef.current = true;
      // Keep the redux LOG_EVENT dispatch (analytics + observability), but only persist
      // thresholdLogged once the backend has accepted the event. Previously the flag was set
      // optimistically before the POST, so any failure (transient network, or a backend that
      // wasn't accepting the event yet) permanently suppressed the KPI for that user+video.
      dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
      api.logger
        .log(eventDetails)
        .then(() => {
          progressReference.current.thresholdLogged = true;
          saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
          videoDebugLog("VIDEO_60_PERCENT_WATCHED recorded; thresholdLogged persisted", { videoId });
        })
        .catch((error) => {
          videoDebugLog("VIDEO_60_PERCENT_WATCHED POST failed; will retry on next update", {
            videoId,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          thresholdSendInFlightRef.current = false;
        });
    },
    [canonicalVideoId, dispatch, pageId, userStorageScope],
  );

  const appendSegment = useCallback(
    (segmentStart: number, segmentEnd: number, videoId: string, videoUrl: string) => {
      // TODO(#855) TEMPORARY diagnostic: log each condition that gates whether a watched segment is
      // recorded (and therefore whether the 60% check can eventually fire), with the deciding values.
      if (!userStorageScope) {
        videoDebugLog("appendSegment SKIPPED", { reason: "not-logged-in", segmentStart, segmentEnd });
        return;
      }
      const totalVideoDurationInSeconds = progressReference.current.totalVideoDurationInSeconds;
      if (!isValidNumber(totalVideoDurationInSeconds) || totalVideoDurationInSeconds <= 0) {
        videoDebugLog("appendSegment SKIPPED", { reason: "duration-unknown", totalVideoDurationInSeconds });
        return;
      }

      const clampedStart = clampVideoProgressValue(segmentStart, 0, totalVideoDurationInSeconds);
      const clampedEnd = clampVideoProgressValue(segmentEnd, 0, totalVideoDurationInSeconds);
      if (clampedEnd - clampedStart < 0.5) {
        videoDebugLog("appendSegment SKIPPED", { reason: "segment-too-short", clampedStart, clampedEnd });
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
    // TODO(#855) diagnostic: mark the exact position a new watched segment opens.
    videoDebugLog("startCurrentSegment", { segmentStart: Number(segmentStart.toFixed(1)) });
  }, []);

  const closeCurrentSegment = useCallback(
    (segmentEnd: number, videoUrl: string, videoId: string) => {
      const currentSegmentStart = progressReference.current.currentSegmentStart;
      if (!isValidNumber(currentSegmentStart)) {
        // TODO(#855) diagnostic: closing with no open segment usually means play/pause bookkeeping got out of sync.
        videoDebugLog("closeCurrentSegment SKIPPED", {
          reason: "no-open-segment",
          segmentEnd: Number(segmentEnd.toFixed(1)),
        });
        return;
      }
      videoDebugLog("closeCurrentSegment", {
        from: Number(currentSegmentStart.toFixed(1)),
        to: Number(segmentEnd.toFixed(1)),
      });
      appendSegment(currentSegmentStart, segmentEnd, videoId, videoUrl);
      progressReference.current.currentSegmentStart = null;
    },
    [appendSegment],
  );

  // Latest closeCurrentSegment, read by the YouTube teardown below without making that effect depend on
  // (and therefore re-run + tear the player down on) every callback identity change.
  const closeCurrentSegmentRef = useRef(closeCurrentSegment);
  closeCurrentSegmentRef.current = closeCurrentSegment;

  // this function is used to update the playback progress of the video, and detect seeks by comparing the current time with the last known time.
  const updatePlaybackProgress = useCallback(
    (currentTime: number, videoUrl: string, videoId: string) => {
      if (!isValidNumber(currentTime)) {
        // TODO(#855) diagnostic: getCurrentTime() returned a non-number (player not ready?).
        videoDebugLog("updatePlaybackProgress IGNORED", { reason: "current-time-not-a-number", currentTime });
        return;
      }
      const lastKnownTime = progressReference.current.lastKnownTime;
      if (!progressReference.current.isPlaying || !isValidNumber(lastKnownTime)) {
        // TODO(#855) diagnostic: this is the silent branch — a tick arrives but is dropped before any
        // "playback tick" log because we think we're not playing or have no baseline time. If ticks
        // vanish here while the video is visibly playing, isPlaying never got set true on PLAYING.
        videoDebugLog("updatePlaybackProgress IGNORED", {
          reason: !progressReference.current.isPlaying ? "not-playing" : "no-baseline-time",
          isPlaying: progressReference.current.isPlaying,
          lastKnownTime,
          currentTime: Number(currentTime.toFixed(1)),
        });
        progressReference.current.lastKnownTime = currentTime;
        return;
      }

      const diff = currentTime - lastKnownTime;
      const isSeek = Math.abs(diff) > SEEK_DETECTION_TOLERANCE_SECONDS;
      if (isSeek) {
        // TODO(#855) diagnostic: a seek splits the open segment; log it so jumps vs. straight play are visible.
        videoDebugLog("seek detected", {
          from: Number(lastKnownTime.toFixed(1)),
          to: Number(currentTime.toFixed(1)),
          diff: Number(diff.toFixed(1)),
        });
        closeCurrentSegment(lastKnownTime, videoUrl, videoId);
        startCurrentSegment(currentTime);
      }
      progressReference.current.lastKnownTime = currentTime;

      // TODO(#855) diagnostic: log every playback tick regardless of login state, so the watch progress and the
      // logged-in/anonymous state are visible even for anonymous sessions (the KPI itself stays logged-in only).
      const tickTotalDuration = progressReference.current.totalVideoDurationInSeconds;
      const positionPercent =
        isValidNumber(tickTotalDuration) && tickTotalDuration > 0 ? currentTime / tickTotalDuration : null;
      videoDebugLog("playback tick", {
        videoId,
        loggedIn: Boolean(userStorageScope),
        userStorageScope,
        currentTime: Number(currentTime.toFixed(1)),
        totalVideoDurationInSeconds: tickTotalDuration,
        positionPercent: positionPercent == null ? null : Number(positionPercent.toFixed(3)),
        crossed60ByPosition: positionPercent != null && positionPercent >= VIDEO_WATCH_THRESHOLD,
      });

      // Evaluate the KPI live during playback (counting the open segment) so it fires without needing a
      // pause/seek/end/navigation — otherwise a straight watch-through or a tab close never logs the event.
      checkIf60PercentWatchedAndLog(videoId, videoUrl, currentTime);
    },
    [checkIf60PercentWatchedAndLog, closeCurrentSegment, startCurrentSegment, userStorageScope],
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
    if (!isWistia) return;
    if (globalThis.Wistia) {
      // TODO(#855) diagnostic: Wistia API already present; no injection needed.
      videoDebugLog("Wistia API already loaded");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://fast.wistia.com/assets/external/E-v1.js";
    script.async = true;
    script.addEventListener("load", () => videoDebugLog("Wistia API script LOADED"));
    script.addEventListener("error", () => videoDebugLog("Wistia API script FAILED to load"));
    document.body.appendChild(script);
    // TODO(#855) diagnostic: injected the Wistia embed script.
    videoDebugLog("Wistia API script injected");
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
      // TODO(#855) diagnostic: log every Wistia lifecycle event, mapped type included. If mapped events
      // never appear while the video plays, the postMessage bindings never took (see "Wistia bindings sent").
      videoDebugLog("Wistia event", {
        eventName,
        mappedType: eventType ?? "(unmapped/ignored)",
        eventTime: Number(eventTime.toFixed(1)),
        duration: totalVideoDurationInSeconds,
      });
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
      if (!isWistiaMessageForIframe(event, iframe.contentWindow)) {
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
        // TODO(#855) diagnostic: bind messages posted to the Wistia iframe. Without these, no Wistia
        // events arrive and the tracker stays silent after "scope resolved".
        videoDebugLog("Wistia bindings sent", { wistiaVideoId, events: eventsToTrack });
      } else {
        // TODO(#855) diagnostic: iframe had no contentWindow after the 1s delay — bindings never sent.
        videoDebugLog("Wistia bindings SKIPPED", { reason: "no-iframe-contentWindow", wistiaVideoId });
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
    // TODO(#855) diagnostic: the 1s progress poll has stopped (pause/end/unmount).
    videoDebugLog("YouTube poll timer STOPPED");
  }, []);

  const pollYouTubePlayerProgress = useCallback(() => {
    const player = youtubePlayerRef.current;
    if (!player || !youtubeVideoId) {
      // TODO(#855) diagnostic: poll fired but we have no player/videoId to read from.
      videoDebugLog("YouTube poll SKIPPED", { hasPlayer: Boolean(player), youtubeVideoId });
      return;
    }
    const currentTime = player.getCurrentTime();
    // TODO(#855) diagnostic: raw poll reading, before updatePlaybackProgress decides to keep or drop it.
    videoDebugLog("YouTube poll", {
      currentTime: isValidNumber(currentTime) ? Number(currentTime.toFixed(1)) : currentTime,
    });
    updatePlaybackProgress(currentTime, player.getVideoUrl(), youtubeVideoId);
  }, [updatePlaybackProgress, youtubeVideoId]);

  const startYouTubePollTimer = useCallback(() => {
    stopYouTubePollTimer();
    youtubePollTimerRef.current = globalThis.setInterval(pollYouTubePlayerProgress, 1000);
    // TODO(#855) diagnostic: the 1s progress poll has started (should follow every PLAYING).
    videoDebugLog("YouTube poll timer STARTED");
  }, [pollYouTubePlayerProgress, stopYouTubePollTimer]);

  const handleYouTubePlayerReady = useCallback(
    (event: YouTubeEvent) => {
      youtubePlayerRef.current = event.target;
      const duration = event.target.getDuration();
      // TODO(#855) diagnostic: onReady fired — player object exists and duration should be known.
      videoDebugLog("YouTube onReady", { youtubeVideoId, duration });
      setTotalVideoDurationIfPresent(duration);
    },
    [setTotalVideoDurationIfPresent, youtubeVideoId],
  );

  const handleYouTubePlayerStateChange = useCallback(
    (event: YouTubeEvent) => {
      const YT = globalThis.YT;
      // TODO(#855) diagnostic: name the raw YT state so the console reads playing/paused/ended/buffering/cued
      // instead of -1..5. -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
      const stateName =
        (
          { [-1]: "unstarted", 0: "ended", 1: "playing", 2: "paused", 3: "buffering", 5: "cued" } as Record<
            number,
            string
          >
        )[event.data] ?? String(event.data);
      videoDebugLog("YouTube onStateChange", {
        youtubeVideoId,
        rawState: event.data,
        stateName,
        ytPresent: Boolean(YT),
      });
      if (!YT || !youtubeVideoId) {
        // TODO(#855) diagnostic: if this fires we can never process play/pause/end — the whole KPI is dead here.
        videoDebugLog("handleYouTubePlayerStateChange BAILED", {
          reason: !YT ? "no-YT-global" : "no-youtube-video-id",
        });
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

  // YouTube video initialization. The ref callback only *captures the node* — it does NOT construct the
  // player, because YT may not be loaded yet at mount. Construction happens in the waiter effect below.
  const youtubeRef = useCallback(
    (node: HTMLDivElement | null) => {
      youtubeNodeRef.current = node;
      // TODO(#855) diagnostic: entry point of the YouTube KPI chain. `ytPresent:false` here just means the
      // async iframe API had not loaded yet — the waiter effect will construct the player once it does.
      videoDebugLog("youtubeRef invoked (node captured)", {
        hasNode: Boolean(node),
        youtubeVideoId,
        ytPresent: Boolean(globalThis.YT),
      });
    },
    [youtubeVideoId],
  );

  const handleYouTubePlayerError = useCallback(
    (event: YouTubeEvent) => {
      // TODO(#855) diagnostic: YouTube reported a player error (2 invalid id, 5 html5, 100 not found,
      // 101/150 embedding disabled). The KPI cannot run if the video refuses to embed/play.
      videoDebugLog("YouTube onError", { youtubeVideoId, errorCode: event.data });
    },
    [youtubeVideoId],
  );

  // The player is constructed exactly once, but auth (userStorageScope) and the page doc (pageId) can
  // resolve AFTER construction. So we register STABLE wrapper handlers that always dispatch to the latest
  // handler via these refs — otherwise the player would forever call handlers that closed over the
  // logged-out / no-pageId state, and never log play/pause or the KPI once the user is actually scoped.
  const handleYouTubePlayerReadyRef = useRef(handleYouTubePlayerReady);
  handleYouTubePlayerReadyRef.current = handleYouTubePlayerReady;
  const handleYouTubePlayerStateChangeRef = useRef(handleYouTubePlayerStateChange);
  handleYouTubePlayerStateChangeRef.current = handleYouTubePlayerStateChange;
  const handleYouTubePlayerErrorRef = useRef(handleYouTubePlayerError);
  handleYouTubePlayerErrorRef.current = handleYouTubePlayerError;

  const createYouTubePlayer = useCallback(
    (container: HTMLDivElement) => {
      const YT = globalThis.YT;
      if (!YT || !youtubeVideoId || youtubePlayerCreatedRef.current) return;
      // Commit before the async YT.ready callback so the waiter poll cannot construct a second player.
      youtubePlayerCreatedRef.current = true;
      try {
        videoDebugLog("createYouTubePlayer -> YT.ready(register)", { youtubeVideoId });
        YT.ready(() => {
          // Hand YT a plain child node to replace with its <iframe>, NOT the React-managed container
          // itself. If YT swaps out a React-owned node, the next re-render reconciles that node out from
          // under the widget and the enablejsapi postMessage handshake targets the wrong window
          // ("recipient origin = app origin") — so onReady/onStateChange never fire even though the video
          // plays. React only owns the (childless) container; this child is invisible to its reconciler.
          const playerHost = document.createElement("div");
          playerHost.className = "mw-100";
          container.replaceChildren(playerHost);
          videoDebugLog("YT.ready fired -> new YT.Player", { youtubeVideoId });
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
              onError: (event: YouTubeEvent) => handleYouTubePlayerErrorRef.current(event),
            },
          });
        });
      } catch (error) {
        youtubePlayerCreatedRef.current = false; // allow a later retry
        const errorMessage = error instanceof Error ? error.message : "problem with YT library";
        console.error("Error with YouTube library: ", error);
        videoDebugLog("createYouTubePlayer THREW", { youtubeVideoId, error: errorMessage });
        ReactGA.gtag("event", "exception", {
          description: `youtube_error: ${errorMessage}`,
          fatal: false,
        });
      }
    },
    [youtubeVideoId],
  );

  // Latest createYouTubePlayer, read by the waiter effect so it can construct with the current callbacks
  // WITHOUT listing createYouTubePlayer as a dependency — otherwise every callback-identity change would
  // re-run the effect, reset the guard, and build a second competing player on the same node.
  const createYouTubePlayerRef = useRef(createYouTubePlayer);
  createYouTubePlayerRef.current = createYouTubePlayer;

  // Waiter + lifecycle owner for the YouTube player. Depends ONLY on the platform/video id, so unrelated
  // re-renders never tear the player down or rebuild it. It (1) constructs the player as soon as both the
  // container is mounted and the async YT API is loaded, and (2) on video change / unmount, flushes any
  // open watched segment, stops the poll, and destroys the player so the next construction starts clean.
  React.useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;
    youtubePlayerCreatedRef.current = false; // fresh video id -> allow a new construction
    let pollTimer: ReturnType<typeof globalThis.setInterval> | null = null;
    let giveUpTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

    const tryCreate = (): boolean => {
      const node = youtubeNodeRef.current;
      if (youtubePlayerCreatedRef.current) return true;
      if (!node) {
        videoDebugLog("YT waiter: waiting for node");
        return false;
      }
      if (!globalThis.YT) {
        videoDebugLog("YT waiter: waiting for YT API to load");
        return false;
      }
      videoDebugLog("YT waiter: node + YT ready -> creating player", { youtubeVideoId });
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
      // Give up after a bounded wait so we do not poll forever if the API script failed to load at all.
      giveUpTimer = globalThis.setTimeout(() => {
        if (pollTimer) globalThis.clearInterval(pollTimer);
        if (!youtubePlayerCreatedRef.current) {
          videoDebugLog("YT waiter: GAVE UP (YT API never loaded / node never mounted)", {
            youtubeVideoId,
            hadNode: Boolean(youtubeNodeRef.current),
            ytPresent: Boolean(globalThis.YT),
          });
        }
      }, 15000);
    }

    return () => {
      if (pollTimer) globalThis.clearInterval(pollTimer);
      if (giveUpTimer) globalThis.clearTimeout(giveUpTimer);
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
      videoDebugLog("YT waiter cleanup: segment flushed + player destroyed", { youtubeVideoId });
    };
  }, [isYouTube, youtubeVideoId]);

  // Unload-safe backstop: when the page is hidden/closed, flush the open segment and, if the 60%
  // threshold is met but not yet logged, send it via keepalive fetch — a normal POST is cancelled
  // on unload. This covers a viewer who crosses the threshold and immediately leaves the page.
  React.useEffect(() => {
    if (!userStorageScope || !canonicalVideoId) return;
    const videoUrl = embedSrc || "";

    const flushThreshold = (reason: string) => {
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
      videoDebugLog("flushThreshold sending on page hide", { reason, videoId: canonicalVideoId, watchPercent });
      dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
      // Beacon is fire-and-forget; mark logged optimistically so a following hide event does not
      // double-send. A keepalive request is reliably queued once dispatched.
      if (sendVideoEngagementBeacon(eventDetails)) {
        progressReference.current.thresholdLogged = true;
        saveVideoProgress(userStorageScope, canonicalVideoId, progressReference.current);
      }
    };

    const onPageHide = () => flushThreshold("pagehide");
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushThreshold("visibilitychange:hidden");
    };

    globalThis.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      globalThis.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userStorageScope, canonicalVideoId, embedSrc, pageId, dispatch]);

  // Wistia: read the true duration via the Wistia JS API. The postMessage "duration" field is not
  // always present, and without a duration the coverage/threshold calculation is skipped — so
  // Wistia videos could otherwise never fire VIDEO_60_PERCENT_WATCHED.
  React.useEffect(() => {
    if (!isWistia || !wistiaVideoId) return;
    const wistiaQueue = (globalThis._wq = globalThis._wq || []);
    wistiaQueue.push({
      id: wistiaVideoId,
      onReady: (video: WistiaVideoApi) => {
        try {
          const duration = video.duration?.();
          videoDebugLog("Wistia onReady duration", { wistiaVideoId, duration });
          if (isValidNumber(duration) && duration > 0) {
            setTotalVideoDurationIfPresent(duration);
          }
        } catch (error) {
          videoDebugLog("Wistia duration read failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });
  }, [isWistia, wistiaVideoId, setTotalVideoDurationIfPresent]);

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
