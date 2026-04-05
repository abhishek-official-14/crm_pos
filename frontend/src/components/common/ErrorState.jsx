export default function ErrorState({ message, onRetry }) {
  return (
    <div className="status error">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
