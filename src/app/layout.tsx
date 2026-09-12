import type { Metadata, Viewport } from "next";
import "../index.css";
import { ClientProviders } from "../components/ClientProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Noted - Your Task Management Companion",
  description:
    "A modern task management application to help you stay organized and productive",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Noted",
  },
  icons: {
    icon: "/assets/favicon/Noted-app-icon.png",
    apple: "/assets/favicon/Noted-app-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Clash+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-pri-blue-50 dark:bg-neu-gre-800">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
