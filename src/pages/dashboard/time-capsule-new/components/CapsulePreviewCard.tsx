import { getBorderColor, getContrastColor } from "../utility/ColorContrast";
import MediaCard from "./media-cards/MediaCard";
import { themes, getThemeByStyle } from "../config/themes.config.tsx";
import { cn } from "@/utility";
import "./capsule-fonts.css";

export interface CardCustomization {
  themeId?: string;
  backgroundColor: string;
  fontSize: string;
  textColor?: string;
  headerColor?: string;
}

export interface MediaAsset {
  id: string;
  type: "video" | "image" | "audio" | "memory";
  thumbnail: string;
  duration?: string;
  title: string;
}

interface CapsulePreviewCardProps {
  style: CardCustomization;
  recipients: string[];
  title: string;
  body: string;
  sender?: string | { first_name?: string; last_name?: string };
  className?: string;
  assets?: MediaAsset[];
  onAssetClick?: (asset: MediaAsset) => void;
}

export default function CapsulePreviewCard({
  style,
  recipients,
  title,
  body,
  sender = "",
  className = "",
  assets = [],
  onAssetClick,
}: CapsulePreviewCardProps) {
  const typographyScale = {
    "1x": { title: "text-lg", body: "text-sm", label: "text-xs" },
    "2x": { title: "text-2xl", body: "text-lg", label: "text-sm" },
    "3x": { title: "text-4xl", body: "text-2xl", label: "text-base" },
  };

  const fontFamilyClasses = {
    "Geist Mono": "font-mono",
    Garamond: "font-garamond",
    // Inter: "font-inter",
    // Sans: "font-sans",
    "Patrick Hand SC": "font-patrick",
    Handlee: "font-handlee",
    Cutive: "font-cutive",
    "Portrait Script": "font-portrait",
  };

  // 2. Look up the theme object using the current style
  // This finds the SVG based on the themeId (primary) or background color (fallback)
  const currentTheme = style.themeId
    ? themes.find((t) => t.id === style.themeId)
    : getThemeByStyle(style.backgroundColor);

  // 3. Prioritize colors: Theme defined > style defined > calculated
  const textColor =
    currentTheme?.textColor ||
    style.textColor ||
    getContrastColor(style.backgroundColor);
  const headerColor =
    currentTheme?.headerColor || style.headerColor || textColor;

  const borderColor = getBorderColor(style.backgroundColor);
  const sizes = typographyScale[style.fontSize as keyof typeof typographyScale];

  const lightTextColors = ["#ffffff", "#f893ac", "white", "#e5e5e5"];
  const isLightText = lightTextColors.includes(textColor.toLowerCase());

  return (
    <div className="relative h-full w-full">
      {/* Main Card */}
      <div
        className={cn(
          "rounded-xl relative overflow-hidden px-6 flex flex-col h-full w-full",
          className,
        )}
        style={{
          backgroundColor: style.backgroundColor,
          color: textColor,
        }}
      >
        {/* 3. Render the SVG Background Layer */}
        {currentTheme && (
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
            <currentTheme.Background className="w-full h-full object-cover" />
          </div>
        )}

        <div className="z-10 h-full flex flex-col relative">
          {/* Fixed Header: To + Recipients */}
          <div className="shrink-0 relative z-10 flex justify-between items-center gap-2">
            {/* Left section - recipients */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className={`${sizes.label} opacity-70 shrink-0`}>to:</span>
              <div className="flex gap-1 items-center min-w-0 overflow-hidden">
                {recipients.length > 0 ? (
                  <>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${sizes.label} font-medium bg-black/5 shrink-0 max-w-[150px]`}
                      style={{ color: textColor }}
                    >
                      <span className="truncate overflow-hidden">
                        {recipients[0]}
                      </span>
                    </span>
                    {recipients.length > 1 && (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${sizes.label} font-light bg-black/5 shrink-0 whitespace-nowrap`}
                        style={{ color: textColor }}
                      >
                        +{recipients.length - 1} other
                        {recipients.length - 1 > 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={`${sizes.label} opacity-50`}></span>
                )}
              </div>
            </div>

            {/* Center section - Logo Icon */}
            {/*<div className="flex justify-center items-center shrink-0 w-8">
              {textColor.toLowerCase() === "#ffffff" ||
                textColor === "white" ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4.0032C12 1.7952 10.2048 0 7.9968 0C7.2672 0 6.5856 0.191998 6 0.537598C5.4144 0.201598 4.7328 0 4.0032 0C1.7952 0 0 1.7952 0 4.0032C0 4.7328 0.192001 5.4144 0.5376 6C0.201601 6.5856 0 7.2672 0 7.9968C0 10.2048 1.7952 12 4.0032 12C4.7328 12 5.4144 11.808 6 11.4624C6.5856 11.7984 7.2672 12 7.9968 12C10.2048 12 12 10.2048 12 7.9968C12 7.2672 11.808 6.5856 11.4624 6C11.7984 5.4144 12 4.7328 12 4.0032ZM5.9904 8.00639C4.8864 8.00639 3.9936 7.1136 3.9936 6.0096C3.9936 4.9056 4.8864 4.0128 5.9904 4.0128C7.0944 4.0128 7.9872 4.9056 7.9872 6.0096C7.9872 7.1136 7.104 8.00639 5.9904 8.00639Z"
                    fill="#DDBF8F"
                  />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4.0032C12 1.7952 10.2048 0 7.9968 0C7.2672 0 6.5856 0.191998 6 0.537598C5.4144 0.201598 4.7328 0 4.0032 0C1.7952 0 0 1.7952 0 4.0032C0 4.7328 0.192001 5.4144 0.5376 6C0.201601 6.5856 0 7.2672 0 7.9968C0 10.2048 1.7952 12 4.0032 12C4.7328 12 5.4144 11.808 6 11.4624C6.5856 11.7984 7.2672 12 7.9968 12C10.2048 12 12 10.2048 12 7.9968C12 7.2672 11.808 6.5856 11.4624 6C11.7984 5.4144 12 4.7328 12 4.0032ZM5.9904 8.00639C4.8864 8.00639 3.9936 7.1136 3.9936 6.0096C3.9936 4.9056 4.8864 4.0128 5.9904 4.0128C7.0944 4.0128 7.9872 4.9056 7.9872 6.0096C7.9872 7.1136 7.104 8.00639 5.9904 8.00639Z"
                    fill="#1E1E1E"
                  />
                </svg>
              )}
            </div>*/}

            <div className="flex justify-center items-center shrink-0 w-8">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.0032C12 1.7952 10.2048 0 7.9968 0C7.2672 0 6.5856 0.191998 6 0.537598C5.4144 0.201598 4.7328 0 4.0032 0C1.7952 0 0 1.7952 0 4.0032C0 4.7328 0.192001 5.4144 0.5376 6C0.201601 6.5856 0 7.2672 0 7.9968C0 10.2048 1.7952 12 4.0032 12C4.7328 12 5.4144 11.808 6 11.4624C6.5856 11.7984 7.2672 12 7.9968 12C10.2048 12 12 10.2048 12 7.9968C12 7.2672 11.808 6.5856 11.4624 6C11.7984 5.4144 12 4.7328 12 4.0032ZM5.9904 8.00639C4.8864 8.00639 3.9936 7.1136 3.9936 6.0096C3.9936 4.9056 4.8864 4.0128 5.9904 4.0128C7.0944 4.0128 7.9872 4.9056 7.9872 6.0096C7.9872 7.1136 7.104 8.00639 5.9904 8.00639Z"
                  fill={isLightText ? "#DDBF8F" : "#1E1E1E"}
                />
              </svg>
            </div>

            {/* Right section - sender */}
            <div
              className={`flex items-center gap-1 justify-end text-end flex-1 min-w-0 ${sizes.label} ${fontFamilyClasses[currentTheme?.fonts.body as keyof typeof fontFamilyClasses] || ""}`}
              style={{ borderColor, color: textColor }}
            >
              <span className={`${sizes.label} shrink-0`}>From:</span>
              <span className={`${sizes.label} truncate`}>
                {typeof sender === "string"
                  ? sender
                  : `${sender?.first_name || ""} ${sender?.last_name || ""}`}
              </span>
            </div>
          </div>

          {/* Title Section */}
          <div
            className="mx-[18.99px] py-3 shrink-0 relative z-10"
            style={{ borderColor }}
          >
            <span
              className={`${sizes.title} text-center leading-tight font-semibold block ${fontFamilyClasses[currentTheme?.fonts.header as keyof typeof fontFamilyClasses] || ""}`}
              style={{ color: headerColor }}
            >
              {title}
            </span>
          </div>

          {/* Scrollable Body */}
          <div
            className={`mx-[18.99px] flex-1 min-h-0 overflow-y-auto scrollbar-hide relative z-10 ${fontFamilyClasses[currentTheme?.fonts.body as keyof typeof fontFamilyClasses] || ""}`}
            style={{ borderColor }}
          >
            <div
              className={`${sizes.body} mb-4 text-center overflow-y-auto scrollbar-hide leading-relaxed whitespace-pre-wrap py-2 h-full`}
            >
              <p>{body}</p>

              {assets.length > 0 && (
                <div className="pb-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-[5.41px]! place-items-center">
                    {assets.map((asset) => (
                      <MediaCard
                        key={asset.id}
                        type={asset.type}
                        src={asset.thumbnail}
                        duration={asset.duration}
                        title={asset.title}
                        style={style}
                        // className="overflow-hidden"
                        className={cn(
                          "transition-all duration-300 flex flex-col justify-between rounded-sm overflow-hidden h-full w-full",
                        )}
                        onClick={() => onAssetClick?.(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
