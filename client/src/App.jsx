import React from 'react'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'
// Layouts
import PublicLayout from './layouts/PublicLayout'
import PrivateLayout from './layouts/PrivateLayout'
import AdminLayout from './layouts/AdminLayout'

// Pages
import Error from './pages/errors/Error'
import NotFound from './pages/errors/NotFound'
import Home from './pages/Home'
import Terms from './pages/Terms'
import PrivacyPolicy from './pages/PrivacyPolicy'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Support from './pages/Support'
import NewSession from './pages/NewSession'
import EditSession from './pages/EditSession'
import Bankroll from './pages/Bankroll'
import SupportTickets from './pages/SupportTickets'
import EditSupportTicket from './pages/EditSupportTicket'

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
  return <RouterProvider router={router} />
}

export default App
