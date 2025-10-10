import { Averia_Serif_Libre, EB_Garamond, Bricolage_Grotesque, Geist, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const averia = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-averia",
});

const canela = localFont({
  src: [
    {
      path: "../public/fonts/canela-trial/Canela-Light-Trial.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Regular-Trial.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Medium-Trial.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Bold-Trial.otf",
      weight: "700",
      style: "normal",
    }
  ],
  variable: "--font-canela",
});

const georgia = localFont({
  src: [
    {
      path: "../public/fonts/georgia/georgia.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/georgia/georgiab.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/georgia/georgiai.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/georgia/georgiaz.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-georgia",
});

export default {
  georgia,
  geist,
  canela,
  averia,
  inter,
  bricolage,
  ebGaramond
}