import { get, post } from "@/api/mutations";
import endpoint from "@/api/endpoint";
import type { ExploreCategory, ExploreQuestionFeedbackInput } from "./explore-types";

export function getExploreCategories() {
  return get<ExploreCategory[]>(endpoint.exploreCategories);
}

export function setExploreQuestionFeedback(promptId: string, input: ExploreQuestionFeedbackInput) {
  return post(`${endpoint.promptDetails}${promptId}/feedback`, input);
}
