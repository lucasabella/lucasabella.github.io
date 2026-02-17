import './ProgressBar.css';

export default function ProgressBar({ visited = 0, total = 0 }) {
  const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
  const isComplete = visited === total && total > 0;

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
        {percentage > 0 && percentage < 100 && (
          <div
            className="progress-bar__glow"
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
      {isComplete && (
        <div className="progress-bar__complete-text">
          All locations visited!
        </div>
      )}
    </div>
  );
}
