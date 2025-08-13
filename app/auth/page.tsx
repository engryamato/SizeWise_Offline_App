"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { CanvasRevealEffect } from "@/components/CanvasRevealEffect";
// import { Auth } from "@/core/auth/AuthService";
import { getLicenseStatus } from "@/lib/licensing";

export default function AuthPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    hasAccount: boolean;
    isAuthenticated: boolean;
    licenseStatus: any;
    loading: boolean;
  }>({
    hasAccount: false,
    isAuthenticated: false,
    licenseStatus: null,
    loading: true
  });

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if user has an account and is authenticated
        // const session = Auth.currentSession();
        // const isAuthenticated = !!session;
        const isAuthenticated = false; // Simplified for now

        // Check for existing account
        const { openDb } = await import('@/db/openDb');
        const db = await openDb() as any;
        const rows: any[] = [];
        db.exec({
          sql: `SELECT 1 FROM accounts LIMIT 1`,
          rowMode: 'array',
          callback: (r: any) => rows.push(r)
        });
        const hasAccount = rows.length > 0;

        // Get license status
        const licenseStatus = await getLicenseStatus();

        setAuthState({
          hasAccount,
          isAuthenticated,
          licenseStatus,
          loading: false
        });

        // Auto-redirect based on state
        if (!hasAccount) {
          // No account exists - go to onboarding
          setTimeout(() => router.push('/auth/onboarding'), 1500);
        } else if (!isAuthenticated) {
          // Account exists but not authenticated - go to lock screen
          setTimeout(() => router.push('/lock'), 1500);
        } else {
          // Authenticated - go to dashboard
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } catch (error) {
        console.error('Auth state check failed:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    checkAuthState();
  }, [router]);

  const getStatusMessage = () => {
    if (authState.loading) {
      return {
        title: "SizeWise",
        subtitle: "Initializing secure authentication..."
      };
    }

    if (!authState.hasAccount) {
      return {
        title: "Welcome to SizeWise",
        subtitle: "Setting up your secure offline workspace..."
      };
    }

    if (!authState.isAuthenticated) {
      return {
        title: "SizeWise",
        subtitle: "Redirecting to secure login..."
      };
    }

    return {
      title: `Welcome Back`,
      subtitle: `${authState.licenseStatus?.edition === 'licensed' ? 'Licensed' :
                 authState.licenseStatus?.edition === 'trial' ?
                 `Trial: ${authState.licenseStatus.daysLeft} days left` :
                 'Free Tier'} • Redirecting to dashboard...`
    };
  };

  const status = getStatusMessage();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* Animated WebGL Background - Temporarily disabled for build */}
      {/* <CanvasRevealEffect
        animationSpeed={3}
        containerClassName="bg-black"
        colors={[[255, 255, 255], [0, 200, 255]]}
        dotSize={6}
        reverse={false}
        showGradient={true}
      /> */}

      {/* Content Overlay */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="text-center opacity-90 max-w-md mx-auto px-6">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            {status.title}
          </h1>
          <p className="text-lg opacity-80 mb-8">
            {status.subtitle}
          </p>

          {/* Loading indicator */}
          {authState.loading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}

          {/* License status badge */}
          {!authState.loading && authState.licenseStatus && (
            <div className="mt-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                authState.licenseStatus.edition === 'licensed' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                authState.licenseStatus.edition === 'trial' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {authState.licenseStatus.edition === 'licensed' ? '✨ Licensed' :
                 authState.licenseStatus.edition === 'trial' ? `🚀 Trial (${authState.licenseStatus.daysLeft} days)` :
                 '🆓 Free Tier'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle branding */}
      <div className="absolute bottom-6 left-6 opacity-50">
        <p className="text-xs text-gray-400">Offline-First HVAC Design Suite</p>
      </div>
    </main>
  );
}

