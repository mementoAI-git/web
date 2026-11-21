/**
 * Persists ownership before an accepted session response reaches the client.
 * @param response - Eve's authenticated session-create response.
 * @param principal - Verified initiating browser.
 * @param record - Persistent owner registration.
 * @returns The response after registration, or the original failure response.
 */
export async function recordSessionBeforeReply(
  response: Response,
  principal: string,
  record: (session: string, owner: string) => Promise<void>
): Promise<Response> {
  if (response.status !== 202) {
    return response;
  }
  const sessionId = response.headers.get("x-eve-session-id");
  if (sessionId === null || !/^[\w-]{1,500}$/u.test(sessionId)) {
    throw new Error("The agent did not return a valid session ID.");
  }
  await record(sessionId, principal);
  return response;
}
