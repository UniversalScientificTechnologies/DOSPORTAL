import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouterLayout } from './components/RouterLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
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
import { InviteAcceptPage } from './pages/InviteAcceptPage'
import { DetectorCreatePage } from './pages/DetectorCreatePage'
import { LogsUploadPage } from './pages/LogsUploadPage'
import { MeasurementsPage } from './pages/MeasurementsPage'
import { MeasurementDetailPage } from './pages/MeasurementDetailPage'
import { LogsPage } from './pages/LogsPage'
import { SpectralRecordStatusPage } from './pages/SpectralRecordStatusPage'
import { SpectralRecordDetailPage } from './pages/SpectralRecordDetailPage'
import { AirportDetailPage } from './pages/AirportDetailPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { RecordSelectorPage } from './pages/RecordSelectorPage'
import { MeasurementCreatePage } from './pages/MeasurementCreatePage'

export const router = createBrowserRouter([
	{
		element: <RouterLayout />,
		children: [
			{ path: '/login',          element: <GuestRoute><LoginPage /></GuestRoute> },
			{ path: '/signup',         element: <GuestRoute><SignupPage /></GuestRoute> },
			{ path: '/signup/success', element: <SignupSuccessPage /> },
			{ path: '/',               element: <HomePage /> },
			{ path: '/logbooks',                    element: <ProtectedRoute><LogbooksPage /></ProtectedRoute> },
			{ path: '/logbook/:id',                 element: <ProtectedRoute><DetectorLogbookPage /></ProtectedRoute> },
			{ path: '/logbook/:id/create',          element: <ProtectedRoute><LogbookEntryPage /></ProtectedRoute> },
			{ path: '/logbook/:id/edit/:entryId',   element: <ProtectedRoute><LogbookEntryPage /></ProtectedRoute> },
			{ path: '/detector/create',             element: <ProtectedRoute><DetectorCreatePage /></ProtectedRoute> },
			{ path: '/profile',                     element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
			{ path: '/user/:id',                    element: <ProtectedRoute><UserDetailPage /></ProtectedRoute> },
			{ path: '/organization/create',         element: <ProtectedRoute><CreateOrganizationPage /></ProtectedRoute> },
			{ path: '/organization/:id',            element: <ProtectedRoute><OrganizationDetailPage /></ProtectedRoute> },
			{ path: '/invite/:token',               element: <InviteAcceptPage /> },
			{ path: '/logs/upload',                 element: <ProtectedRoute><LogsUploadPage /></ProtectedRoute> },
			{ path: '/measurements',                element: <ProtectedRoute><MeasurementsPage /></ProtectedRoute> },
			{ path: '/measurement/create',          element: <ProtectedRoute><RecordSelectorPage /></ProtectedRoute> },
			{ path: '/measurement/create/details',  element: <ProtectedRoute><MeasurementCreatePage /></ProtectedRoute> },
			{ path: '/measurement/:id',             element: <ProtectedRoute><MeasurementDetailPage /></ProtectedRoute> },
			{ path: '/logs',                        element: <ProtectedRoute><LogsPage /></ProtectedRoute> },
			{ path: '/spectral-record-status/:id',  element: <ProtectedRoute><SpectralRecordStatusPage /></ProtectedRoute> },
			{ path: '/spectral-record/:id',         element: <ProtectedRoute><SpectralRecordDetailPage /></ProtectedRoute> },
			{ path: '/airport/:id',                 element: <ProtectedRoute><AirportDetailPage /></ProtectedRoute> },
			{ path: '*',                            element: <Navigate to="/" replace /> },
		],
	},
])
