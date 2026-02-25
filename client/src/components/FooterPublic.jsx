import { Link } from 'react-router-dom'

const FooterPublic = () => {
  return (
    <footer>
      <p>© {new Date().getFullYear()} Bankroll. All rights reserved.</p>
      <div>
        <Link to='/terms'>Terms</Link>
        <Link to='/privacy-policy'>Privacy Policy</Link>
      </div>
    </footer>
  )
}

export default FooterPublic
