import React from 'react';

const CodeEditor = ({ code, language, onChange }) => {
  return (
    <div className="code-editor">
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="code-textarea"
        placeholder={`Write your ${language} code here...`}
        spellCheck={false}
      />
    </div>
  );
};

export default CodeEditor;
