import { lazy } from 'react'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
// Layouts
import PublicLayout from './layouts/PublicLayout'
import PrivateLayout from './layouts/PrivateLayout'
import AdminLayout from './layouts/AdminLayout'

// Pages — error pages load eagerly; the rest are split into their own chunks
import Error from './pages/errors/Error'
import NotFound from './pages/errors/NotFound'
const Home = lazy(() => import('./pages/Home'))
const Terms = lazy(() => import('./pages/Terms'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const SignIn = lazy(() => import('./pages/SignIn'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const Support = lazy(() => import('./pages/Support'))
const NewSession = lazy(() => import('./pages/NewSession'))
const EditSession = lazy(() => import('./pages/EditSession'))
const Bankroll = lazy(() => import('./pages/Bankroll'))
const Reports = lazy(() => import('./pages/Reports'))
const Randomizer = lazy(() => import('./pages/Randomizer'))
const SupportTickets = lazy(() => import('./pages/SupportTickets'))
const EditSupportTicket = lazy(() => import('./pages/EditSupportTicket'))

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path='/'
      errorElement={<Error />}>
      <Route
        path='/'
        element={<PublicLayout />}
        errorElement={<Error />}>
        <Route
          index
          element={<Home />}
        />
        <Route
          path='terms'
          element={<Terms />}
        />
        <Route
          path='privacy-policy'
          element={<PrivacyPolicy />}
        />
        <Route
          path='sign-in'
          element={<SignIn />}
        />
        <Route
          path='sign-up'
          element={<SignUp />}
        />
        <Route
          path='forgot-password'
          element={<ForgotPassword />}
        />
        <Route
          path='reset-password/:token'
          element={<ResetPassword />}
        />
      </Route>
      <Route
        path='/'
        element={<PrivateLayout />}
        errorElement={<Error />}>
        <Route
          path='dashboard'
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path='profile/:id'
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path='support'
          element={
            <PrivateRoute>
              <Support />
            </PrivateRoute>
          }
        />
        <Route
          path='sessions/new'
          element={
            <PrivateRoute>
              <NewSession />
            </PrivateRoute>
          }
        />
        <Route
          path='sessions/:id/edit'
          element={
            <PrivateRoute>
              <EditSession />
            </PrivateRoute>
          }
        />
        <Route
          path='bankroll'
          element={
            <PrivateRoute>
              <Bankroll />
            </PrivateRoute>
          }
        />
        <Route
          path='history'
          element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          }
        />
        <Route
          path='reports'
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path='randomizer'
          element={
            <PrivateRoute>
              <Randomizer />
            </PrivateRoute>
          }
        />
      </Route>
      <Route
        path='/'
        element={<AdminLayout />}
        errorElement={<Error />}>
        <Route
          path='support-tickets'
          element={
            <AdminRoute>
              <SupportTickets />
            </AdminRoute>
          }
        />
        <Route
          path='support-tickets/:id'
          element={
            <AdminRoute>
              <EditSupportTicket />
            </AdminRoute>
          }
        />
        <Route
          path='admin'
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>
      <Route
        path='*'
        element={<NotFound />}
      />
    </Route>
  )
)

function App() {
  // ErrorBoundary catches render errors anywhere in the app and shows a fallback
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App
