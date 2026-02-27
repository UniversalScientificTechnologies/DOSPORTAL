import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouterLayout } from './RouterLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { GuestRoute } from '@/features/auth/GuestRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { SignupSuccessPage } from '@/features/auth/pages/SignupSuccessPage'
import { InviteAcceptPage } from '@/features/organization/pages/InviteAcceptPage'
import { LogbooksPage } from '@/features/devices/pages/LogbooksPage'
import { DevicePage } from '@/features/devices/pages/DevicePage'
import { LogbookEntryPage } from '@/features/devices/pages/LogbookEntryPage'
import { ProfilePage } from '@/features/organization/pages/ProfilePage'
import { CreateOrganizationPage } from '@/features/organization/pages/CreateOrganizationPage'
import { OrganizationDetailPage } from '@/features/organization/pages/OrganizationDetailPage'
import { DetectorCreatePage } from '@/features/devices/pages/DetectorCreatePage'
import { LogsUploadPage } from '@/features/logs/pages/LogsUploadPage'
import { MeasurementsPage } from '@/features/measurements/pages/MeasurementsPage'
import { MeasurementDetailPage } from '@/features/measurements/pages/MeasurementDetailPage'
import { LogsPage } from '@/features/logs/pages/LogsPage'
import { SpectralRecordStatusPage } from '@/features/logs/pages/SpectralRecordStatusPage'
import { SpectralRecordDetailPage } from '@/features/logs/pages/SpectralRecordDetailPage'
import { AirportDetailPage } from '@/features/flights/pages/AirportDetailPage'
import { UserDetailPage } from '@/features/organization/pages/UserDetailPage'
import { RecordSelectorPage } from '@/features/logs/pages/RecordSelectorPage'
import { MeasurementCreatePage } from '@/features/measurements/pages/MeasurementCreatePage'


export const router = createBrowserRouter([
	{
		element: <RouterLayout />,
		children: [
			{ path: '/login',                       element: <GuestRoute><LoginPage /></GuestRoute> },
			{ path: '/signup',                      element: <GuestRoute><SignupPage /></GuestRoute> },
			{ path: '/signup/success',              element: <SignupSuccessPage /> },
			{ path: '/',                            element: <HomePage /> },
			{ path: '/devices',                     element: <ProtectedRoute><LogbooksPage /></ProtectedRoute> },
			{ path: '/device/:id',                  element: <ProtectedRoute><DevicePage /></ProtectedRoute> },
			{ path: '/device/:id/create',           element: <ProtectedRoute><LogbookEntryPage /></ProtectedRoute> },
			{ path: '/device/:id/edit/:entryId',    element: <ProtectedRoute><LogbookEntryPage /></ProtectedRoute> },
			{ path: '/device/create',               element: <ProtectedRoute><DetectorCreatePage /></ProtectedRoute> },
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
