import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.classList.remove("dark", "deep-sky", "light-sky");
  document.documentElement.style.removeProperty("color-scheme");
});
afterAll(() => server.close());
