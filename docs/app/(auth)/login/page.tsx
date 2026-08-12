import type { Metadata } from "next";
import { LoginView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your AgentHub account",
};

export default function LoginPage() {
  return <LoginView />;
}
