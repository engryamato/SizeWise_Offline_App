'use client'
import { SpiralAnimation } from './SpiralAnimation'

interface LoadingSpinnerProps {
  /** Size of the spinner container */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  /** Optional text to display below the spinner */
  text?: string
  /** Custom className for the container */
  className?: string
  /** Whether to show on a dark background */
  darkMode?: boolean
}

export function LoadingSpinner({ 
  size = 'medium', 
  text, 
  className = '',
  darkMode = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32', 
    large: 'w-48 h-48',
    fullscreen: 'w-full h-full'
  }

  const containerClasses = {
    small: 'flex flex-col items-center justify-center gap-2',
    medium: 'flex flex-col items-center justify-center gap-3',
    large: 'flex flex-col items-center justify-center gap-4',
    fullscreen: 'flex flex-col items-center justify-center gap-4 min-h-screen'
  }

  return (
    <div className={`${containerClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} ${darkMode ? 'bg-black' : 'bg-white'} rounded-lg overflow-hidden`}>
        <SpiralAnimation />
      </div>
      {text && (
        <p className={`text-sm ${darkMode ? 'text-white/70' : 'text-black/70'} text-center`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Specialized loading components for common use cases
export function FullScreenLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black z-50">
      <LoadingSpinner size="fullscreen" text={text} darkMode={true} />
    </div>
  )
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <LoadingSpinner size="small" text={text} darkMode={false} className="py-4" />
  )
}

export function PanelLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="center">
      <div className="panel">
        <LoadingSpinner size="medium" text={text} darkMode={false} />
      </div>
    </div>
  )
}
