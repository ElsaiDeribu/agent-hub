// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  home: '/',
  page403: '/403',
  page404: '/404',
  page500: '/500',

  dashboard: {
    root: ROOTS.DASHBOARD,
    agents: {
      detail: (name: string) => `${ROOTS.DASHBOARD}/agents/${name}`,
    },
  },

  // AUTH
  auth: {
    login: `${ROOTS.AUTH}/login`,
    register: `${ROOTS.AUTH}/register`,
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
  },
};
