import SageTopRightImage from "@/assets/image/time-capsule/top-left-flower.png";
import SageBottomLeftImage from "@/assets/image/time-capsule/botton-right.png";

export interface ThemeDecoration {
  type: "image" | "svg";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  content: string; // URL for image or SVG markup for svg
  width?: string;
  height?: string;
  className?: string;
}

export interface Theme {
  id: string;
  name: string;
  color: string;
  fontFamily: string;
  textColor?: string;
  headerColor?: string;
  decorations?: ThemeDecoration[];
}

// --- SVG STRINGS ---
// TODO: Paste your actual SVG code strings here.
// Ensure your SVGs have viewBox and ideally preserveAspectRatio="xMidYMid slice" or similar to fill the card.

const SageSvg = ``;
const PeachSvg = `<svg viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">...PASTE PEACH SVG CODE HERE...</svg>`;
const LavenderSvg = `<svg viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">...PASTE LAVENDER SVG CODE HERE...</svg>`;
const MintSvg = `<svg viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">...PASTE MINT SVG CODE HERE...</svg>`;
const DarkSvg = `<svg viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">...PASTE DARK SVG CODE HERE...</svg>`;

export const themes: Theme[] = [
  {
    id: "sage",
    name: "Sage",
    color: "#F0FCD4",
    fontFamily: "Geist Mono",
    textColor: "#2C3E2F",
    headerColor: "#1A2419",
    decorations: [
      {
        type: "image",
        position: "top-left",
        width: "w-32",
        height: "h-64",
        content: SageTopRightImage,
        className:
          "rotate-[-10.52deg] scale-x-[-1] w-[518.51555840394866] h-[318.51555840394866] lg:translate-x-[-410px] lg:translate-y-[-300px] z-0",
      },
      {
        type: "image",
        position: "bottom-right",
        width: "w-32",
        height: "h-64",
        content: SageBottomLeftImage,
        className:
          "rotate-[-0deg] w-[318.51555840394866] h-[318.51555840394866] translate-x-[260px] translate-y-[230px] z-0",
      },
    ],
  },
  {
    id: "peach",
    name: "Peach",
    color: "#FFE5D9",
    fontFamily: "Garamond",
    textColor: "#5C4742",
    headerColor: "#3D2E2A",
    decorations: [], // No decorations for peach theme
  },
  {
    id: "lavender",
    name: "Lavender",
    color: "#E6E6FA",
    fontFamily: "Inter",
    textColor: "#4A4A6A",
    headerColor: "#2E2E4A",
    decorations: [], // Could add lavender flowers later
  },
  {
    id: "mint",
    name: "Mint",
    color: "#D5F4E6",
    fontFamily: "Sans",
    textColor: "#2C5F4F",
    headerColor: "#1A3D30",
    decorations: [], // Could add mint leaves later
  },
  {
    id: "dark",
    name: "Dark",
    color: "#2C2C2C",
    fontFamily: "Geist Mono",
    textColor: "#E5E5E5",
    headerColor: "#FFFFFF",
    decorations: [], // No decorations for dark theme
  },
];

// Helper function to get theme by color and font
export const getThemeByStyle = (
  backgroundColor: string,
  fontFamily: string,
): Theme | undefined => {
  return themes.find(
    (t) => t.color === backgroundColor && t.fontFamily === fontFamily,
  );
};

// Helper function to get theme by id
export const getThemeById = (id: string): Theme | undefined => {
  return themes.find((t) => t.id === id);
};
