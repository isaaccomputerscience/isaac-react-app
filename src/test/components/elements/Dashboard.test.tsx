import { mockNewsPods, mockPromoPods } from "../../../mocks/data";
import { Dashboard } from "../../../app/components/elements/Dashboard";
import { TestUserRole, checkDashboardButtons, renderTestEnvironment } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import { USER_ROLES, UserRole } from "../../../IsaacApiTypes";

const mockPromoItem = mockPromoPods.results[0];
const mockFeaturedNewsItem = mockNewsPods.results[1];

describe("Dashboard", () => {
  const setupTest = (role: TestUserRole, props = {}) => {
    renderTestEnvironment({
      role: role,
      PageComponent: Dashboard,
      componentProps: {
        featuredNewsItem: mockFeaturedNewsItem,
        promoItem: mockPromoItem,
        ...props,
      },
      initialRouteEntries: ["/"],
    });
  };

  it("logged out content is shown if no user is logged in", async () => {
    setupTest("ANONYMOUS");
    const loggedOutTitle = await screen.findByRole("heading", {
      name: /computer science learning/i,
    });
    expect(loggedOutTitle).toBeInTheDocument();
    const featuredNewsTile = screen.queryByTestId("featured-news-item");
    const promoTile = screen.queryByTestId("promo-tile");
    expect(featuredNewsTile).toBeNull();
    expect(promoTile).toBeNull();
    checkDashboardButtons();
  });

  it.each(USER_ROLES)("shows the correct dashboard buttons with links for a %s user", async (role) => {
    setupTest(role);
    await screen.findByRole("heading", {
      name: /welcome/i,
    });
    switch (role) {
      case "TEACHER":
        checkDashboardButtons("TEACHER");
        break;
      default:
        checkDashboardButtons();
        break;
    }
  });

  it("shows promo tile and not featured news tile if TEACHER user is logged in and promo item is available", async () => {
    setupTest("TEACHER");
    const promoTile = await screen.findByTestId("promo-tile");
    const featuredNewsTile = screen.queryByTestId("featured-news-item");
    expect(promoTile).toBeInTheDocument();
    expect(featuredNewsTile).toBeNull();
    const promoTitle = screen.getByText(mockPromoItem.title);
    expect(promoTitle).toBeInTheDocument();
  });

  it("shows featured news if TEACHER user is logged in and promo item is not available", async () => {
    setupTest("TEACHER", {
      promoItem: null,
    });
    const featuredNewsTile = await screen.findByTestId("featured-news-item");
    const promoTile = screen.queryByTestId("promo-tile");
    expect(featuredNewsTile).toBeInTheDocument();
    expect(promoTile).toBeNull();
    const featuredNewsTitle = screen.getByText(mockFeaturedNewsItem.title);
    expect(featuredNewsTitle).toBeInTheDocument();
  });

  const nonTeacherRoles: UserRole[] = USER_ROLES.filter((role) => role !== "TEACHER");

  it.each(nonTeacherRoles)("shows featured news tile if %s user is logged in", async (role) => {
    setupTest(role);
    const featuredNewsTile = await screen.findByTestId("featured-news-item");
    const promoTile = screen.queryByTestId("promo-tile");
    expect(featuredNewsTile).toBeInTheDocument();
    expect(promoTile).toBeNull();
    const featuredNewsTitle = screen.getByText(mockFeaturedNewsItem.title);
    expect(featuredNewsTitle).toBeInTheDocument();
  });

  it.each(USER_ROLES)(
    "shows loading spinner for %s users if neither promo item nor featured news item are provided",
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
});
