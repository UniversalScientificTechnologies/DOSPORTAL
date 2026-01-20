import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Navbar } from './components/Navbar'
import { Layout } from './components/Layout'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { LogbooksPage } from './pages/LogbooksPage'
import { DetectorLogbookPage } from './pages/DetectorLogbookPage'
import { LogbookEntryPage } from './pages/LogbookEntryPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  const { API_BASE, ORIGIN_BASE, isAuthed, login, logout } = useAuth()

  return (
    <BrowserRouter>
      <Layout>
        <Navbar isAuthed={isAuthed} onLogout={logout} />
        <Routes>
          <Route
            path="/login"
            element={isAuthed ? <Navigate to="/" replace /> : <LoginPage originBase={ORIGIN_BASE} onLogin={login} />}
          />
          <Route path="/" element={<HomePage />} />
          <Route path="/logbooks" element={<LogbooksPage apiBase={API_BASE} isAuthed={isAuthed} />} />
          <Route path="/logbook/:id" element={<DetectorLogbookPage apiBase={API_BASE} isAuthed={isAuthed} />} />
          <Route path="/logbook/:id/create" element={<LogbookEntryPage apiBase={API_BASE} isAuthed={isAuthed} />} />
          <Route path="/logbook/:id/edit/:entryId" element={<LogbookEntryPage apiBase={API_BASE} isAuthed={isAuthed} />} />
          <Route path="/profile" element={<ProfilePage apiBase={API_BASE} originBase={ORIGIN_BASE} isAuthed={isAuthed} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
