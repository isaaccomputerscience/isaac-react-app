// This page holds a copy of what staging's API returns when test page is loaded
import { ContentDTO } from "../../IsaacApiTypes";

/** Staging: https://www.staging.development.isaaccomputerscience.org/pages/79c4810c-b08b-416e-87ca-aac03a27a4bf */
export const STAGING_VIDEO_TEST_PAGE_ID = "79c4810c-b08b-416e-87ca-aac03a27a4bf";

export const STAGING_WISTIA_VIDEO = {
  src: "https://fast.wistia.net/embed/iframe/ivyatyg59i",
  videoId: "ivyatyg59i",
} as const;

export const stagingWistiaVideoBlock: ContentDTO = {
  id: STAGING_VIDEO_TEST_PAGE_ID,
  type: "video",
  tags: [],
  title: "video60percent_test.json",
  encoding: "markdown",
  children: [],
  published: true,
  src: STAGING_WISTIA_VIDEO.src,
};

export const stagingVideoTestPageDoc: ContentDTO = {
  id: STAGING_VIDEO_TEST_PAGE_ID,
  title: "Test video - 60% progress tracking test",
  type: "page",
  encoding: "markdown",
  canonicalSourceFile: "content/_demo_pages/video60percent_test.json",
  published: true,
  tags: [],
  children: [stagingWistiaVideoBlock],
};
