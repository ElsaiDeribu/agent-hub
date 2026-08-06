import { redirect } from "next/navigation";
import { paths } from "@/routes/paths";

export default function Home() {
  redirect(paths.docs.root);
}
