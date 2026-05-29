import { jest } from "@jest/globals";
import {
  isValidWistiaOrigin,
  isWistiaTimeChangeEvent,
  logVideoEvent,
  onPlayerStateChange,
  pauseAllVideos,
  processWistiaMessage,
  rewrite,
  updateWistiaTimeFromArgs,
  updateWistiaTimeFromEventData,
} from "../../../../app/components/content/IsaacVideo";
import { ACTION_TYPE, api } from "../../../../app/services";

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

  //Testing that logger API is always called irrespective of whether dispatch is provided or not.
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

describe("onPlayerStateChange", () => {
  const originalYT = globalThis.YT;

  const mockDispatchFn = jest.fn();
  const mockDispatch = mockDispatchFn as VideoEventDispatch;
  const mockPlayer = {
    getVideoUrl: () => "https://www.youtube.com/watch?v=test123ABCde",
    getCurrentTime: () => 30,
  };

  beforeEach(() => {
    mockDispatchFn.mockClear();
    globalThis.YT = {
      Player: jest.fn() as never,
      ready: jest.fn(),
      PlayerState: {
        PLAYING: 1,
        PAUSED: 2,
        ENDED: 0,
      },
    };
    jest.spyOn(api.logger, "log").mockResolvedValue({} as never);
  });

  afterEach(() => {
    globalThis.YT = originalYT;
    jest.restoreAllMocks();
  });

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

  it.each([
    [1, "VIDEO_PLAY"],
    [2, "VIDEO_PAUSE"],
    [0, "VIDEO_ENDED"],
  ])("maps YouTube player state %i to %s and logs via dispatch", async (playerState, expectedEventType) => {
    onPlayerStateChange({ target: mockPlayer, data: playerState }, "page-1", mockDispatch);
    await flushPromises();

    const expectedEventDetails: Record<string, unknown> = {
      type: expectedEventType,
      videoUrl: "https://www.youtube.com/watch?v=test123ABCde",
      pageId: "page-1",
    };
    if (expectedEventType !== "VIDEO_ENDED") {
      expectedEventDetails.videoPosition = 30;
    }

    expect(mockDispatchFn).toHaveBeenCalledWith({
      type: ACTION_TYPE.LOG_EVENT,
      eventDetails: expectedEventDetails,
    });
  });

  it("does not log for unhandled player states or when the YouTube API is unavailable", async () => {
    onPlayerStateChange({ target: mockPlayer, data: 99 }, "page-1", mockDispatch);
    await flushPromises();
    expect(mockDispatchFn).not.toHaveBeenCalled();

    globalThis.YT = undefined;
    onPlayerStateChange({ target: mockPlayer, data: 1 }, "page-1", mockDispatch);
    await flushPromises();
    expect(mockDispatchFn).not.toHaveBeenCalled();
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
      { lastKnownTime: 3, embedSrc: "https://fast.wistia.net/embed/iframe/abc123", pageId: "page-1" },
    );

    expect(result).toEqual({ lastKnownTime: 17 });
  });

  it("processes play and ended messages into tracking event payloads", () => {
    const playResult = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["play", { seconds: 21 }] }),
      { lastKnownTime: 3, embedSrc: "https://fast.wistia.net/embed/iframe/abc123", pageId: "page-1" },
    );
    expect(playResult).toEqual({
      lastKnownTime: 21,
      eventDetails: {
        type: "VIDEO_PLAY",
        videoUrl: "https://fast.wistia.net/embed/iframe/abc123",
        pageId: "page-1",
        videoPosition: 21,
      },
    });

    const endedResult = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "_trigger", args: ["ended", { seconds: 60 }] }),
      { lastKnownTime: 21, embedSrc: "https://fast.wistia.net/embed/iframe/abc123", pageId: "page-1" },
    );
    expect(endedResult).toEqual({
      lastKnownTime: 60,
      eventDetails: {
        type: "VIDEO_ENDED",
        videoUrl: "https://fast.wistia.net/embed/iframe/abc123",
        pageId: "page-1",
      },
    });
  });

  it("ignores unsupported origins and non-trigger messages", () => {
    const originRejected = processWistiaMessage(
      "https://youtube.com",
      JSON.stringify({ method: "_trigger", args: ["play", { seconds: 12 }] }),
      { lastKnownTime: 7, embedSrc: "https://fast.wistia.net/embed/iframe/abc123", pageId: "page-1" },
    );
    expect(originRejected).toEqual({ lastKnownTime: 7 });

    const methodRejected = processWistiaMessage(
      "https://fast.wistia.net",
      JSON.stringify({ method: "noop", args: ["play", { seconds: 12 }] }),
      { lastKnownTime: 7, embedSrc: "https://fast.wistia.net/embed/iframe/abc123", pageId: "page-1" },
    );
    expect(methodRejected).toEqual({ lastKnownTime: 7 });
  });
});

// video pause tests will ensure thatwhen user switches tabs/closes accordion, playing videos are paused instead of continuing in the background.
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
