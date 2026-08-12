import { paths } from "@/routes/paths";

export const HOST_API =
  process.env.NEXT_PUBLIC_HOST_API?.replace(/\/$/, "") || "http://localhost:8000";


// ROOT PATH AFTER LOGIN SUCCESSFUL
export const PATH_AFTER_LOGIN = paths.docs.root;