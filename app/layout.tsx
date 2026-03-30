import type { Metadata } from "next";
import {
  Baloo_2,
  DM_Serif_Display,
  Figtree,
  Fraunces,
  Geist_Mono,
  Libre_Baskerville,
  Literata,
  Nunito,
  Outfit,
  Syne,
  Tenor_Sans,
} from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";
import { DEFAULT_UI_THEME } from "@/lib/ui-themes";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const baloo2 = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const tenorSans = Tenor_Sans({
  variable: "--font-tenor",
  subsets: ["latin"],
  weight: "400",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fontVariables = [
  geistMono.variable,
  literata.variable,
  dmSerifDisplay.variable,
  syne.variable,
  outfit.variable,
  baloo2.variable,
  nunito.variable,
  libreBaskerville.variable,
  tenorSans.variable,
  fraunces.variable,
  figtree.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Parliament Watch — Canadian Bill Tracker",
  description:
    "A nonpartisan window into what Parliament is doing right now — explained in plain language by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-ui-theme={DEFAULT_UI_THEME}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
