// CapsulePreviewCard.tsx - Reverted with external title layout
import { getBorderColor, getContrastColor } from "../utility/ColorContrast";
import MediaCard from "./media-cards/MediaCard";

export interface CardCustomization {
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
}

export interface MediaAsset {
  id: string;
  type: "video" | "image" | "audio";
  thumbnail: string;
  duration?: string;
  title: string;
}

interface CapsulePreviewCardProps {
  style: CardCustomization;
  recipients: string[];
  title: string;
  body: string;
  sender?: string;
  className?: string;
  assets?: MediaAsset[];
  onAssetClick?: (asset: MediaAsset) => void;
}

export default function CapsulePreviewCard({
  style,
  recipients,
  title,
  body,
  sender = "Groot",
  className = "",
  assets = [],
  onAssetClick,
}: CapsulePreviewCardProps) {
  const typographyScale = {
    sm: { title: "text-lg", body: "text-sm", label: "text-xs" },
    base: { title: "text-xl", body: "text-base", label: "text-sm" },
    lg: { title: "text-2xl", body: "text-lg", label: "text-sm" },
    xl: { title: "text-3xl", body: "text-xl", label: "text-base" },
    "2xl": { title: "text-4xl", body: "text-2xl", label: "text-base" },
    "3xl": { title: "text-5xl", body: "text-3xl", label: "text-lg" },
  };

  const fontFamilyClasses = {
    "Geist Mono": "font-mono",
    Garamond: "font-garamond",
    Inter: "font-inter",
    Sans: "font-sans",
  };

  const textColor = getContrastColor(style.backgroundColor);
  const borderColor = getBorderColor(style.backgroundColor);
  const sizes = typographyScale[style.fontSize as keyof typeof typographyScale];

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col min-w-[480px] max-w-[500px] ${fontFamilyClasses[style.fontFamily as keyof typeof fontFamilyClasses]} ${className}`}
      style={{
        backgroundColor: style.backgroundColor,
        color: textColor,
      }}
    >
      {/* Fixed Header: To + Recipients */}
      <div className="p-[18.99px] pb-3 shrink-0 flex items-center">
        <span className={`${sizes.label} opacity-70`}>To:</span>
        <div className="flex flex-wrap gap-1">
          {recipients.length > 0 ? (
            recipients.map((recipient, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${sizes.label} font-medium bg-black/5`}
                style={{ color: textColor }}
              >
                {recipient}
              </span>
            ))
          ) : (
            <span className={`${sizes.label} opacity-50 italic`}>
              No recipients
            </span>
          )}
        </div>
      </div>

      {/* Fixed Title Section */}
      <div
        className="mx-[18.99px] border-t py-3 shrink-0"
        style={{ borderColor }}
      >
        <span
          className={`${sizes.title} leading-tight font-semibold font-garamond block`}
        >
          {title || "For your 25th birthday, Katrina"}
        </span>
      </div>

      {/* Scrollable Body */}
      <div
        className="mx-[18.99px] flex-1 overflow-y-auto scrollbar-hide min-h-0"
        style={{ borderColor }}
      >
        {/* Decorations - z-0 (background) */}
        {currentTheme?.decorations?.map((decoration, index) =>
          renderDecoration(decoration, index),
        )}

        <div className="py-4 z-10 ">
          {/* Fixed Header: To + Recipients - z-10 (above decorations) */}
          <div className="p-[18.99px] pb-3 shrink-0 flex items-center relative z-10">
            <span className={`${sizes.label} opacity-70`}>To:</span>
            <div className="flex flex-wrap gap-1">
              {recipients.length > 0 ? (
                recipients.map((recipient, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${sizes.label} font-medium bg-black/5`}
                    style={{ color: textColor }}
                  >
                    {recipient}
                  </span>
                ))
              ) : (
                <span className={`${sizes.label} opacity-50 italic`}>
                  No recipients
                </span>
              )}
            </div>
          </div>

          {/* Fixed Title Section - z-10 */}
          <div
            className="mx-[18.99px] border-t py-3 shrink-0 relative z-10"
            style={{ borderColor }}
          >
            <span
              className={`${sizes.title} leading-tight font-semibold font-garamond block`}
            >
              {title}
            </span>
          </div>

          {/* Scrollable Body - z-10 */}
          <div
            className="mx-[18.99px] flex-1 overflow-y-auto scrollbar-hide min-h-0 relative z-10"
            style={{ borderColor }}
          >
            <p
              className={`${sizes.body} overflow-hidden leading-relaxed whitespace-pre-wrap py-2 min-h-[600px]`}
            >
              {body}
            </p>
            {/* Assets with external titles */}
            {assets.length > 0 && (
              <div className="pb-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {assets.map((asset) => (
                    <MediaCard
                      key={asset.id}
                      type={asset.type}
                      src={asset.thumbnail}
                      duration={asset.duration}
                      title={asset.title}
                      onClick={() => onAssetClick?.(asset)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer: From - z-10 */}
          <div
            className="p-[18.99px] pt-3 border-t shrink-0 text-end relative z-10"
            style={{ borderColor, color: textColor }}
          >
            <span className={sizes.label}>from {sender}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
