import { mockNewsPods, mockPromoPods } from "../../../mocks/data";
import { Dashboard } from "../../../app/components/elements/Dashboard";
import { TestUserRole, renderTestEnvironment } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import { IsaacQuestionPageDTO, UserRole } from "../../../IsaacApiTypes";
import { MockedRequest, RestHandler, rest } from "msw";
import { API_PATH } from "../../../app/services";

const mockPromoItem = mockPromoPods.results[0];
const mockFeaturedNewsItem = mockNewsPods.results[1];

describe("Dashboard", () => {
  const setupTest = (
    role: TestUserRole,
    props = {},
    extraEndpoints?: RestHandler<MockedRequest<IsaacQuestionPageDTO[]>>[] | undefined,
  ) => {
    renderTestEnvironment({
      role: role,
      PageComponent: Dashboard,
      componentProps: {
        featuredNewsItem: mockFeaturedNewsItem,
        promoItem: mockPromoItem,
        ...props,
      },
      initialRouteEntries: ["/"],
      extraEndpoints: extraEndpoints,
    });
  };

  it("shows logged out content if no user is logged in", async () => {
    setupTest("ANONYMOUS");
    const loggedOutTitle = await screen.findByRole("heading", {
      name: /computer science learning/i,
    });
    expect(loggedOutTitle).toBeInTheDocument();
    const featuredNewsTile = screen.queryByTestId("featured-news-item");
    const promoTile = screen.queryByTestId("promo-tile");
    expect(featuredNewsTile).toBeNull();
    expect(promoTile).toBeNull();
  });

  let roles: UserRole[] = ["TEACHER", "EVENT_LEADER", "CONTENT_EDITOR", "EVENT_MANAGER", "ADMIN"];

  it.each(roles)(
    "promo tile is visible, and featured news tile is not, if %s user is logged in and promo item is available",
    async (role) => {
      setupTest(role);
      const promoTile = await screen.findByTestId("promo-tile");
      const featuredNewsTile = screen.queryByTestId("featured-news-item");
      expect(promoTile).toBeInTheDocument();
      expect(featuredNewsTile).toBeNull();
      const promoTitle = screen.getByText(mockPromoItem.title);
      expect(promoTitle).toBeInTheDocument();
    },
  );

  it.each(roles)("featured news will appear instead if promo item is not available, for %s user", async (role) => {
    setupTest(role, {
      promoItem: null,
    });
    const featuredNewsTile = await screen.findByTestId("featured-news-item");
    const promoTile = screen.queryByTestId("promo-tile");
    expect(featuredNewsTile).toBeInTheDocument();
    expect(promoTile).toBeNull();
    const featuredNewsTitle = screen.getByText(mockFeaturedNewsItem.title);
    expect(featuredNewsTitle).toBeInTheDocument();
  });

  it.each(roles)("displays promo tile for %s user, not featured news or question tile", async (role) => {
    setupTest(role);
    const promoTile = await screen.findByTestId("promo-tile");
    const featuredNewsTile = screen.queryByTestId("featured-news-item");
    const questionTile = screen.queryByTestId("question-tile");
    expect(promoTile).toBeInTheDocument();
    expect(featuredNewsTile).toBeNull();
    expect(questionTile).toBeNull();
    const promoTitle = screen.getByText(mockPromoItem.title);
    expect(promoTitle).toBeInTheDocument();
  });

  roles = ["TEACHER", "EVENT_LEADER", "CONTENT_EDITOR", "EVENT_MANAGER", "ADMIN"];

  it.each(roles)(
    "shows loading spinner for %s users, if neither promo item nor featured news item are provided",
    async (role) => {
      setupTest(role, {
        promoItem: null,
        featuredNewsItem: null,
      });
      const featuredNewsTile = await screen.findByTestId("featured-news-item");
      expect(featuredNewsTile).toBeInTheDocument();
      await waitFor(() => {
        const loadingMessage = screen.getByTestId("loading-spinner");
        expect(loadingMessage).toBeVisible();
      });
    },
  );

  it("shows question tile for students if logged in and question data is available", async () => {
    setupTest("STUDENT");
    const questionTile = await screen.findByTestId("question-tile");
    const promoTile = screen.queryByTestId("promo-tile");
    const featuredNewsTile = screen.queryByTestId("featured-news-item");
    expect(questionTile).toBeInTheDocument();
    expect(promoTile).toBeNull();
    expect(featuredNewsTile).toBeNull();
  });

  it("does not show the question tile empty array comes back from the API", async () => {
    setupTest("STUDENT", {}, [
      rest.get(API_PATH + "/questions/random", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      }),
    ]);
    const featuredNewsTile = await screen.findByTestId("featured-news-item");
    expect(featuredNewsTile).toBeInTheDocument();
    const questionTile = screen.queryByTestId("question-tile");
    expect(questionTile).toBeNull();
  });
});
