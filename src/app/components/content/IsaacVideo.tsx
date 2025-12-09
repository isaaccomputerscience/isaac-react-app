import React, { useCallback, useContext, useRef } from "react";
import { VideoDTO } from "../../../IsaacApiTypes";
import { selectors, useAppDispatch, useAppSelector } from "../../state";
import { NOT_FOUND, api, ACTION_TYPE } from "../../services";
import ReactGA from "react-ga4";
import { AccordionSectionContext } from "../../../IsaacAppTypes";

interface IsaacVideoProps {
  doc: VideoDTO;
}

// Type definitions for video event logging
interface VideoEventDetails {
  type: "VIDEO_PLAY" | "VIDEO_PAUSE" | "VIDEO_ENDED";
  videoUrl: string;
  videoPosition?: number;
  pageId?: string;
}

// Type definitions for Wistia postMessage data
interface WistiaPostMessageData {
  method: string;
  args: Array<string | Record<string, unknown>>;
}

interface WistiaEventData {
  secondsWatched?: number;
  [key: string]: unknown;
}

// Type definitions for YouTube Player API
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
}

export function rewrite(src: string) {
  // Detect platform by checking the hostname
  try {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return rewriteYouTube(src);
    } else if (hostname.includes("wistia.com") || hostname.includes("wistia.net")) {
      return rewriteWistia(src);
    }
  } catch {
    // Invalid URL, return undefined
  }
  return undefined;
}

function rewriteYouTube(src: string) {
  const possibleVideoId = /(v=|\/embed\/|\/)([^?&/.]{11})/.exec(src);
  const possibleStartTime = /[?&](t|start)=([0-9]+)/.exec(src);
  const possibleEndTime = /[?&]end=([0-9]+)/.exec(src);

  if (possibleVideoId) {
    const videoId = possibleVideoId[2];
    const optionalStart = possibleStartTime ? `&start=${possibleStartTime[2]}` : "";
    const optionalEnd = possibleEndTime ? `&end=${possibleEndTime[1]}` : "";
    return (
      `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&fs=1&modestbranding=1` +
      `${optionalStart}${optionalEnd}&origin=${window.location.origin}`
    );
  }
}

function rewriteWistia(src: string) {
  const possibleVideoId = /\/(?:embed\/iframe|medias)\/([a-zA-Z0-9]+)/.exec(src);

  if (possibleVideoId) {
    const videoId = possibleVideoId[1];
    // Add wmode=transparent to enable postMessage API
    return `https://fast.wistia.net/embed/iframe/${videoId}?videoFoam=true&playerColor=1fadad&wmode=transparent`;
  }
}

/**
 * Helper function to log video events to the backend
 * Calls the API directly (bypassing Redux middleware) to ensure reliable delivery
 */
async function logVideoEvent(
  eventDetails: VideoEventDetails,
  dispatch?: ReturnType<typeof useAppDispatch>,
): Promise<void> {
  // Dispatch to Redux for state management if needed
  if (dispatch) {
    dispatch({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
  }

  // Make the API call directly to ensure it happens
  try {
    await api.logger.log(eventDetails);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to log video event:", error);
    }
  }
}

function onPlayerStateChange(event: YouTubeEvent, pageId?: string, dispatch?: ReturnType<typeof useAppDispatch>): void {
  const YT = window.YT;
  if (!YT) return;

  const logEventDetails: VideoEventDetails = {
    type: "VIDEO_PLAY", // Will be overwritten below
    videoUrl: event.target.getVideoUrl(),
    videoPosition: event.target.getCurrentTime(),
  };

  if (pageId) {
    logEventDetails.pageId = pageId;
  }

  switch (event.data) {
    case YT.PlayerState.PLAYING:
      logEventDetails.type = "VIDEO_PLAY";
      break;
    case YT.PlayerState.PAUSED:
      logEventDetails.type = "VIDEO_PAUSE";
      break;
    case YT.PlayerState.ENDED:
      logEventDetails.type = "VIDEO_ENDED";
      delete logEventDetails.videoPosition;
      break;
    default:
      return; // Don't send a log message.
  }

  logVideoEvent(logEventDetails, dispatch);
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

  // Detect video platform using URL hostname (more secure than string.includes)
  const isYouTube = React.useMemo(() => {
    if (!src) return false;
    try {
      const url = new URL(src);
      const hostname = url.hostname.toLowerCase();
      return hostname.includes("youtube.com") || hostname.includes("youtu.be");
    } catch {
      return false;
    }
  }, [src]);

  const isWistia = React.useMemo(() => {
    if (!src) return false;
    try {
      const url = new URL(src);
      const hostname = url.hostname.toLowerCase();
      return hostname.includes("wistia.com") || hostname.includes("wistia.net");
    } catch {
      return false;
    }
  }, [src]);

  // Extract video ID for Wistia
  const wistiaVideoId = React.useMemo(() => {
    if (!isWistia || !embedSrc) return null;
    const match = embedSrc.match(/embed\/iframe\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }, [isWistia, embedSrc]);

  // Extract video ID for YouTube
  const youtubeVideoId = React.useMemo(() => {
    if (!isYouTube || !embedSrc) return null;
    const match = embedSrc.match(/embed\/([^?]+)/);
    return match ? match[1] : null;
  }, [isYouTube, embedSrc]);

  // Load Wistia API script
  React.useEffect(() => {
    if (!isWistia) return;

    // Check if Wistia script is already loaded
    if (window.Wistia) {
      return;
    }

    // eslint-disable-next-line no-script-url
    const script = document.createElement("script");
    script.src = "https://fast.wistia.com/assets/external/E-v1.js";
    script.async = true;
    // Note: Not using SRI (integrity attribute) because Wistia updates their scripts frequently
    // and this is a trusted official CDN already whitelisted in our CSP
    document.body.appendChild(script);
  }, [isWistia]);

  /**
   * Setup Wistia tracking using postMessage API
   *
   * Wistia sends postMessages in the format:
   * { method: '_trigger', args: ['eventName', { eventData }] }
   *
   * We listen for these messages and extract:
   * - Event name from args[0] (e.g., 'play', 'pause', 'end')
   * - Event data from args[1] (e.g., { secondsWatched: 5.2 })
   */
  React.useEffect(() => {
    if (!isWistia || !wistiaVideoId || !wistiaIframeRef.current) {
      return;
    }

    const handleWistiaMessage = (event: MessageEvent): void => {
      // Security: Strict origin verification for Wistia domains
      // Check that origin is exactly a Wistia domain (not just contains 'wistia')
      const allowedOrigins = [
        "https://fast.wistia.net",
        "https://fast.wistia.com",
        "https://embed-ssl.wistia.com",
        "https://embed-cloudfront.wistia.com",
      ];

      const isValidWistiaOrigin = allowedOrigins.some(
        (origin) =>
          event.origin === origin || event.origin.endsWith(".wistia.net") || event.origin.endsWith(".wistia.com"),
      );

      if (!isValidWistiaOrigin) {
        return;
      }

      try {
        const data: WistiaPostMessageData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        // Wistia sends messages in format: { method: '_trigger', args: ['eventName', {...}] }
        if (data.method === "_trigger" && Array.isArray(data.args) && data.args.length > 0) {
          const eventName = data.args[0] as string;
          const eventData = (data.args[1] || {}) as WistiaEventData;

          if (eventName === "play") {
            const eventDetails: VideoEventDetails = {
              type: "VIDEO_PLAY",
              videoUrl: embedSrc || "",
              videoPosition: eventData.secondsWatched || 0,
              ...(pageId && { pageId }),
            };
            logVideoEvent(eventDetails, dispatch);
          } else if (eventName === "pause") {
            const eventDetails: VideoEventDetails = {
              type: "VIDEO_PAUSE",
              videoUrl: embedSrc || "",
              videoPosition: eventData.secondsWatched || 0,
              ...(pageId && { pageId }),
            };
            logVideoEvent(eventDetails, dispatch);
          } else if (eventName === "end") {
            const eventDetails: VideoEventDetails = {
              type: "VIDEO_ENDED",
              videoUrl: embedSrc || "",
              ...(pageId && { pageId }),
            };
            logVideoEvent(eventDetails, dispatch);
          }
        }
      } catch (error) {
        // Silently ignore parsing errors from non-Wistia postMessages
        // Only log actual errors in development
        if (
          process.env.NODE_ENV === "development" &&
          error instanceof Error &&
          !error.message.includes("not valid JSON")
        ) {
          console.warn("Error handling Wistia message:", error);
        }
      }
    };

    window.addEventListener("message", handleWistiaMessage);

    return () => {
      window.removeEventListener("message", handleWistiaMessage);
    };
  }, [isWistia, wistiaVideoId, embedSrc, pageId, dispatch]);

  // YouTube video initialization
  const youtubeRef = useCallback(
    (node: HTMLDivElement | null) => {
      const YT = window.YT;
      if (node !== null && youtubeVideoId && YT) {
        try {
          YT.ready(function () {
            new YT.Player(node, {
              videoId: youtubeVideoId,
              playerVars: {
                enablejsapi: 1,
                rel: 0,
                fs: 1,
                modestbranding: 1,
                origin: window.location.origin,
              },
              events: {
                onStateChange: (event: YouTubeEvent) => {
                  onPlayerStateChange(event, pageId, dispatch);
                },
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
              // YouTube: Let the API create the iframe
              <div ref={youtubeRef} className="mw-100" title={altTextToUse} />
            ) : (
              // Wistia and others: Use regular iframe with ref
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
