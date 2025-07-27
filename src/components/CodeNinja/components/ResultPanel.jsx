// src/components/CodeNinja/components/ResultPanel.jsx
import React from 'react';
// import './ResultPanel.css'; // Uncomment when you create the CSS file

function ResultPanel({ output, error }) {
  return (
    <div className="result-panel-container">
      <h3>Execution Result:</h3>
      {output && (
        <pre className="output-success">
          <code>{output}</code>
        </pre>
      )}
      {error && (
        <pre className="output-error">
          <code>{error}</code>
        </pre>
      )}
      {!output && !error && (
        <p className="no-output-message">Run your code to see the output here.</p>
      )}
    </div>
  );
}

export default ResultPanel;
