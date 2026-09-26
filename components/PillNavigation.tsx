'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './PillNavigation.module.css';

export interface NavigationItem {
  href: string;
  label: string;
  icon?: string;
}

export interface PillNavigationProps {
  items?: NavigationItem[];
  className?: string;
  'data-testid'?: string;
}

const defaultItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tools/duct-sizer', label: 'Tools' },
  { href: '/settings', label: 'Settings' },
  { href: '/license', label: 'License' },
];

export default function PillNavigation({
  items = defaultItems,
  className = '',
  'data-testid': testId = 'pill-navigation'
}: PillNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedWidth, setExpandedWidth] = useState('auto');
  const [isRetracting, setIsRetracting] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Logout handler
  const handleLogout = async () => {
    try {
      // Check if we're in test environment
      const isTestEnvironment = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        !window.SharedArrayBuffer;

      if (isTestEnvironment) {
        // Test environment logout - clear localStorage
        localStorage.removeItem('sizewise-test-account');
        console.log('Test environment logout: localStorage cleared');
      } else {
        // Production environment logout - clear database session
        const { Auth } = await import('@/core/auth/AuthService');
        await Auth.logout();
        console.log('Production logout: database session cleared');
      }

      // Navigate to auth page (will show appropriate modal based on account state)
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to auth page even if logout fails
      router.push('/auth');
    }
  };

  // Measure natural expanded width
  const measureExpandedWidth = () => {
    if (!navRef.current) return;

    const wasCollapsed = !isExpanded;
    if (wasCollapsed) {
      // Temporarily expand to measure
      navRef.current.style.width = 'auto';
      navRef.current.classList.remove(styles.collapsed);
    }

    // Force layout and read natural width
    const rect = navRef.current.getBoundingClientRect();
    const measuredWidth = Math.ceil(rect.width);
    setExpandedWidth(`${measuredWidth}px`);

    if (wasCollapsed) {
      // Restore collapsed state
      navRef.current.classList.add(styles.collapsed);
    }
  };

  // Initial measurement and resize handling
  useEffect(() => {
    measureExpandedWidth();

    const handleResize = () => measureExpandedWidth();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  // Handle expand/collapse toggle
  const handleToggle = () => {
    const willCollapse = isExpanded;

    if (willCollapse) {
      setIsRetracting(true);
    }

    // Toggle immediately
    setIsExpanded(!isExpanded);
  };

  // Clean up retracting state after transition
  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === 'width') {
      setIsRetracting(false);
    }
  };

  // Check if a path is active
  const isActiveItem = (href: string) => {
    if (href === '/dashboard') {
      return pathname?.startsWith('/dashboard') || pathname?.startsWith('/test-pill');
    }
    if (href.startsWith('/tools')) {
      return pathname?.startsWith('/tools');
    }
    return pathname === href;
  };

  return (
    <nav
      ref={navRef}
      className={`${styles.navbar} ${!isExpanded ? styles.collapsed : ''} ${isRetracting ? styles.retracting : ''} ${className}`}
      role="banner"
      aria-label="Top navigation"
      aria-expanded={isExpanded}
      onClick={handleToggle}
      onTransitionEnd={handleTransitionEnd}
      style={{ '--expanded-width': expandedWidth } as React.CSSProperties}
      data-testid={testId}
    >
      <div className={styles.navTrack}>
        <div className={`${styles.navWide} ${styles.fadeOnCollapse}`}>
          {isExpanded && (
            <div className={styles.navLinks}>
              {items.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActiveItem(item.href) ? styles.active : ''}`}
                  aria-current={isActiveItem(item.href) ? 'page' : undefined}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.label}
                </Link>
              ))}

              {/* Logout button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className={`${styles.navLink} ${styles.logoutButton}`}
                aria-label="Sign out"
                title="Sign out"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
