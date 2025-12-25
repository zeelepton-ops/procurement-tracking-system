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
    // Log errors to console
    console.error('ErrorBoundary caught an error:', error, info)

    // Send a lightweight telemetry payload to the server for debugging.
    // Avoid sending sensitive user data. Only include stack, component trace and browser context.
    try {
      const payload = {
        message: error?.message || String(error),
        stack: error?.stack || null,
        componentStack: info?.componentStack || null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString()
      }
      // fire-and-forget; do not block rendering
      void fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('Failed to send client telemetry:', e))
    } catch (e) {
      console.warn('Telemetry reporting failed:', e)
    }
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
