import { screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { Generic } from "../../app/components/pages/Generic";
import { API_PATH } from "../../app/services";
import { renderTestEnvironment } from "../utils";
import {
  STAGING_VIDEO_TEST_PAGE_ID,
  STAGING_WISTIA_VIDEOS,
  STAGING_YOUTUBE_VIDEO,
  stagingVideoTestPageDoc,
} from "../testPages/stagingVideoTestPage";

describe("staging video test page", () => {
  const renderStagingPage = () =>
    renderTestEnvironment({
      role: "STUDENT",
      PageComponent: Generic,
      componentProps: {
        pageIdOverride: STAGING_VIDEO_TEST_PAGE_ID,
        match: { params: { pageId: STAGING_VIDEO_TEST_PAGE_ID } },
      },
      initialRouteEntries: [`/pages/${STAGING_VIDEO_TEST_PAGE_ID}`],
      extraEndpoints: [
        rest.get(API_PATH + `/pages/${STAGING_VIDEO_TEST_PAGE_ID}`, (_req, res, ctx) =>
          res(ctx.json(stagingVideoTestPageDoc)),
        ),
      ],
    });

  it("renders all staging Wistia iframes from the page API payload", async () => {
    renderStagingPage();

    await waitFor(() => {
      expect(screen.getAllByTitle(/Embedded video/i).length).toBe(STAGING_WISTIA_VIDEOS.length + 1);
    });

    const iframeSrcs = Array.from(document.querySelectorAll("iframe")).map((iframe) => iframe.getAttribute("src"));
    STAGING_WISTIA_VIDEOS.forEach((video) => {
      expect(iframeSrcs.some((src) => src?.includes(video.videoId))).toBe(true);
    });
  });

  it("renders the staging YouTube player mount from the page API payload", async () => {
    const originalYT = globalThis.YT;
    globalThis.YT = {
      Player: class {
        constructor() {
          /* noop — avoid loading real YouTube API in tests */
        }
      } as never,
      ready: (callback: () => void) => callback(),
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    };

    try {
      renderStagingPage();

      await waitFor(() => {
        expect(screen.getByTitle(/Embedded video:.*youtube/i)).toBeInTheDocument();
      });

      const youtubeTitle = screen.getByTitle(/Embedded video:.*youtube/i);
      expect(youtubeTitle.closest(".content-video-container")).toBeInTheDocument();
      expect(STAGING_YOUTUBE_VIDEO.src).toContain("youtube.com");
    } finally {
      globalThis.YT = originalYT;
    }
  });
});
