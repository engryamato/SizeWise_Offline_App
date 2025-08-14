'use client';
import PillNavigation from '../../components/PillNavigation';
import styles from '../../components/PillNavigation.module.css';

export default function TestPill() {
  return (
    <>
      <PillNavigation />
      <div className={`container ${styles.contentOffset}`}>
        <div className="hero">
          <div>
            <h1>Test Pill Navigation</h1>
            <div className="muted">Testing the pill navigation component.</div>
          </div>
        </div>
        <div className="grid">
          <div className="card">
            <h3>Test Card 1</h3>
            <div className="muted">This is a test card</div>
          </div>
          <div className="card">
            <h3>Test Card 2</h3>
            <div className="muted">This is another test card</div>
          </div>
        </div>
      </div>
    </>
  );
}
