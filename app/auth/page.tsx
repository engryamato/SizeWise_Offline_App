"use client";

import { ClientOnlySpiral } from "@/components/ClientOnlySpiral";
import { useEffect } from "react";

export default function AuthPage() {
  // Prevent any redirects by stopping event propagation
  useEffect(() => {
    const preventRedirect = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Override location changes
    const originalReplace = window.location.replace;
    const originalAssign = window.location.assign;

    window.location.replace = () => {};
    window.location.assign = () => {};

    return () => {
      window.location.replace = originalReplace;
      window.location.assign = originalAssign;
    };
  }, []);

  return (
    <main className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-black text-white">
      <ClientOnlySpiral />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="text-center opacity-90">
          <h1 className="text-2xl font-semibold">SizeWise Auth</h1>
          <p className="text-sm opacity-70 mt-2">Beautiful spiral animation loading screen</p>
          <p className="text-xs opacity-50 mt-4">This demonstrates the SpiralAnimation component</p>
        </div>
      </div>
    </main>
  );
}

