// src/components/ErrorBoundary.tsx
import React from 'react'

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, msg?: string}> {
  constructor(props:any){ super(props); this.state = { hasError:false } }
  static getDerivedStateFromError(err: any){ return { hasError: true, msg: String(err) } }
  componentDidCatch(err:any, info:any){ console.error('[ErrorBoundary]', err, info) }
  render(){
    if (this.state.hasError) return <div style={{padding:16}}>Terjadi error: {this.state.msg}</div>
    return this.props.children
  }
}
