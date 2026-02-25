import { useRouteError, Link, useLocation } from 'react-router-dom'
//Assets
import errorImg from '../../assets/errorImage.svg'
// Components
import PageTitle from '../../components/PageTitle'

export default function Error() {
  const location = useLocation()
  const { pathname } = location
  const error = useRouteError()

  let errorMessage = error?.message || 'An unexpected error occurred'
  let errorDetails = error?.stack || ''

  const isFileNotFoundError = errorMessage.includes('File not found')

  return (
    <main>
      <PageTitle
        title={isFileNotFoundError ? 'File not found' : 'Uh oh!'}
        hideTitle
      />
      <section className='error--wrapper'>
        <img src={errorImg} alt='Error' className='img--error' />
        <h1 className='heading-lg'>An unexpected error occurred</h1>
        {isFileNotFoundError ? (
          <p>
            The requested file could not be found. Please check the file path
            and try again.
          </p>
        ) : (
          <p>We encountered an unexpected error.</p>
        )}
        <Link to='/' className='btn btn--primary'>
          Return to home
        </Link>
        <Link to='/support'>Need support?</Link>
        <div className='error--details'>
          <span>Pathname: {pathname}</span>
          <span>Error: {errorMessage}</span>
          <span>{errorDetails}</span>
        </div>
      </section>
    </main>
  )
}
