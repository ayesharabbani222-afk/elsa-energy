import { Component } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

// Catches JavaScript errors anywhere in the component tree below it and shows
// a friendly, on-brand fallback instead of a blank white screen / stack trace.
// This is a page-level safety net — without it, one bad render on any of the
// app's 70+ pages takes down the entire app for the rest of the session.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production this is where you'd forward to a logging service.
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-danger-100 dark:bg-danger-700/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-danger-600" />
          </div>
          <h1 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-1.5">Something went wrong on this page</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            The rest of the app is fine — this screen ran into an error. You can try again or head back to safety.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button type="button" className="btn-secondary" onClick={this.handleReset}>
              <RotateCcw size={14} /> Try Again
            </button>
            <button type="button" className="btn-primary" onClick={() => { this.handleReset(); window.location.assign('/') }}>
              <Home size={14} /> Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
