import React from "react";
import { act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  IsaacVideo,
  isValidWistiaOrigin,
  isWistiaTimeChangeEvent,
  logVideoEvent,
  pauseAllVideos,
  processWistiaMessage,
  rewrite,
  updateWistiaTimeFromArgs,
  updateWistiaTimeFromEventData,
} from "../../../../app/components/content/IsaacVideo";
import { ACTION_TYPE, api } from "../../../../app/services";
import { renderTestEnvironment } from "../../../utils";
import { store } from "../../../../app/state";

describe("rewrite", () => {
  it("parses youtube url to iframe src", () => {
    const parsedUrl = rewrite("https://www.youtube.com/watch?v=test123ABCde");
    expect(parsedUrl).toEqual(
      "https://www.youtube-nocookie.com/embed/test123ABCd?enablejsapi=1&rel=0&fs=1&modestbranding=1&origin=http://localhost",
    );
  });

  it("parses wistia embed url to iframe src", () => {
    const parsedUrl = rewrite("https://www.wistia.com/medias/glytlhepl5");
    expect(parsedUrl).toEqual(
      "https://fast.wistia.net/embed/iframe/glytlhepl5?videoFoam=true&playerColor=1fadad&wmode=transparent",
    );
  });
});

type VideoEventDispatch = NonNullable<Parameters<typeof logVideoEvent>[1]>;

describe("logVideoEvent", () => {
  const eventDetails = {
    type: "VIDEO_PLAY" as const,
    videoId: "test123ABCde",
    videoUrl: "https://www.youtube.com/watch?v=test123ABCde",
    pageId: "page-1",
    videoPosition: 10,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("dispatches LOG_EVENT and calls the logger API when dispatch is provided", async () => {
    const dispatch = jest.fn() as VideoEventDispatch;
    const logSpy = jest.spyOn(api.logger, "log").mockResolvedValue({} as never);

    await logVideoEvent(eventDetails, dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
    expect(logSpy).toHaveBeenCalledWith(eventDetails);
  });

  it("calls only the logger API when dispatch is omitted", async () => {
    const dispatch = jest.fn() as VideoEventDispatch;
    const logSpy = jest.spyOn(api.logger, "log").mockResolvedValue({} as never);

    await logVideoEvent(eventDetails);

    expect(dispatch).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(eventDetails);
  });

  it("does not throw when the logger API fails", async () => {
    jest.spyOn(api.logger, "log").mockRejectedValue(new Error("network error"));

    await expect(logVideoEvent(eventDetails)).resolves.toBeUndefined();
  });
});

describe("YouTube player handlers", () => {
  const originalYT = globalThis.YT;
  const youtubeSrc = "https://www.youtube.com/watch?v=test123ABCde";
  const youtubeVideoId = "test123ABCd";

  interface CapturedYouTubePlayerConfig {
    events?: {
      onReady?: (event: { target: typeof mockPlayer; data: number }) => void;
      onStateChange?: (event: { target: typeof mockPlayer; data: number }) => void;
    };
  }

  let capturedPlayerConfig: CapturedYouTubePlayerConfig | null = null;

  const mockPlayer = {
    getVideoUrl: () => youtubeSrc,
    getCurrentTime: () => 30,
    getDuration: () => 120,
  };

  class MockYTPlayer {
    constructor(_node: HTMLElement, config: CapturedYouTubePlayerConfig) {
      capturedPlayerConfig = config;
      config.events?.onReady?.({ target: mockPlayer, data: 0 });
    }
  }

  const IsaacVideoHarness = () => <IsaacVideo doc={{ type: "video", src: youtubeSrc, altText: "Test video" }} />;

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    capturedPlayerConfig = null;
    jest.spyOn(api.logger, "log").mockResolvedValue({} as never);
    jest.spyOn(store, "dispatch");

    globalThis.YT = {
      Player: MockYTPlayer as never,
      ready: (callback: () => void) => callback(),
      PlayerState: {
        PLAYING: 1,
        PAUSED: 2,
        ENDED: 0,
      },
    };
  });

  afterEach(() => {
    globalThis.YT = originalYT;
    jest.restoreAllMocks();
  });

  const renderYouTubeVideo = () => {
    renderTestEnvironment({
      role: "STUDENT",
      PageComponent: IsaacVideoHarness,
      initialRouteEntries: ["/"],
    });
  };

  it("registers onReady and onStateChange when the YouTube player is created", () => {
    renderYouTubeVideo();

    expect(capturedPlayerConfig?.events?.onReady).toBeDefined();
    expect(capturedPlayerConfig?.events?.onStateChange).toBeDefined();
  });

  it("onReady captures video duration for later tracking events", async () => {
    renderYouTubeVideo();
    await flushPromises();

    await act(async () => {
      capturedPlayerConfig?.events?.onStateChange?.({ target: mockPlayer, data: 1 });
    });
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPE.LOG_EVENT,
      eventDetails: {
        type: "VIDEO_PLAY",
        videoId: youtubeVideoId,
        videoUrl: youtubeSrc,
        videoPosition: 30,
        videoDurationSeconds: 120,
      },
    });
  });

  it.each([
    [1, "VIDEO_PLAY", 30],
    [2, "VIDEO_PAUSE", 30],
    [0, "VIDEO_ENDED", undefined],
  ])("onStateChange maps player state %i to %s", async (playerState, expectedEventType, videoPosition) => {
    renderYouTubeVideo();
    await flushPromises();

    await act(async () => {
      capturedPlayerConfig?.events?.onStateChange?.({ target: mockPlayer, data: playerState });
    });
    await flushPromises();

    const expectedEventDetails: Record<string, unknown> = {
      type: expectedEventType,
      videoId: youtubeVideoId,
      videoUrl: youtubeSrc,
      videoDurationSeconds: 120,
    };
    if (videoPosition !== undefined) {
      expectedEventDetails.videoPosition = videoPosition;
    }

    expect(store.dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPE.LOG_EVENT,
      eventDetails: expectedEventDetails,
    });
  });

  it("onStateChange ignores unhandled player states", async () => {
    renderYouTubeVideo();
    await flushPromises();

    const dispatchMock = store.dispatch as jest.Mock;
    dispatchMock.mockClear();

    await act(async () => {
      capturedPlayerConfig?.events?.onStateChange?.({ target: mockPlayer, data: 99 });
    });
    await flushPromises();

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});

describe("Wistia helpers", () => {
  it("accepts only supported Wistia origins", () => {
    expect(isValidWistiaOrigin("https://fast.wistia.net")).toBe(true);
    expect(isValidWistiaOrigin("https://embed.wistia.com")).toBe(true);
    expect(isValidWistiaOrigin("https://player.wistia.net")).toBe(true);
    expect(isValidWistiaOrigin("https://youtube.com")).toBe(false);
  });

  it("identifies time update event names", () => {
    expect(isWistiaTimeChangeEvent("timechange")).toBe(true);
    expect(isWistiaTimeChangeEvent("secondchange")).toBe(true);
    expect(isWistiaTimeChangeEvent("play")).toBe(false);
  });

  it("updates last known time from event payload and args payloads", () => {
    expect(updateWistiaTimeFromEventData(5, { seconds: 12 })).toBe(12);
    expect(updateWistiaTimeFromEventData(5, { secondsWatched: 9 })).toBe(9);
    expect(updateWistiaTimeFromEventData(5, {})).toBe(5);

    expect(updateWistiaTimeFromArgs(5, ["timechange", 18])).toBe(18);
    expect(updateWistiaTimeFromArgs(5, ["timechange", { seconds: 11 }])).toBe(11);
    expect(updateWistiaTimeFromArgs(5, ["timechange", { notSeconds: 1 }])).toBe(5);
  });

  it("processes timechange messages by updating time without emitting a video event", () => {
    const result = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["timechange", 17] }),
      {
        lastKnownTime: 3,
        embedSrc: "https://fast.wistia.net/embed/iframe/abc123",
        videoId: "abc123",
        pageId: "page-1",
      },
    );

    expect(result).toEqual({ lastKnownTime: 17 });
  });

  it("processes play and ended messages into tracking event payloads", () => {
    const playResult = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["play", { seconds: 21 }] }),
      {
        lastKnownTime: 3,
        embedSrc: "https://fast.wistia.net/embed/iframe/abc123",
        videoId: "abc123",
        pageId: "page-1",
      },
    );
    expect(playResult).toEqual({
      lastKnownTime: 21,
      eventDetails: {
        type: "VIDEO_PLAY",
        videoId: "abc123",
        videoUrl: "https://fast.wistia.net/embed/iframe/abc123",
        pageId: "page-1",
        videoPosition: 21,
      },
    });

    const endedResult = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["ended", { seconds: 60 }] }),
      {
        lastKnownTime: 21,
        embedSrc: "https://fast.wistia.net/embed/iframe/abc123",
        videoId: "abc123",
        pageId: "page-1",
      },
    );
    expect(endedResult).toEqual({
      lastKnownTime: 60,
      eventDetails: {
        type: "VIDEO_ENDED",
        videoId: "abc123",
        videoUrl: "https://fast.wistia.net/embed/iframe/abc123",
        pageId: "page-1",
      },
    });
  });

  it("ignores unsupported origins and non-trigger messages", () => {
    const originRejected = processWistiaMessage(
      "https://youtube.com",
      JSON.stringify({ method: "_trigger", args: ["play", { seconds: 12 }] }),
      {
        lastKnownTime: 7,
        embedSrc: "https://fast.wistia.net/embed/iframe/abc123",
        videoId: "abc123",
        pageId: "page-1",
      },
    );
    expect(originRejected).toEqual({ lastKnownTime: 7 });

    const methodRejected = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "noop", args: ["play", { seconds: 12 }] }),
      {
        lastKnownTime: 7,
        embedSrc: "https://fast.wistia.net/embed/iframe/abc123",
        videoId: "abc123",
        pageId: "page-1",
      },
    );
    expect(methodRejected).toEqual({ lastKnownTime: 7 });
  });
});

describe("pauseAllVideos", () => {
  it("sends pause commands to all iframe content windows", () => {
    const postMessage = jest.fn();
    const iframe = document.createElement("iframe");
    Object.defineProperty(iframe, "contentWindow", {
      value: { postMessage },
      configurable: true,
    });
    document.body.appendChild(iframe);

    pauseAllVideos();

    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ event: "command", func: "pauseVideo" }), "*");

    document.body.removeChild(iframe);
  });
});
