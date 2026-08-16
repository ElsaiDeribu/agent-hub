"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/sections/layout/footer";
import { Navbar } from "@/sections/layout/navbar";
import { StatusPage } from "@/sections/layout/status-page";
import { paths } from "@/routes/paths";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <StatusPage
        icon={AlertCircle}
        title="Something went wrong"
        description="An unexpected error occurred. Try again or head back to the homepage."
        actions={
          <>
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href={paths.home}>Go home</Link>
            </Button>
          </>
        }
      />
      <Footer />
    </>
  );
}
