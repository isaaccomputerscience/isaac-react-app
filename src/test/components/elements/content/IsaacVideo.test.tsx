import { jest } from "@jest/globals";
import { logVideoEvent, rewrite } from "../../../../app/components/content/IsaacVideo";
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
