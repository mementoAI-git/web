import { useState, useRef, useEffect } from "react";
import type { CardCustomization } from "./CapsulePreviewCard";
import { themes, type Theme } from "../config/themes.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@/components/icons";

interface StyleControlsProps {
  cardStyle: CardCustomization;
  onStyleChange: (updates: Partial<CardCustomization>) => void;
}

// Define your default theme ID here
const DEFAULT_THEME_ID = themes[0].id;

export default function StyleControls({
  cardStyle,
  onStyleChange,
}: StyleControlsProps) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const sizes = ["1x", "2x", "3x"];

  // Find current theme, fallback to default if none matches
  const currentTheme =
    themes.find(
      (t) =>
        t.color === cardStyle.backgroundColor &&
        t.fontFamily === cardStyle.fontFamily,
    ) ||
    themes.find((t) => t.id === DEFAULT_THEME_ID) ||
    themes[0];

  // Apply default theme on mount if no valid theme is set
  useEffect(() => {
    const hasValidTheme = themes.some(
      (t) =>
        t.color === cardStyle.backgroundColor &&
        t.fontFamily === cardStyle.fontFamily,
    );

    if (!hasValidTheme) {
      const defaultTheme =
        themes.find((t) => t.id === DEFAULT_THEME_ID) || themes[0];
      onStyleChange({
        backgroundColor: defaultTheme.color,
        fontFamily: defaultTheme.fontFamily,
        textColor: defaultTheme.textColor,
        headerColor: defaultTheme.headerColor,
      });
    }
  }, []); // Run once on mount

  // Close theme picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themePickerRef.current &&
        !themePickerRef.current.contains(event.target as Node)
      ) {
        setShowThemePicker(false);
      }
    };
    if (showThemePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showThemePicker]);

  const handleThemeSelect = (theme: Theme) => {
    onStyleChange({
      backgroundColor: theme.color,
      fontFamily: theme.fontFamily,
      textColor: theme.textColor,
      headerColor: theme.headerColor,
    });
  };

  return (
    <div className="bg-white justify-between items-end w-full flex gap-3 py-2 px-3 rounded-xl">
      {/* Theme Selector */}
      <div
        className="relative shrink-0 flex flex-col justify-between"
        ref={themePickerRef}
      >
        <span className="text-sm text-gray-700 mb-1">Theme</span>
        <div className="flex relative">
          {themes.map((theme, index) => {
            const isSelected = currentTheme?.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeSelect(theme)}
                className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-all shadow-sm relative"
                style={{
                  backgroundColor: theme.color,
                  marginLeft: index === 0 ? "0" : "-1.2rem",
                  zIndex: isSelected ? 20 : 10 - index,
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                }}
                title={`${theme.name} - ${theme.fontFamily}`}
              />
            );
          })}
        </div>
      </div>

      {/* Theme Dropdown */}
      <div className="relative shrink-0 flex-1 flex flex-col justify-end">
        <span className="text-sm text-gray-700 mb-1">Style</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="py-2 px-3 border border-border outline-none cursor-pointer rounded text-sm text-gray-700 w-full flex items-center justify-between hover:bg-black/10 transition-colors">
              <span className="truncate">
                {currentTheme?.name || "Select theme"}
              </span>
              <ChevronDownIcon className="w-4 h-4 ml-2 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)] z-[999]">
            {themes.map((theme) => {
              const isSelected = currentTheme?.id === theme.id;
              return (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && (
                    <img
                      src="icon/check.svg"
                      className="w-4 h-4"
                      alt="Selected Theme"
                    />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Size Selector */}
      <div className="relative shrink-0 flex flex-col justify-end">
        <span className="text-sm text-gray-700 mb-1">Size</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="py-2 px-3 outline-none cursor-pointer rounded text-sm text-gray-700 w-full flex items-center justify-between hover:bg-black/10 transition-colors border border-border">
              <span>{cardStyle.fontSize}</span>
              <ChevronDownIcon className="w-4 h-4 ml-2 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)] z-[999]">
            {sizes.map((size) => {
              const isSelected = cardStyle.fontSize === size;
              return (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onStyleChange({ fontSize: size })}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span>{size}</span>
                  {isSelected && (
                    <img
                      src="icon/check.svg"
                      className="w-4 h-4"
                      alt="Selected Size"
                    />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
