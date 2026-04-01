import type { Metadata } from "next";
import { AppToaster } from "@/components/ui/app-toaster";
import { PatientsProvider } from "@/components/providers/patients-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetFichas",
  description: "Fichas de pacientes veterinarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <PatientsProvider>{children}</PatientsProvider>
        <AppToaster />
      </body>
    </html>
  );
}
