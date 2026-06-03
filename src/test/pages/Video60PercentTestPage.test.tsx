import { screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { Generic } from "../../app/components/pages/Generic";
import { API_PATH } from "../../app/services";
import { renderTestEnvironment } from "../utils";
import {
  STAGING_VIDEO_TEST_PAGE_ID,
  STAGING_WISTIA_VIDEO,
  stagingVideoTestPageDoc,
} from "../testPages/stagingVideoTestPage";

describe("staging video test page", () => {
  it("renders the staging Wistia video from the page API payload", async () => {
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

    await waitFor(() => {
      expect(screen.getByTitle(/Embedded video/i)).toBeInTheDocument();
    });

    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain(STAGING_WISTIA_VIDEO.videoId);
  });
});
