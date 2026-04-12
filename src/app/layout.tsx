import type { Metadata } from "next";
import { AppToaster } from "@/components/ui/app-toaster";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { PatientsProvider } from "@/components/providers/patients-provider";
import { PusherBeamsClient } from "@/components/pusher-beams-client";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetFichas",
  description: "Fichas de pacientes veterinarios",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <SessionProvider>
          <NotificationsProvider>
            <PatientsProvider>{children}</PatientsProvider>
          </NotificationsProvider>
          <PusherBeamsClient />
        </SessionProvider>
        <AppToaster />
      </body>
    </html>
  );
}
