"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/core/auth/AuthService";
import { getLicenseStatus } from "@/lib/licensing";
import ClientOnlySpiral from "@/components/ClientOnlySpiral";
import MorphingGlassButton from "@/components/MorphingGlassButton";

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
        const session = Auth.currentSession();
        const isAuthenticated = !!session;

        // Check for existing account
        let hasAccount = false;

        // Check if we're in test environment first
        const isTestEnvironment = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          !window.SharedArrayBuffer;

        if (isTestEnvironment) {
          // In test environment, check localStorage
          const testAccount = localStorage.getItem('sizewise-test-account');
          hasAccount = !!testAccount;
          console.log('Test environment - hasAccount from localStorage:', hasAccount);
        } else {
          // Normal production flow - check database
          const { openDb } = await import('@/db/openDb');
          const db = await openDb() as any;
          const rows: any[] = [];
          db.exec({
            sql: `SELECT 1 FROM accounts LIMIT 1`,
            rowMode: 'array',
            callback: (r: any) => rows.push(r)
          });
          hasAccount = rows.length > 0;
        }

        // Get license status
        const licenseStatus = await getLicenseStatus();

        // Auto-redirect based on authentication state (unless testing)
        const isTestingMorphButton = typeof window !== 'undefined' &&
          window.location.search.includes('test-morph-button');

        console.log('Auth state:', { hasAccount, isAuthenticated, isTestingMorphButton });

        if (!isTestingMorphButton) {
          if (isAuthenticated) {
            // Already authenticated - go to dashboard
            console.log('Already authenticated, redirecting to dashboard...');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else if (!hasAccount) {
            // No account exists - stay on auth page for onboarding via morphing button
            console.log('No account found, staying on auth page for onboarding...');
          } else {
            // Has account but not authenticated - stay on auth page for sign-in via morphing button
            console.log('Account exists but not authenticated, staying on auth page for sign-in...');
          }
        }

        setAuthState({
          hasAccount,
          isAuthenticated,
          licenseStatus,
          loading: false
        });
      } catch (error) {
        console.error('Auth state check failed:', error);

        const isTestingMorphButton = typeof window !== 'undefined' &&
          window.location.search.includes('test-morph-button');

        if (!isTestingMorphButton) {
          // If database check fails, assume no account exists - stay on auth page with morphing button
          console.log('Database check failed, staying on auth page for onboarding...');
        }

        setAuthState({
          hasAccount: false,
          isAuthenticated: false,
          licenseStatus: null,
          loading: false
        });
      }
    };

    checkAuthState();
  }, [router]);




  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* Animated Spiral Background */}
      <ClientOnlySpiral />

      {/* Morphing Glass Button */}
      <MorphingGlassButton
        initialView={authState.hasAccount ? 'signin' : 'onboarding'}
        autoExpand={!authState.loading}
      />
    </main>
  );
}

