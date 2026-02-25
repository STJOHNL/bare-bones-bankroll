import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Components
import NavbarPrivate from '../components/navbar/NavbarPrivate'
import FooterPrivate from '../components/FooterPrivate'

const PrivateLayout = () => {
  return (
    <>
      <NavbarPrivate />
      {/* <div className='construction'>
        Site is under construction. Data/pages may appear blank or erroneous. The College Football and NFL predictors
        are operational.
      </div> */}
      <main>
        <Toaster
          position='top-right'
          toastOptions={{ duration: 2500 }}
        />
        <Outlet />
      </main>
      <FooterPrivate />
    </>
  )
}

export default PrivateLayout
