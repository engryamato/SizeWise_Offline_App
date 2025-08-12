'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the SpiralAnimation component with no SSR
const SpiralAnimation = dynamic(() => import('./SpiralAnimation').then(mod => ({ default: mod.SpiralAnimation })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

export function ClientOnlySpiral() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="w-full h-full bg-black" />
  }

  return <SpiralAnimation />
}
