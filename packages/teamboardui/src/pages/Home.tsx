export function Home() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Welcome to my web app</h1>
          <p>Built with Vybrr</p>
          <p>Your app is ready to build on.</p>
        </div>
      </header>
      <section className="card">
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>Pages you add will appear in the sidebar.</p>
        </div>
      </section>
    </div>
  );
}
