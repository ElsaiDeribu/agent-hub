import './App.css';

import Router from '@/routes/sections';
import { AuthProvider } from '@/auth/context/auth';
import ThemeProvider from '@/theme/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
