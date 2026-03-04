import { type ComponentType, type SVGProps } from "react";
import { Sage, Peach, Bead, Paper, Dark, Modern } from "../components/letters";

export interface Theme {
  id: string;
  name: string;
  color: string; // Used for Theme Switcher UI and fallback
  fonts: {
    header: string;
    body: string;
  };
  textColor?: string;
  headerColor?: string;
  Background: ComponentType<SVGProps<SVGSVGElement>>;
}

export const themes: Theme[] = [
  {
    id: "sage",
    name: "Sage",
    color: "#F0FCD4",
    fonts: { header: "Patrick Hand SC", body: "Handlee" },
    textColor: "#2C3E2F",
    headerColor: "#1A2419",
    Background: Sage,
  },
  {
    id: "blush",
    name: "Blush",
    color: "#FFE5D9",
    fonts: { header: "Garamond", body: "Garamond" },
    textColor: "#5C4742",
    headerColor: "#3D2E2A",
    Background: Peach,
  },
  {
    id: "dusk",
    name: "Dusk",
    color: "#E6E6FA",
    fonts: { header: "Portrait Script", body: "Garamond" },
    textColor: "#4A4A6A",
    headerColor: "#2E2E4A",
    Background: Paper,
  },
  {
    id: "mint",
    name: "Mint",
    color: "#D5F4E6",
    fonts: { header: "Sans", body: "Sans" },
    textColor: "#2C5F4F",
    headerColor: "#1A3D30",
    Background: Bead,
  },
  {
    id: "noir",
    name: "Noir",
    color: "#2C2C2C",
    fonts: { header: "Garamond", body: "Cutive" },
    textColor: "#E5E5E5",
    headerColor: "#FFFFFF",
    Background: Dark,
  },
  {
    id: "mono",
    name: "Mono",
    color: "#D4F4FC",
    fonts: { header: "Geist Mono", body: "Geist Mono" },
    textColor: "#1E1E1EE5",
    headerColor: "#1E1E1EE5",
    Background: Modern,
  },
];

export const getThemeByStyle = (backgroundColor: string): Theme | undefined => {
  return themes.find(
    (t) => t.color.toUpperCase() === backgroundColor.toUpperCase(),
  );
};

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find((t) => t.id === id);
};
