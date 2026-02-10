import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DataProvider } from '@/context/DataContext';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import KursePage from '@/pages/KursePage';
import RaeumePage from '@/pages/RaeumePage';
import DozentenPage from '@/pages/DozentenPage';
import TeilnehmerPage from '@/pages/TeilnehmerPage';
import AnmeldungenPage from '@/pages/AnmeldungenPage';

import './App.css';

function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="kurse" element={<KursePage />} />
            <Route path="raeume" element={<RaeumePage />} />
            <Route path="dozenten" element={<DozentenPage />} />
            <Route path="teilnehmer" element={<TeilnehmerPage />} />
            <Route path="anmeldungen" element={<AnmeldungenPage />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" richColors />
      </DataProvider>
    </HashRouter>
  );
}

export default App;
