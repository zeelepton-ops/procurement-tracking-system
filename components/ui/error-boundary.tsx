"use client"

import React from 'react'

export default class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // Log errors to console; in future we could send to Sentry
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-red-600 italic">Failed to load suggestions. You can still type to enter a value.</div>
      )
    }
    return this.props.children
  }
}
