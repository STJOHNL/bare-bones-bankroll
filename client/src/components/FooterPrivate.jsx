import { Link } from 'react-router-dom'

const FooterPrivate = () => {
  return (
    <footer>
      <p>© {new Date().getFullYear()} Bankroll. All rights reserved.</p>
      <div>
        <Link to='/support'>Support</Link>
        <Link to='/terms'>Terms</Link>
        <Link to='/privacy-policy'>Privacy Policy</Link>
      </div>
    </footer>
  )
}

export default FooterPrivate
