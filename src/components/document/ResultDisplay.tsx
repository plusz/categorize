import React from 'react';

interface ResultDisplayProps {
  result: Record<string, any> | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="box result">
      <h2 className="title is-4 mb-4">Results</h2>
      {Object.entries(result).map(([key, value]) => (
        <div key={key} className="mb-3">
          <strong className="has-text-primary">{key}:</strong>
          <div className="mt-2">
            {typeof value === 'object' 
              ? <pre className="has-background-light p-3 is-family-monospace">{JSON.stringify(value, null, 2)}</pre>
              : <span className="has-text-grey-dark">{value.toString()}</span>
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultDisplay;
