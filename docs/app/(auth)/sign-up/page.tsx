import type { Metadata } from "next";
import { SignUpView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your AgentHub account",
};

export default function SignUpPage() {
  return <SignUpView />;
}
