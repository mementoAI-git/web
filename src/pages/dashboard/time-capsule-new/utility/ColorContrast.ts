export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export function getBorderColor(hexColor: string): string {
  // Return a semi-transparent version of the contrast color for borders
  const contrastColor = getContrastColor(hexColor);
  return contrastColor === "#000000"
    ? "rgba(0, 0, 0, 0.1)"
    : "rgba(255, 255, 255, 0.2)";
}
