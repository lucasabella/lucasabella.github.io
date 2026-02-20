import './ProgressBar.css';

export default function ProgressBar({ visited = 0, total = 0, variant = 'default' }) {
  const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
  const isComplete = visited === total && total > 0;

  if (variant === 'compact') {
    return (
      <div className="progress-bar progress-bar--compact">
        <div className="progress-bar__track">
          <div
            className={`progress-bar__fill ${isComplete ? 'progress-bar__fill--complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__percentage">
          {percentage}%
        </span>
        <span className="progress-bar__fraction">
          {visited} of {total} locations
        </span>
      </div>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${isComplete ? 'progress-bar__fill--complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isComplete && (
        <div className="progress-bar__complete-text">
          All locations visited!
        </div>
      )}
    </div>
  );
}
