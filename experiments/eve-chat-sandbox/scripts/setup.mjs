import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const environment = `EVE_ACCESS_PASSWORD=${randomBytes(24).toString("base64url")}\nSANDBOX_DATA_DIR=${JSON.stringify(path.resolve(".sandbox-data"))}\nDEEPSEEK_API_KEY=\nOPENROUTER_API_KEY=\nOPENROUTER_SEARCH_MODEL=google/gemma-4-26b-a4b-it\nMEMENTO_API_URL=\nMEMENTO_WEB_URL=\n`;
try {
  await writeFile(".env.local", environment, { flag: "wx", mode: 0o600 });
  console.info(
    "Created .env.local. Open it to copy your sandbox password and add a DeepSeek API key. Memento API settings are optional for sample memories."
  );
} catch (error) {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    error.code !== "EEXIST"
  ) {
    throw error;
  }
  console.info("Existing .env.local preserved.");
}
