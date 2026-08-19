import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AgentHub account",
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInView />
    </Suspense>
  );
}
