import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DashboardOverview } from '@/pages/DashboardOverview';
import { KursePage } from '@/pages/KursePage';
import { AnmeldungenPage } from '@/pages/AnmeldungenPage';
import { TeilnehmerPage } from '@/pages/TeilnehmerPage';
import { DozentenPage } from '@/pages/DozentenPage';
import { RaeumePage } from '@/pages/RaeumePage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/kurse" element={<KursePage />} />
        <Route path="/anmeldungen" element={<AnmeldungenPage />} />
        <Route path="/teilnehmer" element={<TeilnehmerPage />} />
        <Route path="/dozenten" element={<DozentenPage />} />
        <Route path="/raeume" element={<RaeumePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
