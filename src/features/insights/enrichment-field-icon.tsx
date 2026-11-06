import type { ReactNode, SVGProps } from "react";
import { Fingerprint } from "lucide-react";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { cn } from "@/lib/utils";
import { enrichmentFieldColor } from "./enrichment-fields";

/**
 * Solid glyphs specified for the enrichment fields. Lucide has no filled set
 * or lighthouse, so these are drawn here. They inherit the field's color.
 */
const GLYPHS: Partial<Record<EnrichmentCategory, ReactNode>> = {
  memories_experiences: (
    <>
      <circle cx="12" cy="7" r="4.5" />
      <rect x="4" y="13.5" width="16" height="8" rx="4" />
    </>
  ),
  heritage_roots: (
    <path d="M12 2.4 1.7 11.6c-.4.4-.1 1 .4 1H5V21a1 1 0 0 0 1 1h4v-6.5h4V22h4a1 1 0 0 0 1-1v-8.4h2.9c.5 0 .8-.6.4-1L19 9.3V4.2h-2.8v2.6L12 2.4Z" />
  ),
  lessons_wisdom: (
    <path
      fillRule="evenodd"
      d="M15.5 2a6.5 6.5 0 1 1-2.9 12.3l-1.8 1.8H8.9v1.9H7v1.9l-1.1 1.1H2.5a.5.5 0 0 1-.5-.5v-3.4l7.7-7.7A6.5 6.5 0 0 1 15.5 2Zm1.7 3.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z"
    />
  ),
  relationships_people: (
    <>
      <circle cx="10" cy="7" r="4.5" />
      <path d="M2.5 21.5c-.6 0-1-.5-1-1 .3-4 3.8-6.9 8.5-6.9 1.5 0 2.9.3 4.1.9a5.4 5.4 0 0 0-1.1 3.3c0 1.4.5 2.7 1.3 3.7H2.5Z" />
      <path d="M18.7 22.5s-4.7-2.7-4.7-5.9c0-1.5 1.1-2.6 2.5-2.6.9 0 1.7.5 2.2 1.2.5-.7 1.3-1.2 2.2-1.2 1.4 0 2.5 1.1 2.5 2.6 0 3.2-4.7 5.9-4.7 5.9Z" />
    </>
  ),
  beliefs_worldview: (
    <>
      <rect x="10.8" y="1.5" width="2.4" height="21" rx="1" />
      <path d="M5 4h12.4l3.4 3-3.4 3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M19 12H6.6l-3.4 3 3.4 3H19a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z" />
    </>
  ),
  passions_interests: (
    <path
      fillRule="evenodd"
      d="M7 5h10a5.5 5.5 0 0 1 5.4 4.5l1 5.7a3.7 3.7 0 0 1-6.5 3L15 16H9l-1.9 2.2a3.7 3.7 0 0 1-6.5-3l1-5.7A5.5 5.5 0 0 1 7 5Zm1.5 3.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm7.2-.2v1.1h-1.1v1.8h1.1v1.1h1.8v-1.1h1.1V9.1h-1.1V8h-1.8Z"
    />
  ),
  hopes_legacy: (
    <>
      <path d="M9 7a3 3 0 0 1 6 0v1H9V7Z" />
      <rect x="7.5" y="8.8" width="9" height="2.2" rx=".6" />
      <path d="M9 11.8h6l1.6 9.2a1 1 0 0 1-1 1.2H8.4a1 1 0 0 1-1-1.2L9 11.8Z" />
      <path d="M2.6 4.3 6.1 6l-.8 1.6-3.5-1.7.8-1.6Zm18.8 0 .8 1.6-3.5 1.7-.8-1.6 3.5-1.7ZM1.5 9.5h3.7v1.8H1.5V9.5Zm17.3 0h3.7v1.8h-3.7V9.5Z" />
    </>
  ),
  work_purpose: (
    <path
      fillRule="evenodd"
      d="M9.5 2.5h5A2.5 2.5 0 0 1 17 5v1.5h3.5A2.5 2.5 0 0 1 23 9v3.2l-9 2.3V13h-4v1.5l-9-2.3V9a2.5 2.5 0 0 1 2.5-2.5H7V5a2.5 2.5 0 0 1 2.5-2.5Zm0 2.2a.3.3 0 0 0-.3.3v1.5h5.6V5a.3.3 0 0 0-.3-.3h-5ZM1 14.3l9 2.3V18h4v-1.4l9-2.3V19a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 1 19v-4.7Z"
    />
  ),
  everyday_life: (
    <>
      <rect x="4" y="2" width="16" height="4.5" rx="1.2" />
      <path d="M5.3 8h13.4l-.3 3H5.6l-.3-3Z" />
      <path d="M5.8 12.5h12.4l-.3 3H6.1l-.3-3Z" />
      <path d="M6.3 17h11.4l-.4 3.7a1.5 1.5 0 0 1-1.5 1.3H8.2a1.5 1.5 0 0 1-1.5-1.3L6.3 17Z" />
    </>
  ),
};

export function EnrichmentFieldIcon({
  field,
  className,
  ...props
}: { field: EnrichmentCategory } & SVGProps<SVGSVGElement>) {
  const shared = {
    "aria-hidden": true,
    className: cn("insights-field-icon", className),
    style: { color: enrichmentFieldColor(field) },
  };
  if (field === "identity_self")
    return <Fingerprint {...shared} strokeWidth={2.4} />;
  return (
    <svg {...props} {...shared} viewBox="0 0 24 24" fill="currentColor">
      {GLYPHS[field]}
    </svg>
  );
}
