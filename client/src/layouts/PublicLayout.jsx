import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Components
import Loader from '../components/Loader'
import NavbarPublic from '../components/navbar/NavbarPublic'
import FooterPublic from '../components/FooterPublic'

const PublicLayout = () => {
  return (
    <>
      <NavbarPublic />
      <main>
        <Toaster position='top-right' toastOptions={{ duration: 2500 }} />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <FooterPublic />
    </>
  )
}

export default PublicLayout
