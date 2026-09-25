export default function Loading() {
  return (
    <div className="container section" role="status">
      <div className="skeleton skeleton-title" />
      <div className="campaign-grid">
        {[1, 2, 3].map((i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
      <p className="muted">Đang kết nối những điều tốt đẹp…</p>
    </div>
  );
}
