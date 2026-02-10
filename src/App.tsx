import { Toaster } from 'sonner';
import { DataProvider } from '@/context/DataContext';
import { useHashRoute } from '@/hooks/useHashRoute';
import type { RouteName } from '@/hooks/useHashRoute';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import KursePage from '@/pages/KursePage';
import RaeumePage from '@/pages/RaeumePage';
import DozentenPage from '@/pages/DozentenPage';
import TeilnehmerPage from '@/pages/TeilnehmerPage';
import AnmeldungenPage from '@/pages/AnmeldungenPage';

import './App.css';
// Cache bust v6

const pageMap: Record<RouteName, React.ComponentType> = {
  '': DashboardPage,
  kurse: KursePage,
  raeume: RaeumePage,
  dozenten: DozentenPage,
  teilnehmer: TeilnehmerPage,
  anmeldungen: AnmeldungenPage,
};

function App() {
  const { route, navigateTo } = useHashRoute();
  const PageComponent = pageMap[route] ?? DashboardPage;

  return (
    <DataProvider>
      <AppLayout route={route} navigateTo={navigateTo}>
        <PageComponent />
      </AppLayout>
      <Toaster position="bottom-right" richColors />
    </DataProvider>
  );
}

export default App;
