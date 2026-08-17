import { paths } from "@/routes/paths";

export const HOST_API =
  process.env.NEXT_PUBLIC_HOST_API?.replace(/\/$/, "") || "http://localhost:8000";


// ROOT PATH AFTER SIGN-IN SUCCESSFUL
export const PATH_AFTER_SIGN_IN = paths.docs.root;