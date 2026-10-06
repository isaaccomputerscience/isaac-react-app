import { screen, waitFor } from "@testing-library/react";
import { renderTestEnvironment } from "../../../../../test/utils";
import { IsaacCompetition } from "../IsaacCompetition";
import { COMPETITION_OPEN_DATE } from "../dateUtils";
import { STUDENT_MESSAGE } from "../constants";

const TEACHER_LOGIN_PROMPT = "Are you a teacher? Log in to submit a project on behalf of your students.";

describe("IsaacCompetition role-based visibility", () => {
  beforeEach(() => {
    // Only fake Date, so msw/async behaviour is unaffected
    jest.useFakeTimers({
      doNotFake: [
        "hrtime",
        "nextTick",
        "performance",
        "queueMicrotask",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "requestIdleCallback",
        "cancelIdleCallback",
        "setImmediate",
        "clearImmediate",
        "setInterval",
        "clearInterval",
        "setTimeout",
        "clearTimeout",
      ],
      now: new Date(COMPETITION_OPEN_DATE.getTime() + 24 * 60 * 60 * 1000),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = (role: "ANONYMOUS" | "STUDENT" | "TEACHER" | "ADMIN") =>
    renderTestEnvironment({ role, PageComponent: IsaacCompetition, initialRouteEntries: ["/competition"] });

  it("shows the teacher login prompt and login CTA to logged-out users", async () => {
    setup("ANONYMOUS");
    expect(await screen.findByText(TEACHER_LOGIN_PROMPT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit your project" })).toBeInTheDocument();
    expect(screen.queryByText(STUDENT_MESSAGE)).not.toBeInTheDocument();
    expect(document.getElementById("competition-entry-form")).toBeNull();
  });

  it("shows only the student message to students", async () => {
    setup("STUDENT");
    expect(await screen.findByText(STUDENT_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(TEACHER_LOGIN_PROMPT)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit your project" })).not.toBeInTheDocument();
    expect(document.getElementById("competition-entry-form")).toBeNull();
  });

  it.each(["TEACHER", "ADMIN"] as const)("shows the entry form and not the login prompt to %s users", async (role) => {
    setup(role);
    await waitFor(() => expect(document.getElementById("competition-entry-form")).not.toBeNull());
    expect(screen.queryByText(TEACHER_LOGIN_PROMPT)).not.toBeInTheDocument();
    expect(screen.queryByText(STUDENT_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit your project" })).toBeInTheDocument();
  });
});
