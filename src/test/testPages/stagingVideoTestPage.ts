// Copy of staging API payload for the video progress test page.
import { ContentDTO, VideoDTO } from "../../IsaacApiTypes";

/** https://www.staging.development.isaaccomputerscience.org/pages/79c4810c-b08b-416e-87ca-aac03a27a4bf */
export const STAGING_VIDEO_TEST_PAGE_ID = "79c4810c-b08b-416e-87ca-aac03a27a4bf";

export const STAGING_WISTIA_VIDEOS = [
  {
    src: "https://fast.wistia.net/embed/iframe/ivyatyg59i",
    videoId: "ivyatyg59i",
  },
  {
    src: "https://fast.wistia.net/embed/iframe/2scetc0g1q",
    videoId: "2scetc0g1q",
  },
  {
    src: "https://fast.wistia.net/embed/iframe/2z8sft5l2m",
    videoId: "2z8sft5l2m",
  },
] as const;

/** First Wistia video on the page (alias for older tests). */
export const STAGING_WISTIA_VIDEO = STAGING_WISTIA_VIDEOS[0];

/**
 * Valid YouTube watch URL for tests. Staging API has returned an invalid src
 * (`watch?v=<2z8sft5l2m>`); update this when the CMS entry is corrected.
 */
export const STAGING_YOUTUBE_VIDEO = {
  src: "https://www.youtube.com/watch?v=rA67eCfsg4g",
  videoId: "rA67eCfsg4g",
} as const;

export const STAGING_PAGE_VIDEO_IDS = [
  ...STAGING_WISTIA_VIDEOS.map((v) => v.videoId),
  STAGING_YOUTUBE_VIDEO.videoId,
] as const;

const stagingVideoBlock = (src: string, title?: string): VideoDTO => ({
  id: STAGING_VIDEO_TEST_PAGE_ID,
  type: "video",
  tags: [],
  title,
  encoding: "markdown",
  children: [],
  published: true,
  src,
});

export const stagingVideoTestPageDoc: ContentDTO = {
  id: STAGING_VIDEO_TEST_PAGE_ID,
  title: "Test video - 60% progress tracking test",
  type: "page",
  encoding: "markdown",
  canonicalSourceFile: "content/_demo_pages/video60percent_test.json",
  published: true,
  tags: [],
  children: [
    stagingVideoBlock(STAGING_WISTIA_VIDEOS[0].src, "video60percent_test.json"),
    stagingVideoBlock(STAGING_WISTIA_VIDEOS[1].src),
    stagingVideoBlock(STAGING_WISTIA_VIDEOS[2].src),
    stagingVideoBlock(STAGING_YOUTUBE_VIDEO.src),
  ],
};
