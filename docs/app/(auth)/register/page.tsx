import type { Metadata } from "next";
import { RegisterView } from "@/sections/auth";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your AgentHub account",
};

export default function RegisterPage() {
  return <RegisterView />;
}
