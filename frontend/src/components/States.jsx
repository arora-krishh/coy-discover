// Small presentational pieces for loading / empty / error so every screen handles them the same way.
export function CardSkeleton() {
  return <div className="deck"><div className="card skeleton" role="status" aria-label="Loading profiles" /></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state" role="alert">
      <h2>Couldn't load this</h2>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
