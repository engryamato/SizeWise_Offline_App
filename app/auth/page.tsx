"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/core/auth/AuthService";
import { getLicenseStatus } from "@/lib/licensing";
import ClientOnlySpiral from "@/components/ClientOnlySpiral";

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

        // Auto-redirect based on authentication state
        console.log('Auth state:', { hasAccount, isAuthenticated });
        if (isAuthenticated) {
          // Already authenticated - go to dashboard
          console.log('Already authenticated, redirecting to dashboard...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else if (!hasAccount) {
          // No account exists - redirect to onboarding
          console.log('No account found, redirecting to onboarding...');
          setTimeout(() => router.push('/auth/onboarding'), 1000);
        } else {
          // Has account but not authenticated - redirect to lock page
          console.log('Account exists but not authenticated, redirecting to lock...');
          setTimeout(() => router.push('/lock'), 1000);
        }

        setAuthState({
          hasAccount,
          isAuthenticated,
          licenseStatus,
          loading: false
        });
      } catch (error) {
        console.error('Auth state check failed:', error);
        // If database check fails, assume no account exists and redirect to onboarding
        console.log('Database check failed, redirecting to onboarding...');
        setTimeout(() => router.push('/auth/onboarding'), 1000);
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
    </main>
  );
}

