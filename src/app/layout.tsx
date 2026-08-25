import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import { AuthModalProvider } from "@/components/auth-modal";
import "./globals.css";

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const money = Space_Grotesk({
  variable: "--font-money",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SownTV Socials",
    template: "%s · SownTV Socials",
  },
  description: "Professional social media growth panel for YouTube, Instagram, TikTok and more.",
  icons: {
    icon: "/sown-tv-mark.svg",
    apple: "/sown-tv-mark.svg",
    shortcut: "/sown-tv-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${money.variable} h-full antialiased`}>
      <body className={`${body.className} min-h-full`}>
        <AuthModalProvider>{children}</AuthModalProvider>
      </body>
    </html>
  );
}
