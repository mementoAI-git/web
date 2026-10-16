import type { IFile } from "@/utility/interface";

const textExtensions = new Set(["txt", "md", "markdown", "csv", "json", "log", "xml", "yaml", "yml"]);

export function getDocumentKind(file: Pick<IFile, "name" | "type">) {
  const type = file.type?.split(";")[0].trim().toLowerCase() || "";
  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (type === "application/pdf" || extension === "pdf") return "pdf";
  if (type.startsWith("text/") || type === "application/json" || textExtensions.has(extension)) return "text";
  return "unsupported";
}
