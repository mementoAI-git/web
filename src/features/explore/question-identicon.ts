/** Keep question artwork consistent across the Explore list and conversation. */
export function getQuestionIdenticonUrl(questionId: string) {
  return `https://api.dicebear.com/10.x/disco/svg?seed=${encodeURIComponent(questionId)}`;
}
