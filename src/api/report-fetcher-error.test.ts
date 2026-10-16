import { toast } from "sonner";
import { reportFetcherError } from "./report-fetcher-error";
import { normalizeApiError } from "@/api/contract-adapter";
it("does not repeat already reported HTTP or network failures", () => {
  const error = vi.spyOn(toast, "error");
  error.mockClear();
  reportFetcherError(normalizeApiError({ message: "Offline" }, 503), "Fallback");
  reportFetcherError(normalizeApiError(null, undefined, "Network error"), "Fallback");
  expect(error).not.toHaveBeenCalled();
});
it("reports local response-validation and unexpected failures", () => {
  const error = vi.spyOn(toast, "error");
  error.mockClear();
  reportFetcherError(new Error("No checkout URL returned"), "Fallback");
  reportFetcherError(undefined, "Fallback");
  expect(error.mock.calls).toEqual([["No checkout URL returned"], ["Fallback"]]);
});
