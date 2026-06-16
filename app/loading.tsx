export default function Loading() {
  return (
    <main className="container page-loading-shell">
      <div className="page-loading-header">
        <div className="skeleton page-loading-title" />
        <div className="skeleton page-loading-subtitle" />
      </div>
      <div className="page-loading-grid">
        <div className="skeleton page-loading-card" />
        <div className="skeleton page-loading-card" />
        <div className="skeleton page-loading-card" />
      </div>
      <div className="skeleton page-loading-panel" />
    </main>
  )
}
