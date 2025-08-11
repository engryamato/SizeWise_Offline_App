"use client";

import { CanvasRevealEffect } from "@/components/CanvasRevealEffect";

export default function AuthPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <CanvasRevealEffect
        animationSpeed={3}
        containerClassName="bg-black"
        colors={[[255, 255, 255], [0, 200, 255]]}
        dotSize={6}
        reverse={false}
      />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="text-center opacity-90">
          <h1 className="text-2xl font-semibold">Auth</h1>
          <p className="text-sm opacity-70 mt-2">This is a placeholder authentication page.</p>
        </div>
      </div>
    </main>
  );
}

