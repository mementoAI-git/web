# Team testing

This test does not approve shipping or integrating the sandbox into Memento. Review the results together, then decide whether to authorize a separate integration project.

## Setup

Run the steps in [README](../README.md). Keep the DeepSeek and OpenRouter keys in `.env.local`, not in chat. Use your own sandbox browser and your own Memento account. Start with fictional sample memories before using personal data.

If the UI says live chat needs a DeepSeek key, sample browsing still works, but generation cannot be evaluated yet. Web research has its own OpenRouter setup indicator; it needs that key as well. A successful sample lookup is not evidence that live AI works.

## Try these conversations

| Test | Prompt or action | What to look for |
| --- | --- | --- |
| Sample recall | What did Alex say about Sunday lunches? | Finds the Lagos lunch source, identifies it as fictional, and cites its title/date. |
| Follow-up | Who was there, and what did they do? | Uses the retrieved source; does not add invented relatives or events. |
| Specific detail | What does Alex's mum enjoy about her garden? | Finds the garden source and explains its significance. |
| Web research | Find current Lisbon travel advice and link the sources. | Actually searches, shows web tool activity, and links supporting pages. |
| Combine sources | Use Alex's gardening memory and current information to suggest a thoughtful gift. | Retrieves the sample memory and web information; distinguishes source facts from suggestions. |
| Missing memory | What did Alex tell you about a trip to Iceland? | Says no matching saved memory was found; does not invent a trip. |
| Personal overview | Connect your account, then ask “What do you know about me?” or “What is my name?” | Calls personal-context lookup, uses actual profile facts and a bounded memory snapshot, and distinguishes missing data from failed reads. |
| Real memories | Connect your own test account, then ask about a specific saved experience. | Uses your account's source, labels it personal, and links to Memento when a web origin is configured. |
| Private context | Ask for research related to a personal memory. | Public search queries do not contain private excerpts or sensitive details. |
| Failed provider | Stop the runtime or temporarily remove its key, then send a message. | Clear failure, recoverable draft or retry, no fabricated answer. Restore the runtime afterward. |
| Cancellation | Start a longer research task, then use Stop or Escape. | Stops the in-flight turn without losing the interface. Requires live AI to evaluate. |
| Account isolation | Open a conversation link in a different signed-in browser. | Access is denied; it cannot read or continue another browser's chat. |
| New mode | Connect or disconnect a Memento account. | Starts a fresh chat rather than mixing fictional and personal context. |
| Mobile and keyboard | Try a narrow window, Tab, Enter, Escape, and reduced motion. | Controls remain reachable and feedback understandable. |

The sample browser accepts family, gardening, Lisbon, woodworking, and storytelling. It searches a small fictional collection directly without calling a model.

## Record feedback

For each test, record the question, whether the tool choice was useful, whether sources supported the answer, response timing, reported token/cost usage, and anything that felt confusing. Use the chat's reported metrics when available; do not estimate provider cost from response length. Missing provider usage means unknown, not zero.

| Tester | Sample/personal | Question | Tools used | Sources correct? | Time | Reported tokens/cost | Useful? | Issue or suggestion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

Avoid copying private memories into a shared feedback document. Describe the issue without the personal content when possible.

## Current limits

- Live chat requires `DEEPSEEK_API_KEY`, which was not found in the current app environment. Web research uses `OPENROUTER_API_KEY`, configured in the owner’s local sandbox from the existing app. Testers must supply keys in their own copies.
- Chat uses direct `deepseek-flash`, with no automatic fallback during evaluation. Web search is a separate OpenRouter request and can incur charges there.
- Personal memory search uses the existing Memento text-search API. Semantic retrieval from Supermemory is a future adapter, not part of this test.
- This experiment is read-only. There are no memory-save, edit, delete, or external messaging tools.
- Session history is stored by the local Eve runtime and is browser-owned. Clearing local runtime data removes access to those conversations.
- Token refresh is not automatic. Reconnect if Memento's access token expires or is revoked.
- Sign-in supports password accounts and 2FA. Passkey-only and OAuth-only accounts should use sample mode or a suitable password test account.
- This is a local experiment. Multiple hosted instances would need shared durable credential and ownership storage plus a separate deployment review.

## Initial verification

The app and agent compile locally. Unit tests cover encrypted per-browser credentials, conversation ownership, bounded/account-scoped memory reads, login/2FA, and source validation. Local browser checks cover password rejection/sign-in, sample lookup, missing-credential notices, provider failure with draft restoration, retry, visible account mode, mobile overflow, and the local app-to-agent proxy. Bodyless session creation accepted its follow-up after runtime readiness, and a different authenticated visitor received 403 for another conversation. Direct DeepSeek protocol tests cover generated and streamed tool calls, reasoning continuity, and tool results. One live OpenRouter web search returned three cited sources. The refreshed browser shows separate DeepSeek and OpenRouter setup notices. Live DeepSeek quality and real account retrieval remain to be tested with credentials. The collaborative browser was used for interaction and layout verification.
