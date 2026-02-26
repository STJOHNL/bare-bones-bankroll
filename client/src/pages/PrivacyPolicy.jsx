import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'

const PrivacyPolicy = () => {
  return (
    <>
      <PageTitle title='Privacy Policy' />

      <div className='prose'>
        <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>1. What We Collect</h2>
        <p>We collect the following information when you use Bankroll:</p>
        <ul>
          <li><strong>Account info</strong> — your name and email address when you register</li>
          <li><strong>Session data</strong> — poker sessions, transactions, and bankroll entries you create</li>
          <li><strong>Usage data</strong> — basic information about how you interact with the Service</li>
          <li><strong>Technical data</strong> — IP address and browser type for security and diagnostic purposes</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <p>Your data is used to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Authenticate your account and keep it secure</li>
          <li>Respond to support requests</li>
          <li>Comply with applicable laws and regulations</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>

        <h2>3. Data Security</h2>
        <p>
          We take reasonable technical and organizational measures to protect your data, including encrypted
          storage and secure authentication tokens. However, no system is entirely secure and we cannot
          guarantee absolute protection against unauthorized access.
        </p>

        <h2>4. Third Parties</h2>
        <p>
          We do not share your personal information with third parties except as required by law or to
          operate core infrastructure (e.g. cloud hosting providers). Any third-party service providers
          are contractually required to handle your data securely and only for the purposes we specify.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
        </ul>
        <p>
          You can update your account information through your profile settings. To request full data
          deletion, contact us through the <Link to='/support'>Support</Link> page.
        </p>

        <h2>6. Cookies &amp; Storage</h2>
        <p>
          Bankroll uses authentication tokens stored in your browser's local storage to keep you signed
          in. We do not use third-party tracking cookies or advertising cookies.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. When you delete your account, all
          associated session and transaction data is permanently removed.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this policy as the Service evolves. Continued use of the Service after changes
          are posted constitutes acceptance of the updated policy.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about this policy? Contact us through the <Link to='/support'>Support</Link> page.
        </p>
      </div>
    </>
  )
}

export default PrivacyPolicy
