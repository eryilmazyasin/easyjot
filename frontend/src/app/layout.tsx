import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/Auth/AuthProvider";
import { AppShell } from "@/components/Layout/AppShell";
import { PwaRegistration } from "@/components/Pwa/PwaRegistration";
import type { RootLayoutProps } from "./layout.types";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EasyJot",
    template: "%s · EasyJot",
  },
  description: "Tek cümleyle harcamalarını kaydet, bütçeni anında takip et.",
  applicationName: "EasyJot",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyJot",
  },
  icons: {
    icon: "/easyjot-icon.svg",
    apple: "/easyjot-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#17352c",
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <PwaRegistration />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
