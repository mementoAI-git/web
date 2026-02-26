import React, { type ComponentType, type SVGProps } from "react";
import { Sage } from "../components/letters/Sage";
import { Peach } from "../components/letters/Peach";

export interface Theme {
    id: string;
    name: string;
    color: string; // Used for Theme Switcher UI and fallback
    fontFamily: string;
    textColor?: string;
    headerColor?: string;
    Background: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * Fallback background for themes that don't have a specific SVG yet.
 * Just renders an empty SVG that lets the background color show through.
 */
const FallbackBackground: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 560 697"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    />
);

export const themes: Theme[] = [
    {
        id: "sage",
        name: "Sage",
        color: "#F0FCD4",
        fontFamily: "Geist Mono",
        textColor: "#2C3E2F",
        headerColor: "#1A2419",
        Background: Sage,
    },
    {
        id: "peach",
        name: "Peach",
        color: "#FFE5D9",
        fontFamily: "Garamond",
        textColor: "#5C4742",
        headerColor: "#3D2E2A",
        Background: Peach,
    },
    {
        id: "lavender",
        name: "Lavender",
        color: "#E6E6FA",
        fontFamily: "Inter",
        textColor: "#4A4A6A",
        headerColor: "#2E2E4A",
        Background: FallbackBackground,
    },
    {
        id: "mint",
        name: "Mint",
        color: "#D5F4E6",
        fontFamily: "Sans",
        textColor: "#2C5F4F",
        headerColor: "#1A3D30",
        Background: FallbackBackground,
    },
    {
        id: "dark",
        name: "Dark",
        color: "#2C2C2C",
        fontFamily: "Geist Mono",
        textColor: "#E5E5E5",
        headerColor: "#FFFFFF",
        Background: FallbackBackground,
    },
];

export const getThemeByStyle = (
    backgroundColor: string,
    fontFamily: string,
): Theme | undefined => {
    return themes.find(
        (t) =>
            t.color.toUpperCase() === backgroundColor.toUpperCase() &&
            t.fontFamily === fontFamily,
    );
};

export const getThemeById = (id: string): Theme | undefined => {
    return themes.find((t) => t.id === id);
};
