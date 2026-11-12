import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import ServerDetailPage from './pages/ServerDetailPage'
import ServerFormPage from './pages/ServerFormPage'
import ServersPage from './pages/ServersPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="servers/new" element={<ServerFormPage />} />
            <Route path="servers/:id" element={<ServerDetailPage />} />
            <Route path="servers/:id/edit" element={<ServerFormPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
