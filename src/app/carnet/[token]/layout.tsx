import { Nunito } from "next/font/google";
import type { ReactNode } from "react";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export default function CarnetTokenLayout({ children }: { children: ReactNode }) {
  return <div className={`${nunito.className} min-h-screen antialiased`}>{children}</div>;
}
