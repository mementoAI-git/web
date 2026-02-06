import { useState, useRef, useEffect } from "react";
import type { CardCustomization } from "./CapsulePreviewCard";

interface StyleControlsProps {
  cardStyle: CardCustomization;
  onStyleChange: (updates: Partial<CardCustomization>) => void;
}

export default function StyleControls({
  cardStyle,
  onStyleChange,
}: StyleControlsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const colorPresets = [
    { name: "Sage", color: "#E2EADF" },
    { name: "Peach", color: "#FFE5D9" },
    { name: "Lavender", color: "#E6E6FA" },
    { name: "Mint", color: "#D5F4E6" },
    { name: "Cream", color: "#FFF8E7" },
  ];

  const fonts = ["Geist Mono", "Garamond", "Inter", "Sans"];
  const sizes = ["sm", "base", "lg", "xl", "2xl", "3xl"];

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  return (
    <div className="bg-white max-w-[270px] rounded-full flex items-center gap-3 py-2 px-3">
      {/* Color Selector */}
      <div className="relative" ref={colorPickerRef}>
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="rounded-full w-8 h-8 border-2 border-white shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: cardStyle.backgroundColor }}
        />

        {/* Color Picker Dropdown */}
        {showColorPicker && (
          <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg p-3 z-50 border border-gray-200">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    onStyleChange({ backgroundColor: preset.color });
                    setShowColorPicker(false);
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 hover:border-gray-400 transition-all"
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="border-t pt-3">
              <label className="text-xs text-gray-600 block mb-1">
                Custom color
              </label>
              <input
                type="color"
                value={cardStyle.backgroundColor}
                onChange={(e) =>
                  onStyleChange({ backgroundColor: e.target.value })
                }
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 text-sm">
        {/* Font Selector */}
        <select
          value={cardStyle.fontFamily}
          onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
          className="rounded-l-full bg-black/5 py-2 pr-2 pl-3 outline-none cursor-pointer"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        {/* Size Selector */}
        <select
          value={cardStyle.fontSize}
          onChange={(e) => onStyleChange({ fontSize: e.target.value })}
          className="rounded-r-full bg-black/5 py-2 pl-2 pr-3 outline-none cursor-pointer"
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
