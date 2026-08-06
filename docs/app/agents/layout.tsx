import { Navbar } from "@/sections/layout/navbar";
import { Footer } from "@/sections/layout/footer";
import type { ReactNode } from "react";

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
