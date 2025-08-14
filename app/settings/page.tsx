import PillNavigation from '../../components/PillNavigation';
import styles from '../../components/PillNavigation.module.css';
export default function Settings(){
  return (
    <>
      <PillNavigation />
      <div className={`container ${styles.contentOffset}`}>
        <h1>Settings</h1>
        <div className="panel">
          <div className="muted">Units, theme, and performance toggles will go here.</div>
        </div>
      </div>
    </>
  );
}

