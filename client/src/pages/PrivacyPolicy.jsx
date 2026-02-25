import { Link } from 'react-router-dom'
// Components
import PageTitle from '../components/PageTitle'

const PrivacyPolicy = () => {
  return (
    <>
      <PageTitle title={'Privacy policy'} />

      <section>
        <h2 className='heading-md'>How We Guard Your Data (It's Our Top Defense Strategy)</h2>
        <ol>
          <li>What We Collect: - Basic info you give us (like your email) - How you use our site (pages visited, time spent) - Tech stuff (IP address, browser type)</li>
          <li>How We Use It: - To make our service better - To keep you in the loop about updates - To follow the law</li>
          <li>Keeping Your Info Safe: We guard your data like it's the last water bottle at a marathon.</li>
          <li>Sharing: We don't sell your personal info. We might share general, anonymous data (like "X% of our users love underdogs").</li>
          <li>Your Rights: You can ask to see, change, or delete your info anytime.</li>
          <li>
            Cookies: We use cookies, but not the tasty kind. They help us understand how people use our site. 7. Changes: We might update this policy sometimes. Check back to stay in the know. 8.
            Questions? Hit us up at <Link to='mailto:logan@devtivity.com'>logan@devtivity.com</Link>. Always happy to chat!
          </li>
        </ol>
      </section>
    </>
  )
}

export default PrivacyPolicy
