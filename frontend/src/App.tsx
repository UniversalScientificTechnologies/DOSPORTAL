import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Layout } from './components/Layout'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SignupSuccessPage } from './pages/SignupSuccessPage'
import { LogbooksPage } from './pages/LogbooksPage'
import { DetectorLogbookPage } from './pages/DetectorLogbookPage'
import { LogbookEntryPage } from './pages/LogbookEntryPage'
import { ProfilePage } from './pages/ProfilePage'
import { CreateOrganizationPage } from './pages/CreateOrganizationPage'
import { OrganizationDetailPage } from './pages/OrganizationDetailPage'
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { DetectorCreatePage } from './pages/DetectorCreatePage';
import { FileUploadPage } from './pages/FileUploadPage';
import { MeasurementsPage } from './pages/MeasurementsPage';
import { MeasurementDetailPage } from './pages/MeasurementDetailPage';
import { AirportDetailPage } from './pages/AirportDetailPage';

function App() {
  const { API_BASE, ORIGIN_BASE, isAuthed, login, signup, logout, getAuthHeader } = useAuth()

  return (
    <BrowserRouter>
      <Layout isAuthed={isAuthed} onLogout={logout}>
        <Routes>
          <Route
            path="/login"
            element={isAuthed ? <Navigate to="/" replace /> : <LoginPage originBase={ORIGIN_BASE} onLogin={login} />}
          />
          <Route
            path="/signup"
            element={isAuthed ? <Navigate to="/" replace /> : <SignupPage originBase={ORIGIN_BASE} onSignup={signup} />}
          />
          <Route path="/signup/success" element={<SignupSuccessPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/logbooks" element={<LogbooksPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/logbook/:id" element={<DetectorLogbookPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/logbook/:id/create" element={<LogbookEntryPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/logbook/:id/edit/:entryId" element={<LogbookEntryPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/detector/create" element={<DetectorCreatePage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/profile" element={<ProfilePage apiBase={API_BASE} originBase={ORIGIN_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/organization/create" element={<CreateOrganizationPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/organization/:id" element={<OrganizationDetailPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/invite/:token" element={<InviteAcceptPage apiBase={API_BASE} getAuthHeader={getAuthHeader} />} />
          <Route path="/files/upload" element={<FileUploadPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/measurements" element={<MeasurementsPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/measurement/:id" element={<MeasurementDetailPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="/airport/:id" element={<AirportDetailPage apiBase={API_BASE} isAuthed={isAuthed} getAuthHeader={getAuthHeader} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
