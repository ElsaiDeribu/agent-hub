// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '',
  DOCS: '/docs',
};

// ----------------------------------------------------------------------

export const paths = {
  home: '/',
  page403: '/403',
  page404: '/404',
  page500: '/500',

  docs: {
    root: ROOTS.DOCS,
    agents: {
      detail: (name: string) => `${ROOTS.DOCS}/agents/${name}`,
    },
  },

  // AUTH
  auth: {
    login: `${ROOTS.AUTH}/login`,
    register: `${ROOTS.AUTH}/register`,
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
  },
};
