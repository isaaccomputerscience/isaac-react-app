import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zip } from "lodash";
import { renderTestEnvironment, NavBarMenus, NAV_BAR_MENU_TITLE, TestUserRole } from "../utils";
import { USER_ROLES, history } from "../../app/services";

const BENEFITS_FOR_STUDENTS_PAGE = "/pages/student_landing_page";
const BENEFITS_FOR_TEACHERS_PAGE = "/pages/teacher_landing_page";

const myIsaacLinks = ["/assignments", "/my_gameboards", "/progress", "/tests"];
const tutorLinks = ["/groups", "/set_assignments", "/my_markbook"];
const loggedOutTeacherLinks = [BENEFITS_FOR_TEACHERS_PAGE];
const teacherLinks = [
  "/groups",
  "/set_assignments",
  "/my_markbook",
  "/set_tests",
  "/gcse_teaching_order",
  "/teaching_order",
  "/teacher_gcse_revision_page",
  BENEFITS_FOR_TEACHERS_PAGE,
];
const learnLinks = [
  "/topics/gcse",
  "/topics/a_level",
  "/gameboards/new",
  "/gcse_programming_challenges",
  "/pages/computer_science_journeys_gallery",
  "/careers_in_computer_science",
  "/glossary",
  BENEFITS_FOR_STUDENTS_PAGE,
];
const eventsLinks = ["/events", "/safeguarding"];
const teacherEventLinks = ["/events?show_reservations_only=true"].concat(eventsLinks);
const teacherLearnLinks = ["/pages/workbooks_2020"].concat(learnLinks);
const helpLinks = ["/support/teacher", "/support/student", "/contact"];

const navigationBarLinksPerRole: {
  [p in TestUserRole]: { [menu in NavBarMenus]: string[] | null };
} = {
  ANONYMOUS: {
    "My Isaac": myIsaacLinks,
    Teach: loggedOutTeacherLinks,
    Learn: learnLinks,
    Events: eventsLinks,
    Help: helpLinks,
    Admin: null,
  },
  STUDENT: {
    "My Isaac": myIsaacLinks,
    Teach: null,
    Learn: learnLinks,
    Events: eventsLinks,
    Help: helpLinks,
    Admin: null,
  },
  TUTOR: {
    "My Isaac": myIsaacLinks,
    Teach: tutorLinks,
    Learn: learnLinks,
    Events: eventsLinks,
    Help: helpLinks,
    Admin: null,
  },
  TEACHER: {
    "My Isaac": myIsaacLinks,
    Teach: teacherLinks,
    Learn: teacherLearnLinks,
    Events: teacherEventLinks,
    Help: helpLinks,
    Admin: null,
  },
  EVENT_LEADER: {
    "My Isaac": myIsaacLinks,
    Teach: teacherLinks,
    Learn: teacherLearnLinks,
    Events: teacherEventLinks,
    Help: helpLinks,
    Admin: ["/admin/events"],
  },
  EVENT_MANAGER: {
    "My Isaac": myIsaacLinks,
    Teach: teacherLinks,
    Learn: teacherLearnLinks,
    Events: teacherEventLinks,
    Help: helpLinks,
    Admin: ["/admin", "/admin/events", "/admin/stats", "/admin/content_errors"],
  },
  CONTENT_EDITOR: {
    "My Isaac": myIsaacLinks,
    Teach: teacherLinks,
    Learn: teacherLearnLinks,
    Events: teacherEventLinks,
    Help: helpLinks,
    Admin: ["/admin", "/admin/stats", "/admin/content_errors"],
  },
  ADMIN: {
    "My Isaac": myIsaacLinks,
    Teach: teacherLinks,
    Learn: teacherLearnLinks,
    Events: teacherEventLinks,
    Help: helpLinks,
    Admin: ["/admin", "/admin/usermanager", "/admin/events", "/admin/stats", "/admin/content_errors"],
  },
};

describe("IsaacApp", () => {
  it("should open on the home page", async () => {
    renderTestEnvironment();
    await waitFor(() => {
      expect(history.location.pathname).toBe("/");
    });
  });

  // For each role (including a not-logged-in user), test whether the user sees the correct links in the navbar menu
  ["ANONYMOUS"].concat(USER_ROLES).forEach((r) => {
    const role = r as TestUserRole;
    it(`should give a user with the role ${role} access to the correct navigation menu items`, async () => {
      renderTestEnvironment({ role });
      for (const [menu, hrefs] of Object.entries(navigationBarLinksPerRole[role])) {
        const header = await screen.findByTestId("header");
        const navLink = within(header).queryByRole("link", {
          name: NAV_BAR_MENU_TITLE[menu as NavBarMenus],
        });
        if (hrefs === null) {
          // Expect link to be hidden from user
          expect(navLink).toBeNull();
          continue;
        }
        expect(navLink).toBeDefined();
        if (!navLink) continue; // appease TS
        // Check all menu options are available on click
        await userEvent.click(navLink);
        // This isn't strictly implementation agnostic, but I cannot work out a better way of getting the menu
        // related to a given title
        const adminMenuSectionParent = navLink.closest("li[class*='nav-item']") as HTMLLIElement | null;
        if (!adminMenuSectionParent)
          fail(`Missing NavigationSection parent to check ${menu} navigation menu contains correct entries.`);
        const menuItems = await within(adminMenuSectionParent).findAllByRole("menuitem");
        zip(menuItems, hrefs).forEach(([link, href]) => {
          expect(link).toHaveAttribute("href", href);
        });
      }
    });
  });
  it.todo("should show the users number of current assignments in the navigation menu");

  describe("Benefits navigation menus", () => {
    const waitForAppToLoad = async () => {
      await screen.findByTestId("main");
    };

    const openNavDropdown = async (menu: NavBarMenus) => {
      await waitForAppToLoad();
      const header = await screen.findByTestId("header");
      const navLink = await within(header).findByText(NAV_BAR_MENU_TITLE[menu]);
      await userEvent.click(navLink);
      const menuSectionParent = navLink.closest("li[class*='nav-item']") as HTMLLIElement | null;
      if (!menuSectionParent) {
        fail(`Missing NavigationSection parent for ${menu} menu.`);
      }
      return within(menuSectionParent).findAllByRole("menuitem");
    };

    const expectTeachersMenuVisible = async (visible: boolean) => {
      await waitForAppToLoad();
      const header = await screen.findByTestId("header");
      await waitFor(() => {
        const navLink = within(header).queryByText(NAV_BAR_MENU_TITLE.Teach);
        if (visible) {
          expect(navLink).not.toBeNull();
        } else {
          expect(navLink).toBeNull();
        }
      });
    };

    it("shows Benefits for students in the Learn menu for students", async () => {
      renderTestEnvironment({ role: "STUDENT" });
      const learnMenuItems = await openNavDropdown("Learn");
      const benefitsForStudents = learnMenuItems.find((item) => item.textContent?.includes("Benefits for students"));
      expect(benefitsForStudents).toBeDefined();
      expect(benefitsForStudents).toHaveAttribute("href", BENEFITS_FOR_STUDENTS_PAGE);
    });

    it("shows only Benefits for teachers in the Teachers menu for logged out users", async () => {
      renderTestEnvironment({ role: "ANONYMOUS" });
      await expectTeachersMenuVisible(true);
      const teachersMenuItems = await openNavDropdown("Teach");
      expect(teachersMenuItems).toHaveLength(1);
      expect(teachersMenuItems[0]).toHaveTextContent("Benefits for teachers");
      expect(teachersMenuItems[0]).toHaveAttribute("href", BENEFITS_FOR_TEACHERS_PAGE);
    });

    it("shows Benefits for teachers alongside other teacher menus when logged in as a teacher", async () => {
      renderTestEnvironment({ role: "TEACHER" });
      await expectTeachersMenuVisible(true);
      const teachersMenuItems = await openNavDropdown("Teach");
      const hrefs = teachersMenuItems.map((item) => item.getAttribute("href"));
      expect(hrefs).toEqual(teacherLinks);
      expect(hrefs).toContain(BENEFITS_FOR_TEACHERS_PAGE);
    });

    it("does not show the Teachers menu for logged in students", async () => {
      renderTestEnvironment({ role: "STUDENT" });
      await expectTeachersMenuVisible(false);
    });

    it("does not show Benefits for teachers in the Teachers menu for logged in tutors", async () => {
      renderTestEnvironment({ role: "TUTOR" });
      await expectTeachersMenuVisible(true);
      const teachersMenuItems = await openNavDropdown("Teach");
      const hrefs = teachersMenuItems.map((item) => item.getAttribute("href"));
      expect(hrefs).toEqual(tutorLinks);
      expect(hrefs).not.toContain(BENEFITS_FOR_TEACHERS_PAGE);
    });
  });

  it.each(USER_ROLES)("should not show the promo content banner for %s users", async (role) => {
    renderTestEnvironment({ role });
    await screen.findByTestId("main");
    const promoContent = document.querySelector("#promo-content");
    expect(promoContent).not.toBeInTheDocument();
  });
});
