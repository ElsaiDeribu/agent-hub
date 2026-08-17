import type { Metadata } from "next";
import { SignInView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AgentHub account",
};

export default function SignInPage() {
  return <SignInView />;
}
