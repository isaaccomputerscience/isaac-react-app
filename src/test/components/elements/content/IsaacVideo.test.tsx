import { jest } from "@jest/globals";
import {
  logVideoEvent,
  rewrite,
  onPlayerStateChange,
  pauseAllVideos,
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
