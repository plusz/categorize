import React from 'react';

interface ResultDisplayProps {
  result: Record<string, any> | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) {
    return <div className="box" id="result"></div>;
  }

  return (
    <div className="box" id="result">
      {Object.entries(result).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
        </div>
      ))}
    </div>
  );
};

export default ResultDisplay;
