import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
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

function AppRoutes() {
  const { ORIGIN_BASE, isAuthed, isLoading, login, signup, logout } = useAuthContext()

  if (isLoading) {
    return null
  }

  return (
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
        <Route path="/logbooks" element={<ProtectedRoute><LogbooksPage /></ProtectedRoute>} />
        <Route path="/logbook/:id" element={<ProtectedRoute><DetectorLogbookPage /></ProtectedRoute>} />
        <Route path="/logbook/:id/create" element={<ProtectedRoute><LogbookEntryPage /></ProtectedRoute>} />
        <Route path="/logbook/:id/edit/:entryId" element={<ProtectedRoute><LogbookEntryPage /></ProtectedRoute>} />
        <Route path="/detector/create" element={<ProtectedRoute><DetectorCreatePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/organization/create" element={<ProtectedRoute><CreateOrganizationPage /></ProtectedRoute>} />
        <Route path="/organization/:id" element={<ProtectedRoute><OrganizationDetailPage /></ProtectedRoute>} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
