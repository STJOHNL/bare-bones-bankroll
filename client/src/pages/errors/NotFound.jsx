import { Link } from 'react-router-dom'
// Assets
import notFoundImg from '../../assets/404Image.svg'
// Components
import PageTitle from '../../components/PageTitle'

const NotFound = () => {
  return (
    <>
      <PageTitle title={'Page not found'} hideTitle />
      <section className='error--wrapper'>
        <img
          src={notFoundImg}
          alt='404 Page Not Found'
          className='img--error'
        />
        <h1 className='heading-lg'>Not found</h1>
        <p>Sorry, the page you were looking for was not found.</p>
        <Link to='/' className='btn btn--primary'>
          Return to home
        </Link>
      </section>
    </>
  )
}

export default NotFound
