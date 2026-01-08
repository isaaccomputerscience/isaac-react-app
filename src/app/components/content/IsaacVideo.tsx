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
  type: "VIDEO_PLAY" | "VIDEO_PAUSE" | "VIDEO_ENDED";
  videoUrl: string;
  videoPosition?: number;
  pageId?: string;
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

interface YouTubePlayer {
  getVideoUrl: () => string;
  getCurrentTime: () => number;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
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

/**
 * Log video events to the backend
 */
async function logVideoEvent(
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
function createEventDetails(
  type: VideoEventDetails["type"],
  videoUrl: string,
  pageId?: string,
  videoPosition?: number,
): VideoEventDetails {
  const details: VideoEventDetails = { type, videoUrl };
  if (pageId) details.pageId = pageId;
  if (videoPosition !== undefined) details.videoPosition = videoPosition;
  return details;
}

function onPlayerStateChange(event: YouTubeEvent, pageId?: string, dispatch?: ReturnType<typeof useAppDispatch>): void {
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

  const eventDetails = createEventDetails(
    eventType,
    videoUrl,
    pageId,
    eventType === "VIDEO_ENDED" ? undefined : videoPosition,
  );

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
  const pageId = (page && page !== NOT_FOUND && page.id) || undefined;
  const embedSrc = src && rewrite(src);
  const altTextToUse = `Embedded video: ${altText || src}.`;

  const wistiaIframeRef = useRef<HTMLIFrameElement>(null);

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

  // Load Wistia API script
  React.useEffect(() => {
    if (!isWistia || globalThis.Wistia) return;

    const script = document.createElement("script");
    script.src = "https://fast.wistia.com/assets/external/E-v1.js";
    script.async = true;
    document.body.appendChild(script);
  }, [isWistia]);

  // Setup Wistia tracking using postMessage API
  //
  // Wistia's iframe postMessage API allows us to track video events and position.
  // We explicitly bind to play, pause, end, timechange, and secondchange events.
  // The timechange/secondchange events continuously update our local lastKnownTime variable,
  // which is then used when logging play/pause/end events to capture accurate video positions.
  React.useEffect(() => {
    if (!isWistia || !wistiaVideoId || !wistiaIframeRef.current) return;

    const iframe = wistiaIframeRef.current;
    let lastKnownTime = 0;

    // Event type mapping for video events
    const eventTypeMap: Record<string, VideoEventDetails["type"]> = {
      play: "VIDEO_PLAY",
      playing: "VIDEO_PLAY",
      pause: "VIDEO_PAUSE",
      paused: "VIDEO_PAUSE",
      end: "VIDEO_ENDED",
      ended: "VIDEO_ENDED",
    };

    const isValidWistiaOrigin = (origin: string): boolean => {
      return VIDEO_PLATFORMS.WISTIA.allowedOrigins.some(
        (allowed) => origin === allowed || origin.endsWith(".wistia.net") || origin.endsWith(".wistia.com"),
      );
    };

    const updateTimeFromEventData = (eventData: WistiaEventData): void => {
      if (typeof eventData.seconds === "number") {
        lastKnownTime = eventData.seconds;
      } else if (typeof eventData.secondsWatched === "number") {
        lastKnownTime = eventData.secondsWatched;
      }
    };

    const updateTimeFromArgs = (args: Array<string | number | Record<string, unknown>>): void => {
      if (typeof args[1] === "number") {
        lastKnownTime = args[1];
      } else if (typeof (args[1] as WistiaEventData)?.seconds === "number") {
        lastKnownTime = (args[1] as WistiaEventData).seconds as number;
      }
    };

    const handleVideoEvent = (eventName: string, eventData: WistiaEventData): void => {
      updateTimeFromEventData(eventData);

      const eventType = eventTypeMap[eventName.toLowerCase()];
      if (!eventType) return;

      const eventDetails = createEventDetails(
        eventType,
        embedSrc || "",
        pageId,
        eventType === "VIDEO_ENDED" ? undefined : lastKnownTime,
      );

      logVideoEvent(eventDetails, dispatch);
    };

    const isTimeChangeEvent = (eventName: string): boolean => {
      return eventName === "timechange" || eventName === "secondchange";
    };

    const handleWistiaMessage = (event: MessageEvent): void => {
      if (!isValidWistiaOrigin(event.origin)) return;

      try {
        const data: WistiaPostMessageData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.method !== "_trigger" || !Array.isArray(data.args) || data.args.length === 0) {
          return;
        }

        const eventName = data.args[0] as string;
        const eventData = (data.args[1] || {}) as WistiaEventData;

        if (isTimeChangeEvent(eventName)) {
          updateTimeFromArgs(data.args);
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

    // Setup Wistia bindings once iframe is loaded
    const setupWistiaBindings = () => {
      if (iframe.contentWindow) {
        // Bind to all the events we care about
        const eventsToTrack = ["play", "pause", "end", "timechange", "secondchange"];
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
    };
  }, [isWistia, wistiaVideoId, embedSrc, pageId, dispatch]);

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
              onStateChange: (event: YouTubeEvent) => onPlayerStateChange(event, pageId, dispatch),
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
    [dispatch, pageId, youtubeVideoId],
  );

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
