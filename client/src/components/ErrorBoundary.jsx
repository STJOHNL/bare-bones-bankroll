import { Component } from 'react'
import logger from '../utils/logger'

/**
 * Catches unhandled JavaScript errors anywhere in the component tree below it.
 * Without this, a runtime error in any page crashes the entire React app.
 * It sits outside the router, so it uses a plain link rather than <Link>.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logger.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <a href='/dashboard' className='btn btn--primary'>
            Back to Dashboard
          </a>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
