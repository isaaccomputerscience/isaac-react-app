import { Gameboard } from "../../app/components/pages/Gameboard";
import { renderTestEnvironment } from "../utils";
import { screen, waitFor, within } from "@testing-library/react";
import { Role } from "../../IsaacApiTypes";
import { rest } from "msw";
import { API_PATH, USER_ROLES } from "../../app/services";
import { mockGameboards } from "../../mocks/data";
import { produce } from "immer";
import userEvent from "@testing-library/user-event";
import { isaacApi } from "../../app/state";

const renderGameboard = ({
  role,
  notGameboardOwner,
  notSavedToCurrentUser,
}: {
  role: Role;
  notGameboardOwner?: boolean;
  notSavedToCurrentUser?: boolean;
}) => {
  const mockGameboard = {
    ...mockGameboards.results[0],
    ownerUserId: notGameboardOwner ? 2 : 301,
    savedToCurrentUser: !notSavedToCurrentUser,
  };

  renderTestEnvironment({
    modifyUser: (user) =>
      produce(user, (u) => {
        u.role = role;
        u.id = 301;
      }),
    PageComponent: Gameboard,
    initialRouteEntries: ["/gameboard#test-gameboard-1"],
    extraEndpoints: [
      rest.get(API_PATH + "/gameboards/test-gameboard-1", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockGameboard));
      }),
      rest.post(API_PATH + "/gameboards/test-gameboard-1", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ ...mockGameboard, title: req.url.searchParams.get("title") }));
      }),
    ],
  });
  return mockGameboard;
};

describe("Gameboard", () => {
  it("renders expected title", async () => {
    const gameboard = renderGameboard({ role: "STUDENT" });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const title = screen.getByRole("heading", { name: gameboard.title });
    expect(title).toBeInTheDocument();
  });

  const teachersAndAbove: Role[] = USER_ROLES.filter((role) => role !== "STUDENT" && role !== "TUTOR");

  it.each(teachersAndAbove)("offers gameboard title edit button for %s if they own the gameboard", async (role) => {
    renderGameboard({ role });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const editButton = screen.getByRole("button", { name: "Edit" });
    expect(editButton).toBeInTheDocument();
  });

  it.each(["STUDENT", "TUTOR"] as Role[])("does not offer gameboard title edit button for %s", async (role) => {
    renderGameboard({ role });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const editButton = screen.queryByRole("button", { name: "Edit" });
    expect(editButton).toBeNull();
  });

  it.each(USER_ROLES)(
    "does not offer gameboard title edit button for %s if they do not own the gameboard",
    async (role) => {
      renderGameboard({ role, notGameboardOwner: true });
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).toBeNull();
      });
      const editButton = screen.queryByRole("button", { name: "Edit" });
      expect(editButton).toBeNull();
    },
  );

  it("updates gameboard title if new title is submitted", async () => {
    const mockSaveGameboard = jest.spyOn(isaacApi.endpoints.renameAndLinkUserToGameboard, "initiate");
    const gameboard = renderGameboard({ role: "TEACHER" });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const editButton = screen.getByRole("button", { name: "Edit" });
    await userEvent.click(editButton);
    const mainHeading = screen.getByTestId("main-heading");
    const inputField = within(mainHeading).getByRole("textbox");
    await userEvent.type(inputField, "New Title");
    inputField.blur();
    const saveButton = within(mainHeading).getByRole("button", { name: "Save" });
    await waitFor(async () => {
      await userEvent.click(saveButton);
    });
    expect(screen.getByTestId("main-heading")).toHaveTextContent("New Title");
    expect(mockSaveGameboard).toHaveBeenCalledWith({ boardId: gameboard.id, newTitle: "New Title" });
  });

  it.each(USER_ROLES)("shows expected buttons for %s", async (role) => {
    renderGameboard({ role });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const setAssignmentButton = screen.queryByRole("link", { name: "Set as assignment" });
    const duplicateButton = screen.queryByRole("link", { name: "Duplicate and edit" });
    [setAssignmentButton, duplicateButton].forEach((button) => {
      if (role === "STUDENT") {
        expect(button).toBeNull();
      } else expect(button).toBeInTheDocument();
    });
  });

  it("shows 'save to my gameboards' button if user is a student and gameboard is not saved to them", async () => {
    renderGameboard({ role: "STUDENT", notSavedToCurrentUser: true });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const saveButton = screen.getByRole("link", { name: /save to my gameboards/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("displays expected questions", async () => {
    const gameboard = renderGameboard({ role: "STUDENT" });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
    const listItems = screen.getAllByRole("listitem");
    // filtering to remove breadcrumbs/gameboard title
    const questions = listItems.filter((item) => item.classList.contains("list-group-item"));
    expect(questions).toHaveLength(gameboard.contents.length);
    questions.forEach((question, index) => {
      expect(question).toHaveTextContent(gameboard.contents[index].title);
    });
  });
});
