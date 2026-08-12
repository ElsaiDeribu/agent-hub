// ----------------------------------------------------------------------

const ROOTS = {
  DOCS: "/docs",
};

// ----------------------------------------------------------------------

export const paths = {
  home: "/",
  agents: "/agents",

  docs: {
    root: ROOTS.DOCS,
    installation: `${ROOTS.DOCS}/installation`,
    agents: {
      detail: (name: string) => `${ROOTS.DOCS}/agents/${name}`,
    },
  },

  // AUTH
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
};
