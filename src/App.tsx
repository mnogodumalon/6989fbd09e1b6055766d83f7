import './App.css'
import Dashboard from '@/pages/Dashboard'
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Dashboard />
      <Toaster position="bottom-right" richColors />
    </>
  )
}

export default App
