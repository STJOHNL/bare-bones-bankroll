import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'

const Terms = () => {
  return (
    <>
      <PageTitle title='Terms of Service' />

      <div className='prose'>
        <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Bankroll ("the Service"), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Bankroll is a personal finance tracking tool designed to help poker players log sessions, track
          buy-ins and cash-outs, and manage their bankroll. The Service is provided for personal,
          non-commercial use only.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all
          activity that occurs under your account. You must provide accurate information when registering
          and keep it up to date.
        </p>

        <h2>4. User Responsibilities</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Upload or transmit malicious code or harmful content</li>
          <li>Interfere with or disrupt the operation of the Service</li>
          <li>Impersonate any other person or entity</li>
        </ul>

        <h2>5. Accuracy of Information</h2>
        <p>
          Bankroll is a personal tracking tool. We do not verify the accuracy of the data you enter.
          You are solely responsible for the data you record and any decisions made based on it. The
          Service should not be relied upon for financial, legal, or tax advice.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content, design, and code comprising the Service are the property of Bankroll and may not
          be reproduced, distributed, or used without prior written permission.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          Bankroll is provided "as is" without warranties of any kind, express or implied. We are not
          liable for any indirect, incidental, or consequential damages arising from your use of the
          Service, including any financial decisions made based on data tracked within the app.
        </p>

        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violations of these
          terms or for any other reason at our discretion. You may also delete your account at any time
          from your profile settings.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the Service after changes are
          posted constitutes acceptance of the updated terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these terms? Reach out through the <Link to='/support'>Support</Link> page.
        </p>
      </div>
    </>
  )
}

export default Terms
