"use client";

import ClientOnlySpiral from "@/components/ClientOnlySpiral";

export default function DemoPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <ClientOnlySpiral />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="text-center opacity-90">
          <h1 className="text-2xl font-semibold">SizeWise Spiral Animation Demo</h1>
          <p className="text-sm opacity-70 mt-2">Beautiful spiral animation loading screen</p>
          <p className="text-xs opacity-50 mt-4">This demonstrates the SpiralAnimation component in action</p>
          <div className="mt-8 space-y-2">
            <p className="text-xs opacity-60">✨ GSAP-powered animation</p>
            <p className="text-xs opacity-60">🌀 Spiral particle system</p>
            <p className="text-xs opacity-60">⚡ Client-side only rendering</p>
            <p className="text-xs opacity-60">🎨 Smooth elastic easing</p>
          </div>
        </div>
      </div>
    </main>
  );
}
