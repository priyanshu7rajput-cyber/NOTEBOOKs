import type { Metadata } from "next";
import {
  Inter,
  Caveat,
  Playfair_Display,
  JetBrains_Mono,
  Kalam,
  Architects_Daughter,
  Indie_Flower,
  Patrick_Hand,
  Shadows_Into_Light,
  Edu_NSW_ACT_Cursive,
  Playwrite_IN,
  Cedarville_Cursive,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

const architectsDaughter = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-architects",
  display: "swap",
});

const indieFlower = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-indie",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patrick",
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shadows",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const eduCursive = Edu_NSW_ACT_Cursive({
  subsets: ["latin"],
  variable: "--font-edu-cursive",
  display: "swap",
});

const playwriteIN = Playwrite_IN({
  variable: "--font-playwrite-in",
  display: "swap",
});

const cedarville = Cedarville_Cursive({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cedarville",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyNotebook - Realistic Digital Notebook",
  description: "Experience true handwriting on ruled notebook paper.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cedarville+Cursive&family=Marck+Script&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${eduCursive.variable} ${playwriteIN.variable} ${cedarville.variable} ${kalam.variable} ${caveat.variable} ${architectsDaughter.variable} ${indieFlower.variable} ${patrickHand.variable} ${shadowsIntoLight.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
