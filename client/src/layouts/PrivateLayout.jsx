import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Context
import { PlayerNotesProvider } from '../context/PlayerNotesContext'
// Components
import Loader from '../components/Loader'
import NavbarPrivate from '../components/navbar/NavbarPrivate'
import FooterPrivate from '../components/FooterPrivate'
import PinnedPlayersDock from '../components/players/PinnedPlayersDock'

const PrivateLayout = () => {
  return (
    <PlayerNotesProvider>
      <NavbarPrivate />
      <main>
        <Toaster position='top-right' toastOptions={{ duration: 2500 }} />
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <FooterPrivate />
      <PinnedPlayersDock />
    </PlayerNotesProvider>
  )
}

export default PrivateLayout
