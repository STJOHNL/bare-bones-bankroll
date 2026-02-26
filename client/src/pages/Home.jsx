import { Link } from 'react-router-dom'
import { FaDollarSign, FaHistory, FaChartLine } from 'react-icons/fa'
import PageTitle from '../components/PageTitle'

const Home = () => {
  return (
    <>
      <PageTitle title='Bankroll' hideTitle />

      <section className='hero'>
        <h1 className='hero__title'>Bankroll</h1>
        <p className='hero__subtitle'>
          Track your poker sessions, manage your bankroll, and analyze your performance — all in one clean, simple app.
        </p>
        <div className='hero__actions'>
          <Link to='/sign-up' className='btn btn--primary'>Get started</Link>
          <Link to='/sign-in' className='btn btn--outline'>Sign in</Link>
        </div>
      </section>

      <section className='features'>
        <div className='feature'>
          <FaDollarSign className='feature__icon' />
          <h3 className='feature__title'>Bankroll Management</h3>
          <p className='feature__desc'>
            Track deposits, withdrawals, and your running balance with a full transaction history.
          </p>
        </div>
        <div className='feature'>
          <FaHistory className='feature__icon' />
          <h3 className='feature__title'>Session Logging</h3>
          <p className='feature__desc'>
            Log every session with buy-in, cash-out, venue, game type, and notes. Never lose track of a hand.
          </p>
        </div>
        <div className='feature'>
          <FaChartLine className='feature__icon' />
          <h3 className='feature__title'>Performance Stats</h3>
          <p className='feature__desc'>
            View your win rate, P/L, and average session results filtered by day, week, month, or all time.
          </p>
        </div>
      </section>
    </>
  )
}

export default Home
