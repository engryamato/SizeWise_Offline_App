import PillNavigation from '../../components/PillNavigation';
import styles from '../../components/PillNavigation.module.css';
export default function About(){
  return (
    <>
      <PillNavigation />
      <div className={`container ${styles.contentOffset}`}>
        <h1>About</h1>
        <div className="panel">
          <div>SizeWise Suite — Offline Edition</div>
          <div className="muted">Ruleset: SMACNA 4e v1.0.0</div>
        </div>
      </div>
    </>
  );
}

