import { AxiosHeaders, type AxiosResponse } from "axios";
import React, { useState } from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { mockUser } from "../../../../mocks/data";
import {
  clampVideoProgressValue,
  createEmptyVideoProgressState,
  createInitialVideoProgressState,
  extractVideoId,
  getUniqueWatchedSeconds,
  getVideoProgressStorageKey,
  getWatchPercent,
  IsaacVideo,
  isValidNumber,
  isValidWistiaOrigin,
  isWistiaTimeChangeEvent,
  loadVideoProgress,
  logVideoEvent,
  mergeSegments,
  pauseAllVideos,
  processWistiaMessage,
  rewrite,
  saveVideoProgress,
  updateWistiaTimeFromArgs,
  updateWistiaTimeFromEventData,
} from "../../../../app/components/content/IsaacVideo";
import { ACTION_TYPE, api } from "../../../../app/services";
import {
  STAGING_PAGE_VIDEO_IDS,
  STAGING_VIDEO_TEST_PAGE_ID,
  STAGING_WISTIA_VIDEOS,
  STAGING_YOUTUBE_VIDEO,
  stagingVideoTestPageDoc,
} from "../../../testPages/stagingVideoTestPage";
import { renderTestEnvironment } from "../../../utils";
import { requestCurrentUser, store } from "../../../../app/state";

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

const voidAxiosResponse: AxiosResponse<void> = {
  data: undefined,
  status: 200,
  statusText: "OK",
  headers: {},
  config: { headers: new AxiosHeaders() },
};

const mockApiLoggerLog = () => jest.spyOn(api.logger, "log").mockResolvedValue(voidAxiosResponse);

const createVideoEventDispatchMock = () => {
  const dispatchMock = jest.fn();
  return { dispatchMock, dispatch: dispatchMock as unknown as VideoEventDispatch };
};

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
    const { dispatchMock, dispatch } = createVideoEventDispatchMock();
    const logSpy = mockApiLoggerLog();

    await logVideoEvent(eventDetails, dispatch);

    expect(dispatchMock).toHaveBeenCalledWith({ type: ACTION_TYPE.LOG_EVENT, eventDetails });
    expect(logSpy).toHaveBeenCalledWith(eventDetails);
  });

  it("calls only the logger API when dispatch is omitted", async () => {
    const { dispatchMock } = createVideoEventDispatchMock();
    const logSpy = mockApiLoggerLog();

    await logVideoEvent(eventDetails);

    expect(dispatchMock).not.toHaveBeenCalled();
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

  function MockYTPlayer(_node: HTMLElement, config: CapturedYouTubePlayerConfig) {
    capturedPlayerConfig = config;
    config.events?.onReady?.({ target: mockPlayer, data: 0 });
  }

  const IsaacVideoHarness = () => <IsaacVideo doc={{ type: "video", src: youtubeSrc, altText: "Test video" }} />;

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    capturedPlayerConfig = null;
    mockApiLoggerLog();
    jest.spyOn(store, "dispatch");

    globalThis.YT = {
      Player: MockYTPlayer as unknown as NonNullable<typeof globalThis.YT>["Player"],
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

  it("logs VIDEO_60_PERCENT_WATCHED during continuous playback, without a pause/seek/end", async () => {
    // Regression: the KPI must fire live from the playback poll while the segment is still open. Previously it
    // was only evaluated when a segment closed (pause/seek/end/unmount), so a straight watch-through never logged.
    let currentTime = 0;
    const advancingPlayer = {
      getVideoUrl: () => youtubeSrc,
      getCurrentTime: () => currentTime,
      getDuration: () => 120,
    };

    renderYouTubeVideo();
    await flushPromises();

    const dispatchMock = store.dispatch as jest.Mock;

    // Fake timers must be active BEFORE play so the 1s poll interval is registered as a fake timer we can advance.
    jest.useFakeTimers();
    try {
      // Start playback at t=0 (opens a segment and starts the 1s poll timer).
      await act(async () => {
        capturedPlayerConfig?.events?.onStateChange?.({ target: advancingPlayer, data: 1 });
      });
      dispatchMock.mockClear();

      // Advance the player one second per poll tick (below the seek tolerance) up past 60% of 120s (= 72s).
      for (let second = 1; second <= 75; second++) {
        currentTime = second;
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
    } finally {
      jest.useRealTimers();
    }

    type LoggedAction = { type?: string; eventDetails?: { type?: string; videoId?: string; watchPercent?: number } };
    const thresholdLog = dispatchMock.mock.calls.find(([action]) => {
      const a = action as LoggedAction;
      return a?.type === ACTION_TYPE.LOG_EVENT && a?.eventDetails?.type === "VIDEO_60_PERCENT_WATCHED";
    });
    expect(thresholdLog).toBeDefined();
    const eventDetails = (thresholdLog?.[0] as LoggedAction).eventDetails;
    expect(eventDetails?.videoId).toBe(youtubeVideoId);
    expect(eventDetails?.watchPercent).toBeGreaterThanOrEqual(0.6);
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

describe("isValidNumber", () => {
  it("returns true for finite numbers", () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(42.5)).toBe(true);
    expect(isValidNumber(-1)).toBe(true);
  });

  it("returns false for non-finite or non-number values", () => {
    expect(isValidNumber(Number.NaN)).toBe(false);
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber("10")).toBe(false);
    expect(isValidNumber(null)).toBe(false);
    expect(isValidNumber(undefined)).toBe(false);
  });
});

describe("clampVideoProgressValue", () => {
  it("returns the value when it is within the inclusive range", () => {
    expect(clampVideoProgressValue(5, 0, 10)).toBe(5);
    expect(clampVideoProgressValue(-3, 0, 100)).toBe(0);
    expect(clampVideoProgressValue(150, 0, 100)).toBe(100);
  });
});

describe("mergeSegments", () => {
  it("returns an empty array when given no segments", () => {
    expect(mergeSegments([])).toEqual([]);
  });

  it("returns a single segment unchanged", () => {
    expect(mergeSegments([{ watchedSegmentStart: 2, watchedSegmentEnd: 8 }])).toEqual([
      { watchedSegmentStart: 2, watchedSegmentEnd: 8 },
    ]);
  });

  it("sorts segments by start time before merging", () => {
    expect(
      mergeSegments([
        { watchedSegmentStart: 20, watchedSegmentEnd: 30 },
        { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
      ]),
    ).toEqual([
      { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
      { watchedSegmentStart: 20, watchedSegmentEnd: 30 },
    ]);
  });

  it("merges overlapping segments into one", () => {
    expect(
      mergeSegments([
        { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
        { watchedSegmentStart: 5, watchedSegmentEnd: 15 },
      ]),
    ).toEqual([{ watchedSegmentStart: 0, watchedSegmentEnd: 15 }]);
  });

  it("merges segments separated by up to 0.5 seconds", () => {
    expect(
      mergeSegments([
        { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
        { watchedSegmentStart: 10.4, watchedSegmentEnd: 20 },
      ]),
    ).toEqual([{ watchedSegmentStart: 0, watchedSegmentEnd: 20 }]);
  });

  it("keeps segments separated by more than 0.5 seconds apart", () => {
    expect(
      mergeSegments([
        { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
        { watchedSegmentStart: 30, watchedSegmentEnd: 40 },
        { watchedSegmentStart: 10.6, watchedSegmentEnd: 20 },
      ]),
    ).toEqual([
      { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
      { watchedSegmentStart: 10.6, watchedSegmentEnd: 20 },
      { watchedSegmentStart: 30, watchedSegmentEnd: 40 },
    ]);
  });
});

describe("getUniqueWatchedSeconds", () => {
  it("returns 0 for an empty segment list", () => {
    expect(getUniqueWatchedSeconds([])).toBe(0);
  });

  it("sums the length of a single segment", () => {
    expect(getUniqueWatchedSeconds([{ watchedSegmentStart: 5, watchedSegmentEnd: 15 }])).toBe(10);
  });

  it("sums lengths across multiple segments", () => {
    expect(
      getUniqueWatchedSeconds([
        { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
        { watchedSegmentStart: 20, watchedSegmentEnd: 25 },
      ]),
    ).toBe(15);
  });

  it("ignores segments where end is before start", () => {
    expect(getUniqueWatchedSeconds([{ watchedSegmentStart: 10, watchedSegmentEnd: 5 }])).toBe(0);
  });
});

describe("getWatchPercent", () => {
  it("returns the ratio of watched seconds to total duration", () => {
    expect(getWatchPercent(60, 100)).toBe(0.6);
    expect(getWatchPercent(30, 120)).toBe(0.25);
  });

  it("returns 0 when total duration is zero, negative, or not a finite number", () => {
    expect(getWatchPercent(60, 0)).toBe(0);
    expect(getWatchPercent(60, -10)).toBe(0);
    expect(getWatchPercent(60, Number.NaN)).toBe(0);
    expect(getWatchPercent(60, Infinity)).toBe(0);
  });
});

describe("extractVideoId", () => {
  it("extracts the first capture group when the pattern matches", () => {
    expect(extractVideoId("https://www.youtube-nocookie.com/embed/test123ABCd", /embed\/([^?]+)/)).toBe("test123ABCd");
    expect(extractVideoId("https://fast.wistia.net/embed/iframe/glytlhepl5", /embed\/iframe\/([a-zA-Z0-9]+)/)).toBe(
      "glytlhepl5",
    );
  });

  it("returns null when the pattern does not match", () => {
    expect(extractVideoId("https://example.com/video", /embed\/([^?]+)/)).toBeNull();
  });
});

describe("getVideoProgressStorageKey", () => {
  it("builds a scoped localStorage key from user scope and video id", () => {
    expect(getVideoProgressStorageKey("user-42", "abc123")).toBe("video-progress:user-42:abc123");
  });
});

describe("createEmptyVideoProgressState", () => {
  it("returns default progress tracking state", () => {
    expect(createEmptyVideoProgressState()).toEqual({
      totalVideoDurationInSeconds: null,
      segments: [],
      currentSegmentStart: null,
      lastKnownTime: null,
      isPlaying: false,
      thresholdLogged: false,
    });
  });
});

describe("createInitialVideoProgressState", () => {
  const userStorageScope = "user-1";
  const videoId = "vid-1";
  const storageKey = getVideoProgressStorageKey(userStorageScope, videoId);

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns empty state when user scope or video id is missing", () => {
    expect(createInitialVideoProgressState(null, videoId)).toEqual(createEmptyVideoProgressState());
    expect(createInitialVideoProgressState(userStorageScope, null)).toEqual(createEmptyVideoProgressState());
  });

  it("populates state from localStorage when progress exists", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        totalVideoDurationInSeconds: 120,
        segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 30 }],
        thresholdLogged: true,
      }),
    );

    expect(createInitialVideoProgressState(userStorageScope, videoId)).toEqual({
      totalVideoDurationInSeconds: 120,
      segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 30 }],
      currentSegmentStart: null,
      lastKnownTime: null,
      isPlaying: false,
      thresholdLogged: true,
    });
  });

  it("returns empty state when localStorage has no entry", () => {
    expect(createInitialVideoProgressState(userStorageScope, videoId)).toEqual(createEmptyVideoProgressState());
  });
});

describe("loadVideoProgress", () => {
  const userStorageScope = "user-2";
  const videoId = "vid-2";
  const storageKey = getVideoProgressStorageKey(userStorageScope, videoId);

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(loadVideoProgress(userStorageScope, videoId)).toBeNull();
  });

  it("parses and normalizes valid stored progress", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        totalVideoDurationInSeconds: 90,
        segments: [
          { watchedSegmentStart: 10, watchedSegmentEnd: 20 },
          { watchedSegmentStart: 0, watchedSegmentEnd: 5 },
        ],
        thresholdLogged: false,
      }),
    );

    expect(loadVideoProgress(userStorageScope, videoId)).toEqual({
      totalVideoDurationInSeconds: 90,
      segments: [
        { watchedSegmentStart: 0, watchedSegmentEnd: 5 },
        { watchedSegmentStart: 10, watchedSegmentEnd: 20 },
      ],
      thresholdLogged: false,
    });
  });

  it("merges overlapping segments when loading from storage", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        totalVideoDurationInSeconds: 60,
        segments: [
          { watchedSegmentStart: 0, watchedSegmentEnd: 15 },
          { watchedSegmentStart: 10, watchedSegmentEnd: 25 },
        ],
        thresholdLogged: false,
      }),
    );

    expect(loadVideoProgress(userStorageScope, videoId)?.segments).toEqual([
      { watchedSegmentStart: 0, watchedSegmentEnd: 25 },
    ]);
  });

  it("filters invalid segments and rejects invalid duration", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        totalVideoDurationInSeconds: -5,
        segments: [
          { watchedSegmentStart: 0, watchedSegmentEnd: 10 },
          { watchedSegmentStart: "bad", watchedSegmentEnd: 20 },
        ],
        thresholdLogged: true,
      }),
    );

    expect(loadVideoProgress(userStorageScope, videoId)).toEqual({
      totalVideoDurationInSeconds: null,
      segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 10 }],
      thresholdLogged: true,
    });
  });

  it("returns null for malformed JSON", () => {
    localStorage.setItem(storageKey, "not-json");
    expect(loadVideoProgress(userStorageScope, videoId)).toBeNull();
  });
});

const stagingWistiaMessageContext = (video: (typeof STAGING_WISTIA_VIDEOS)[number], lastKnownTime = 0) => ({
  lastKnownTime,
  embedSrc: rewrite(video.src)!,
  videoId: video.videoId,
  pageId: STAGING_VIDEO_TEST_PAGE_ID,
});

describe("staging video test page — Wistia", () => {
  it.each(STAGING_WISTIA_VIDEOS.map((v) => [v.videoId, v.src] as const))(
    "rewrites staging Wistia embed src for %s",
    (videoId, src) => {
      const embedSrc = rewrite(src)!;
      expect(embedSrc).toContain(`embed/iframe/${videoId}`);
      expect(embedSrc).toContain("videoFoam=true");
    },
  );

  it.each(STAGING_WISTIA_VIDEOS.map((v) => [v.videoId, v.src] as const))(
    "extracts staging Wistia video id for %s",
    (videoId, src) => {
      const embedSrc = rewrite(src)!;
      expect(extractVideoId(embedSrc, /embed\/iframe\/([a-zA-Z0-9]+)/)).toBe(videoId);
    },
  );

  it.each(STAGING_WISTIA_VIDEOS)("maps staging Wistia play to VIDEO_PLAY with pageId (%s)", (video) => {
    const context = stagingWistiaMessageContext(video);
    const result = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["play", { seconds: 10, duration: 100 }] }),
      context,
    );

    expect(result).toEqual({
      lastKnownTime: 10,
      eventDetails: {
        type: "VIDEO_PLAY",
        videoId: video.videoId,
        videoUrl: context.embedSrc,
        pageId: STAGING_VIDEO_TEST_PAGE_ID,
        videoPosition: 10,
      },
    });
  });

  it.each(STAGING_WISTIA_VIDEOS)("maps staging Wistia pause to VIDEO_PAUSE with pageId (%s)", (video) => {
    const result = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["pause", { seconds: 25 }] }),
      stagingWistiaMessageContext(video, 25),
    );

    expect(result.eventDetails).toMatchObject({
      type: "VIDEO_PAUSE",
      videoId: video.videoId,
      pageId: STAGING_VIDEO_TEST_PAGE_ID,
      videoPosition: 25,
    });
  });

  it.each(STAGING_WISTIA_VIDEOS)("updates time on staging timechange without logging play (%s)", (video) => {
    const result = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["timechange", 30] }),
      stagingWistiaMessageContext(video, 20),
    );

    expect(result).toEqual({ lastKnownTime: 30 });
    expect(result.eventDetails).toBeUndefined();
  });

  it.each(STAGING_WISTIA_VIDEOS)("maps staging Wistia ended to VIDEO_ENDED with pageId (%s)", (video) => {
    const result = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["ended", { seconds: 100 }] }),
      stagingWistiaMessageContext(video, 100),
    );

    expect(result.eventDetails).toMatchObject({
      type: "VIDEO_ENDED",
      videoId: video.videoId,
      pageId: STAGING_VIDEO_TEST_PAGE_ID,
    });
    expect(result.eventDetails?.videoPosition).toBeUndefined();
  });
});

describe("staging video test page — YouTube", () => {
  const stagingYoutubeEmbedSrc = rewrite(STAGING_YOUTUBE_VIDEO.src)!;
  const stagingYoutubeVideoId = extractVideoId(stagingYoutubeEmbedSrc, /embed\/([^?]+)/)!;

  it("rewrites the staging YouTube watch URL to a nocookie embed", () => {
    expect(stagingYoutubeEmbedSrc).toContain("youtube-nocookie.com/embed/");
    expect(stagingYoutubeEmbedSrc).toContain(STAGING_YOUTUBE_VIDEO.videoId);
  });

  it("extracts the staging YouTube video id from the embed URL", () => {
    expect(stagingYoutubeVideoId).toBe(STAGING_YOUTUBE_VIDEO.videoId);
  });

  describe("YouTube player handlers on staging video", () => {
    const originalYT = globalThis.YT;
    let capturedPlayerConfig: {
      events?: {
        onReady?: (event: { target: typeof mockPlayer; data: number }) => void;
        onStateChange?: (event: { target: typeof mockPlayer; data: number }) => void;
      };
    } | null = null;

    const mockPlayer = {
      getVideoUrl: () => STAGING_YOUTUBE_VIDEO.src,
      getCurrentTime: () => 30,
      getDuration: () => 120,
    };

    function MockYTPlayer(_node: HTMLElement, config: NonNullable<typeof capturedPlayerConfig>) {
      capturedPlayerConfig = config;
      config.events?.onReady?.({ target: mockPlayer, data: 0 });
    }

    const StagingYoutubeHarness = () => (
      <IsaacVideo doc={{ type: "video", src: STAGING_YOUTUBE_VIDEO.src, altText: "Staging YouTube test" }} />
    );

    const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
      capturedPlayerConfig = null;
      mockApiLoggerLog();
      jest.spyOn(store, "dispatch");
      globalThis.YT = {
        Player: MockYTPlayer as unknown as NonNullable<typeof globalThis.YT>["Player"],
        ready: (callback: () => void) => callback(),
        PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      };
    });

    afterEach(() => {
      globalThis.YT = originalYT;
      jest.restoreAllMocks();
    });

    const renderStagingYouTube = () => {
      renderTestEnvironment({
        role: "STUDENT",
        PageComponent: StagingYoutubeHarness,
        initialRouteEntries: [`/pages/${STAGING_VIDEO_TEST_PAGE_ID}`],
      });
      store.dispatch({
        type: ACTION_TYPE.DOCUMENT_RESPONSE_SUCCESS,
        doc: stagingVideoTestPageDoc,
      });
    };

    it("registers onReady and onStateChange for the staging YouTube player", () => {
      renderStagingYouTube();
      expect(capturedPlayerConfig?.events?.onReady).toBeDefined();
      expect(capturedPlayerConfig?.events?.onStateChange).toBeDefined();
    });

    it("logs VIDEO_PLAY with staging pageId and video id on play", async () => {
      renderStagingYouTube();
      await flushPromises();
      const dispatchMock = store.dispatch as jest.Mock;
      dispatchMock.mockClear();

      await act(async () => {
        capturedPlayerConfig?.events?.onStateChange?.({ target: mockPlayer, data: 1 });
      });
      await flushPromises();

      expect(dispatchMock).toHaveBeenCalledWith({
        type: ACTION_TYPE.LOG_EVENT,
        eventDetails: {
          type: "VIDEO_PLAY",
          videoId: stagingYoutubeVideoId,
          videoUrl: STAGING_YOUTUBE_VIDEO.src,
          pageId: STAGING_VIDEO_TEST_PAGE_ID,
          videoPosition: 30,
          videoDurationSeconds: 120,
        },
      });
    });

    it.each([
      [2, "VIDEO_PAUSE", 30],
      [0, "VIDEO_ENDED", undefined],
    ])(
      "onStateChange maps player state %i to %s for staging YouTube",
      async (playerState, expectedEventType, videoPosition) => {
        renderStagingYouTube();
        await flushPromises();
        const dispatchMock = store.dispatch as jest.Mock;
        dispatchMock.mockClear();

        await act(async () => {
          capturedPlayerConfig?.events?.onStateChange?.({ target: mockPlayer, data: playerState });
        });
        await flushPromises();

        const expectedEventDetails: Record<string, unknown> = {
          type: expectedEventType,
          videoId: stagingYoutubeVideoId,
          videoUrl: STAGING_YOUTUBE_VIDEO.src,
          pageId: STAGING_VIDEO_TEST_PAGE_ID,
          videoDurationSeconds: 120,
        };
        if (videoPosition !== undefined) {
          expectedEventDetails.videoPosition = videoPosition;
        }

        expect(dispatchMock).toHaveBeenCalledWith({
          type: ACTION_TYPE.LOG_EVENT,
          eventDetails: expectedEventDetails,
        });
      },
    );
  });
});

describe("staging page progress persistence — multiple videos", () => {
  const userStorageScope = "42";

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("uses a distinct localStorage key per video on the staging page", () => {
    const keys = STAGING_PAGE_VIDEO_IDS.map((videoId) => getVideoProgressStorageKey(userStorageScope, videoId));
    expect(new Set(keys).size).toBe(STAGING_PAGE_VIDEO_IDS.length);
    keys.forEach((key) => expect(key).toMatch(/^video-progress:42:/));
  });

  it.each(STAGING_WISTIA_VIDEOS)("stores independent progress for staging Wistia video %s", (video) => {
    saveVideoProgress(userStorageScope, video.videoId, {
      ...createEmptyVideoProgressState(),
      totalVideoDurationInSeconds: 100,
      segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 65 }],
    });

    const loaded = loadVideoProgress(userStorageScope, video.videoId);
    expect(loaded?.totalVideoDurationInSeconds).toBe(100);
    expect(getUniqueWatchedSeconds(loaded!.segments)).toBe(65);
    expect(getWatchPercent(65, 100)).toBeGreaterThanOrEqual(0.6);
  });

  it("stores independent progress for the staging YouTube video", () => {
    saveVideoProgress(userStorageScope, STAGING_YOUTUBE_VIDEO.videoId, {
      ...createEmptyVideoProgressState(),
      totalVideoDurationInSeconds: 200,
      segments: [{ watchedSegmentStart: 10, watchedSegmentEnd: 130 }],
    });

    const loaded = loadVideoProgress(userStorageScope, STAGING_YOUTUBE_VIDEO.videoId);
    expect(loaded?.totalVideoDurationInSeconds).toBe(200);
    expect(getUniqueWatchedSeconds(loaded!.segments)).toBe(120);
    expect(getWatchPercent(120, 200)).toBeGreaterThanOrEqual(0.6);
  });

  it("does not mix progress between staging videos on the same page", () => {
    saveVideoProgress(userStorageScope, STAGING_WISTIA_VIDEOS[0].videoId, {
      ...createEmptyVideoProgressState(),
      totalVideoDurationInSeconds: 100,
      segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 50 }],
      thresholdLogged: true,
    });
    saveVideoProgress(userStorageScope, STAGING_WISTIA_VIDEOS[1].videoId, {
      ...createEmptyVideoProgressState(),
      totalVideoDurationInSeconds: 80,
      segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 20 }],
      thresholdLogged: false,
    });
    saveVideoProgress(userStorageScope, STAGING_YOUTUBE_VIDEO.videoId, {
      ...createEmptyVideoProgressState(),
      totalVideoDurationInSeconds: 120,
      segments: [{ watchedSegmentStart: 5, watchedSegmentEnd: 80 }],
      thresholdLogged: false,
    });

    expect(loadVideoProgress(userStorageScope, STAGING_WISTIA_VIDEOS[0].videoId)?.thresholdLogged).toBe(true);
    expect(loadVideoProgress(userStorageScope, STAGING_WISTIA_VIDEOS[1].videoId)?.thresholdLogged).toBe(false);
    expect(getUniqueWatchedSeconds(loadVideoProgress(userStorageScope, STAGING_YOUTUBE_VIDEO.videoId)!.segments)).toBe(
      75,
    );
    expect(loadVideoProgress(userStorageScope, STAGING_WISTIA_VIDEOS[2].videoId)).toBeNull();
  });

  it.each([...STAGING_WISTIA_VIDEOS, STAGING_YOUTUBE_VIDEO])(
    "updates initial state per video from localStorage (%s)",
    (video) => {
      const storageKey = getVideoProgressStorageKey(userStorageScope, video.videoId);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          totalVideoDurationInSeconds: 100,
          segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 60 }],
          thresholdLogged: true,
        }),
      );

      expect(createInitialVideoProgressState(userStorageScope, video.videoId)).toEqual({
        totalVideoDurationInSeconds: 100,
        segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: 60 }],
        currentSegmentStart: null,
        lastKnownTime: null,
        isPlaying: false,
        thresholdLogged: true,
      });
    },
  );
});

type StoredVideoProgress = {
  totalVideoDurationInSeconds: number;
  segments: { watchedSegmentStart: number; watchedSegmentEnd: number }[];
};

const readStoredProgress = (userStorageScope: string, videoId: string): StoredVideoProgress | null => {
  const raw = localStorage.getItem(getVideoProgressStorageKey(userStorageScope, videoId));
  return raw ? (JSON.parse(raw) as StoredVideoProgress) : null;
};

const wistiaMockContentWindows = new WeakMap<HTMLIFrameElement, Window>();

const attachIframeContentWindow = (iframe: HTMLIFrameElement): Window => {
  let mockWindow = wistiaMockContentWindows.get(iframe);
  if (!mockWindow) {
    mockWindow = {} as Window;
    wistiaMockContentWindows.set(iframe, mockWindow);
  }
  Object.defineProperty(iframe, "contentWindow", {
    value: mockWindow,
    configurable: true,
  });
  return mockWindow;
};

const dispatchWistiaTrigger = (
  iframe: HTMLIFrameElement,
  eventName: string,
  eventData: Record<string, unknown> = {},
) => {
  const mockWindow = attachIframeContentWindow(iframe);
  act(() => {
    globalThis.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://fast.wistia.net",
        source: mockWindow,
        data: JSON.stringify({ method: "_trigger", args: [eventName, eventData] }),
      }),
    );
  });
};

const getWistiaIframeForVideo = (videoId: string) => {
  const iframe = screen.getByTitle(`Embedded video: ${videoId}.`) as HTMLIFrameElement;
  return iframe;
};

const StagingMultiWistiaHarness = () => (
  <div>
    {STAGING_WISTIA_VIDEOS.slice(0, 2).map((video) => (
      <IsaacVideo key={video.videoId} doc={{ type: "video", src: video.src, altText: video.videoId }} />
    ))}
  </div>
);

const StagingSwitchingWistiaHarness = ({ remountOnSwitch }: { remountOnSwitch: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const video = STAGING_WISTIA_VIDEOS[activeIndex];
  return (
    <>
      <button type="button" onClick={() => setActiveIndex(1)}>
        Show second video
      </button>
      <IsaacVideo
        key={remountOnSwitch ? video.videoId : "shared-player"}
        doc={{ type: "video", src: video.src, altText: video.videoId }}
      />
    </>
  );
};

const stagingWistiaThenYoutube = [
  { src: STAGING_WISTIA_VIDEOS[0].src, videoId: STAGING_WISTIA_VIDEOS[0].videoId },
  { src: STAGING_YOUTUBE_VIDEO.src, videoId: STAGING_YOUTUBE_VIDEO.videoId },
] as const;

const StagingWistiaAndYoutubeHarness = () => (
  <div>
    <IsaacVideo
      key={stagingWistiaThenYoutube[0].videoId}
      doc={{ type: "video", src: stagingWistiaThenYoutube[0].src, altText: stagingWistiaThenYoutube[0].videoId }}
    />
    <IsaacVideo
      key={stagingWistiaThenYoutube[1].videoId}
      doc={{ type: "video", src: stagingWistiaThenYoutube[1].src, altText: stagingWistiaThenYoutube[1].videoId }}
    />
  </div>
);

const StagingSwitchingWistiaToYoutubeHarness = ({ remountOnSwitch }: { remountOnSwitch: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const video = stagingWistiaThenYoutube[activeIndex];
  return (
    <>
      <button type="button" onClick={() => setActiveIndex(1)}>
        Show YouTube video
      </button>
      <IsaacVideo
        key={remountOnSwitch ? video.videoId : "shared-player"}
        doc={{ type: "video", src: video.src, altText: video.videoId }}
      />
    </>
  );
};

describe("IsaacVideo localStorage when moving between videos on the same page", () => {
  const userStorageScope = String(mockUser.id);
  const firstVideo = STAGING_WISTIA_VIDEOS[0];
  const secondVideo = STAGING_WISTIA_VIDEOS[1];
  const youtubeVideo = STAGING_YOUTUBE_VIDEO;
  const wistiaDuration = { duration: 100 };
  const youtubeDuration = 120;

  const originalYT = globalThis.YT;
  let capturedPlayerConfig: {
    events?: {
      onReady?: (event: { target: typeof youtubeMockPlayer; data: number }) => void;
      onStateChange?: (event: { target: typeof youtubeMockPlayer; data: number }) => void;
    };
  } | null = null;
  let youtubeCurrentTime = 0;

  const youtubeMockPlayer = {
    getVideoUrl: () => youtubeVideo.src,
    getCurrentTime: () => youtubeCurrentTime,
    getDuration: () => youtubeDuration,
  };

  function MockYTPlayer(_node: HTMLElement, config: NonNullable<typeof capturedPlayerConfig>) {
    capturedPlayerConfig = config;
    config.events?.onReady?.({ target: youtubeMockPlayer, data: 0 });
  }

  const setupYoutubeApiMock = () => {
    capturedPlayerConfig = null;
    youtubeCurrentTime = 0;
    globalThis.YT = {
      Player: MockYTPlayer as unknown as NonNullable<typeof globalThis.YT>["Player"],
      ready: (callback: () => void) => callback(),
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    };
  };

  const waitForYoutubePlayer = async () => {
    await waitFor(() => {
      expect(capturedPlayerConfig?.events?.onStateChange).toBeDefined();
    });
  };

  const triggerYoutubePlay = (time: number) => {
    youtubeCurrentTime = time;
    act(() => {
      capturedPlayerConfig?.events?.onStateChange?.({ target: youtubeMockPlayer, data: 1 });
    });
  };

  const triggerYoutubePause = (time: number) => {
    youtubeCurrentTime = time;
    act(() => {
      capturedPlayerConfig?.events?.onStateChange?.({ target: youtubeMockPlayer, data: 2 });
    });
  };

  const renderLoggedInStagingHarness = async (PageComponent: React.FC, waitForTitle?: string) => {
    renderTestEnvironment({
      role: "STUDENT",
      PageComponent,
      initialRouteEntries: [`/pages/${STAGING_VIDEO_TEST_PAGE_ID}`],
    });
    await act(async () => {
      await store.dispatch(requestCurrentUser() as any);
    });
    store.dispatch({
      type: ACTION_TYPE.DOCUMENT_RESPONSE_SUCCESS,
      doc: stagingVideoTestPageDoc,
    });
    await waitFor(() => {
      expect(screen.getByTitle(`Embedded video: ${waitForTitle ?? firstVideo.videoId}.`)).toBeInTheDocument();
    });
  };

  const seedProgress = (videoId: string, watchedSegmentEnd: number, totalVideoDurationInSeconds = 100) => {
    localStorage.setItem(
      getVideoProgressStorageKey(userStorageScope, videoId),
      JSON.stringify({
        totalVideoDurationInSeconds,
        segments: [{ watchedSegmentStart: 0, watchedSegmentEnd: watchedSegmentEnd }],
        thresholdLogged: false,
      }),
    );
  };

  beforeEach(() => {
    localStorage.clear();
    mockApiLoggerLog();
    setupYoutubeApiMock();
  });

  afterEach(() => {
    globalThis.YT = originalYT;
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("keeps separate localStorage progress when two Wistia players are on the page at once", async () => {
    seedProgress(firstVideo.videoId, 10);
    seedProgress(secondVideo.videoId, 5);

    await renderLoggedInStagingHarness(StagingMultiWistiaHarness);

    const firstIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(firstIframe, "play", { seconds: 10, ...wistiaDuration });
    dispatchWistiaTrigger(firstIframe, "pause", { seconds: 25, ...wistiaDuration });

    const firstVideoAfterPause = readStoredProgress(userStorageScope, firstVideo.videoId);
    expect(firstVideoAfterPause?.segments.at(-1)?.watchedSegmentEnd).toBe(25);

    const secondIframe = getWistiaIframeForVideo(secondVideo.videoId);
    dispatchWistiaTrigger(secondIframe, "play", { seconds: 5, ...wistiaDuration });
    dispatchWistiaTrigger(secondIframe, "pause", { seconds: 12, ...wistiaDuration });

    const secondVideoStored = readStoredProgress(userStorageScope, secondVideo.videoId);
    const firstVideoStoredAgain = readStoredProgress(userStorageScope, firstVideo.videoId);

    expect(secondVideoStored?.segments.at(-1)?.watchedSegmentEnd).toBe(12);
    expect(firstVideoStoredAgain).toEqual(firstVideoAfterPause);
    expect(getUniqueWatchedSeconds(firstVideoStoredAgain!.segments)).toBeGreaterThan(
      getUniqueWatchedSeconds(secondVideoStored!.segments),
    );
  });

  it("reloads the second video's localStorage after switching away from the first (remount)", async () => {
    seedProgress(firstVideo.videoId, 30);
    seedProgress(secondVideo.videoId, 8);

    await renderLoggedInStagingHarness(() => <StagingSwitchingWistiaHarness remountOnSwitch />);

    const firstIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(firstIframe, "play", { seconds: 30, ...wistiaDuration });
    dispatchWistiaTrigger(firstIframe, "pause", { seconds: 45, ...wistiaDuration });

    const firstVideoSnapshot = readStoredProgress(userStorageScope, firstVideo.videoId);
    expect(firstVideoSnapshot?.segments.at(-1)?.watchedSegmentEnd).toBe(45);

    fireEvent.click(screen.getByRole("button", { name: "Show second video" }));
    await waitFor(() => {
      expect(screen.getByTitle(`Embedded video: ${secondVideo.videoId}.`)).toBeInTheDocument();
    });

    const secondIframe = getWistiaIframeForVideo(secondVideo.videoId);
    dispatchWistiaTrigger(secondIframe, "play", { seconds: 8, ...wistiaDuration });
    dispatchWistiaTrigger(secondIframe, "pause", { seconds: 15, ...wistiaDuration });

    const secondVideoStored = readStoredProgress(userStorageScope, secondVideo.videoId);
    expect(secondVideoStored?.segments.at(-1)?.watchedSegmentEnd).toBe(15);
    expect(getUniqueWatchedSeconds(secondVideoStored!.segments)).toBeLessThan(20);
    expect(readStoredProgress(userStorageScope, firstVideo.videoId)).toEqual(firstVideoSnapshot);
  });

  it("reloads the second video's localStorage when the same player receives a new src", async () => {
    seedProgress(firstVideo.videoId, 30);
    seedProgress(secondVideo.videoId, 8);

    await renderLoggedInStagingHarness(() => <StagingSwitchingWistiaHarness remountOnSwitch={false} />);

    const firstIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(firstIframe, "play", { seconds: 30, ...wistiaDuration });
    dispatchWistiaTrigger(firstIframe, "pause", { seconds: 40, ...wistiaDuration });

    const firstVideoSnapshot = readStoredProgress(userStorageScope, firstVideo.videoId);

    fireEvent.click(screen.getByRole("button", { name: "Show second video" }));
    await waitFor(() => {
      expect(screen.getByTitle(`Embedded video: ${secondVideo.videoId}.`)).toBeInTheDocument();
    });

    const secondIframe = getWistiaIframeForVideo(secondVideo.videoId);
    dispatchWistiaTrigger(secondIframe, "play", { seconds: 8, ...wistiaDuration });
    dispatchWistiaTrigger(secondIframe, "pause", { seconds: 14, ...wistiaDuration });

    const secondVideoStored = readStoredProgress(userStorageScope, secondVideo.videoId);
    expect(secondVideoStored?.segments.at(-1)?.watchedSegmentEnd).toBe(14);
    expect(getUniqueWatchedSeconds(secondVideoStored!.segments)).toBeLessThan(18);
    expect(readStoredProgress(userStorageScope, firstVideo.videoId)).toEqual(firstVideoSnapshot);
  });

  it("keeps separate localStorage progress when Wistia and YouTube players are on the page at once", async () => {
    seedProgress(firstVideo.videoId, 10);
    seedProgress(youtubeVideo.videoId, 6, youtubeDuration);

    await renderLoggedInStagingHarness(StagingWistiaAndYoutubeHarness);
    await waitForYoutubePlayer();

    const wistiaIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(wistiaIframe, "play", { seconds: 10, ...wistiaDuration });
    dispatchWistiaTrigger(wistiaIframe, "pause", { seconds: 25, ...wistiaDuration });

    const wistiaAfterPause = readStoredProgress(userStorageScope, firstVideo.videoId);
    expect(wistiaAfterPause?.segments.at(-1)?.watchedSegmentEnd).toBe(25);

    triggerYoutubePlay(6);
    triggerYoutubePause(18);

    const youtubeStored = readStoredProgress(userStorageScope, youtubeVideo.videoId);
    const wistiaStoredAgain = readStoredProgress(userStorageScope, firstVideo.videoId);

    expect(youtubeStored?.segments.at(-1)?.watchedSegmentEnd).toBe(18);
    expect(wistiaStoredAgain).toEqual(wistiaAfterPause);
    expect(getUniqueWatchedSeconds(wistiaStoredAgain!.segments)).toBeGreaterThan(
      getUniqueWatchedSeconds(youtubeStored!.segments),
    );
  });

  it("reloads YouTube localStorage after switching away from Wistia (remount)", async () => {
    seedProgress(firstVideo.videoId, 30);
    seedProgress(youtubeVideo.videoId, 8, youtubeDuration);

    await renderLoggedInStagingHarness(() => <StagingSwitchingWistiaToYoutubeHarness remountOnSwitch />);

    const wistiaIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(wistiaIframe, "play", { seconds: 30, ...wistiaDuration });
    dispatchWistiaTrigger(wistiaIframe, "pause", { seconds: 45, ...wistiaDuration });

    const wistiaSnapshot = readStoredProgress(userStorageScope, firstVideo.videoId);
    expect(wistiaSnapshot?.segments.at(-1)?.watchedSegmentEnd).toBe(45);

    fireEvent.click(screen.getByRole("button", { name: "Show YouTube video" }));
    await waitFor(() => {
      expect(screen.getByTitle(`Embedded video: ${youtubeVideo.videoId}.`)).toBeInTheDocument();
    });
    await waitForYoutubePlayer();

    triggerYoutubePlay(8);
    triggerYoutubePause(22);

    const youtubeStored = readStoredProgress(userStorageScope, youtubeVideo.videoId);
    expect(youtubeStored?.segments.at(-1)?.watchedSegmentEnd).toBe(22);
    expect(getUniqueWatchedSeconds(youtubeStored!.segments)).toBeLessThan(25);
    expect(readStoredProgress(userStorageScope, firstVideo.videoId)).toEqual(wistiaSnapshot);
  });

  it("reloads YouTube localStorage when the same player switches from Wistia src to YouTube src", async () => {
    seedProgress(firstVideo.videoId, 30);
    seedProgress(youtubeVideo.videoId, 8, youtubeDuration);

    await renderLoggedInStagingHarness(() => <StagingSwitchingWistiaToYoutubeHarness remountOnSwitch={false} />);

    const wistiaIframe = getWistiaIframeForVideo(firstVideo.videoId);
    dispatchWistiaTrigger(wistiaIframe, "play", { seconds: 30, ...wistiaDuration });
    dispatchWistiaTrigger(wistiaIframe, "pause", { seconds: 40, ...wistiaDuration });

    const wistiaSnapshot = readStoredProgress(userStorageScope, firstVideo.videoId);

    fireEvent.click(screen.getByRole("button", { name: "Show YouTube video" }));
    await waitFor(() => {
      expect(screen.getByTitle(`Embedded video: ${youtubeVideo.videoId}.`)).toBeInTheDocument();
    });
    await waitForYoutubePlayer();

    triggerYoutubePlay(8);
    triggerYoutubePause(16);

    const youtubeStored = readStoredProgress(userStorageScope, youtubeVideo.videoId);
    expect(youtubeStored?.segments.at(-1)?.watchedSegmentEnd).toBe(16);
    expect(getUniqueWatchedSeconds(youtubeStored!.segments)).toBeLessThan(20);
    expect(readStoredProgress(userStorageScope, firstVideo.videoId)).toEqual(wistiaSnapshot);
  });
});

describe("saveVideoProgress", () => {
  const userStorageScope = "user-3";
  const videoId = "vid-3";
  const storageKey = getVideoProgressStorageKey(userStorageScope, videoId);

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("persists progress to localStorage for a scoped user", () => {
    saveVideoProgress(userStorageScope, videoId, {
      totalVideoDurationInSeconds: 100,
      segments: [{ watchedSegmentStart: 5, watchedSegmentEnd: 20 }],
      currentSegmentStart: 30,
      lastKnownTime: 30,
      isPlaying: true,
      thresholdLogged: false,
    });

    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      totalVideoDurationInSeconds: 100,
      segments: [{ watchedSegmentStart: 5, watchedSegmentEnd: 20 }],
      thresholdLogged: false,
    });
  });

  it("does not write when user storage scope is missing", () => {
    saveVideoProgress(null, videoId, createEmptyVideoProgressState());
    expect(localStorage.getItem(storageKey)).toBeNull();
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

    iframe.remove();
  });
});
