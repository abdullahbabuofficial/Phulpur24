export default function AdminLoading() {
  return (
    <div className="admin-scope min-h-screen bg-app flex items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink-muted shadow-card">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
        Loading admin…
      </div>
    </div>
  );
}
