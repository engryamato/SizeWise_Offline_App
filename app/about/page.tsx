import NavBar from '../../components/NavBar';
export default function About(){
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>About</h1>
        <div className="panel">
          <div>SizeWise Suite — Offline Edition</div>
          <div className="muted">Ruleset: SMACNA 4e v1.0.0</div>
        </div>
      </div>
    </>
  );
}

