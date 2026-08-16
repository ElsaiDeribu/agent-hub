import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/sections/layout/footer";
import { Navbar } from "@/sections/layout/navbar";
import { paths } from "@/routes/paths";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24 sm:pb-64">
        <p className="text-[2rem] font-bold leading-none tracking-tighter text-foreground/15 sm:text-[4rem]">
          404
        </p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
          Page not found
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href={paths.home}>Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={paths.agents}>Browse agents</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
