import { server } from "../mocks/server";
import "./matchers";
import { cleanup } from "@testing-library/react";

global.window.scrollTo = jest.fn();
jest.mock("react-ga4"); // Google Analytics requires a DOM.window which doesn't exist in test
jest.mock("../app/services/websockets"); // MSW can't handle websockets just yet
jest.mock("popper.js", () => {
  const PopperJS = jest.requireActual("popper.js");
  return class MockedPopper {
    static readonly placements = PopperJS.placements;
    destroy: () => void;
    scheduleUpdate: () => void;
    constructor() {
      this.destroy = jest.fn();
      this.scheduleUpdate = jest.fn();
    }
  };
});

// TODO jest.mock("../app/services/localStorage"); <--- need to mock this effectively

// Establish API mocking before all tests.
beforeAll(() => {
  // Could add a callback here to deal with unhandled requests
  server.listen({ onUnhandledRequest: "warn" });
});
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  jest.clearAllMocks();
  server.resetHandlers();
  cleanup(); // Clean up DOM after each test
});
// Clean up after the tests are finished.
afterAll(() => server.close());
