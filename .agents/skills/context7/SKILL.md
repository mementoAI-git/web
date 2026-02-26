---
name: context7
description: Fetch up-to-date code documentation and examples for LLMs. Use this skill when you need the latest information on local or remote libraries, frameworks, or APIs to avoid hallucinations and outdated code generation.
---

This skill enables the use of the Context7 MCP server to retrieve real-time, version-specific documentation directly into your prompt context.

## How to use Context7

When you encounter a library or framework you're unsure about, or if you want to ensure you're using the latest patterns, invoke the `context7` tools.

### Core Commands

- **Search Documentation**: Use the search tools provided by the `context7` MCP server to find specific documentation chunks.
- **Reference Libraries**: Include relevant library documentation in your context by using the "use context7" pattern or calling the tools directly.

### Best Practices

- **Specify Versions**: If a project uses a specific version of a library, include that in your search or request to get the most accurate results.
- **Contextual Search**: Provide as much context as possible about the specific problem you're solving (e.g., "how to implement middleware in Next.js 14 using App Router").
- **Avoid Hallucination**: If you find yourself guessing an API signature, STOP and use `context7` to verify.

## Examples

- "Fetch the documentation for the latest `@upstash/redis` package."
- "Show me up-to-date examples of using `framer-motion` layout animations."
- "Check the current API for `lucide-react` icons."
