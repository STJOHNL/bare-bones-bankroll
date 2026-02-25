import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Components
import NavbarPublic from '../components/navbar/NavbarPublic'
import FooterPublic from '../components/FooterPublic'

const PublicLayout = () => {
  return (
    <>
      {/* <HeaderPublic /> */}
      <NavbarPublic />
      <main>
        <Toaster position='top-right' toastOptions={{ duration: 2500 }} />
        <Outlet />
      </main>
      <FooterPublic />
    </>
  )
}

export default PublicLayout
