import { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * Catches unhandled JavaScript errors anywhere in the component tree below it.
 * Without this, a runtime error in any page crashes the entire React app.
 * Usage: wrap the router or top-level components with <ErrorBoundary>.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production, send to an error monitoring service (e.g. Sentry)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <Link
            to='/dashboard'
            className='btn btn--primary'
            onClick={() => this.setState({ hasError: false, error: null })}>
            Back to Dashboard
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
