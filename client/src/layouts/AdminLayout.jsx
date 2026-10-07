import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Components
import Loader from '../components/Loader'
import NavbarAdmin from '../components/navbar/NavbarAdmin'
import FooterPrivate from '../components/FooterPrivate'

const AdminLayout = () => {
  return (
    <>
      <NavbarAdmin />
      <main>
        <Toaster position='top-right' toastOptions={{ duration: 2500 }} />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <FooterPrivate />
    </>
  )
}

export default AdminLayout
