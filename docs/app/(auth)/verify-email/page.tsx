import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your AgentHub account email address",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}
