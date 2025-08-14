'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  { href: '/tools/air-duct-sizer', label: 'Air Duct Sizer' },
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
        <div className={styles.navSkeleton}>
          <span className={styles.navDot}></span>
          <span className={`${styles.navPill} ${styles.fadeOnCollapse}`}></span>
        </div>
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
            </div>
          )}
        </div>
        <div className={`${styles.navSkeleton} ${styles.fadeOnCollapse}`}>
          <span className={styles.navPill} style={{ width: '80px' }}></span>
          <span className={styles.navDot}></span>
        </div>
      </div>
    </nav>
  );
}
