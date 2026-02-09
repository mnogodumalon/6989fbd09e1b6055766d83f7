import { Routes, Route } from 'react-router'
import { Layout } from '@/components/Layout'
import { DashboardOverview } from '@/pages/DashboardOverview'
import { KursePage } from '@/pages/KursePage'
import { DozentenPage } from '@/pages/DozentenPage'
import { TeilnehmerPage } from '@/pages/TeilnehmerPage'
import { RaeumePage } from '@/pages/RaeumePage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/kurse" element={<KursePage />} />
        <Route path="/dozenten" element={<DozentenPage />} />
        <Route path="/teilnehmer" element={<TeilnehmerPage />} />
        <Route path="/raeume" element={<RaeumePage />} />
      </Routes>
    </Layout>
  )
}

export default App
