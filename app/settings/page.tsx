import NavBar from '../../components/NavBar';
export default function Settings(){
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>Settings</h1>
        <div className="panel">
          <div className="muted">Units, theme, and performance toggles will go here.</div>
        </div>
      </div>
    </>
  );
}

