import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Components
import Loader from '../components/Loader'
import NavbarPrivate from '../components/navbar/NavbarPrivate'
import FooterPrivate from '../components/FooterPrivate'

const PrivateLayout = () => {
  return (
    <>
      <NavbarPrivate />
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

export default PrivateLayout
