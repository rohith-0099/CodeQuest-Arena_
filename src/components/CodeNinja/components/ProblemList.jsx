import React from 'react';

const ProblemList = ({ problems, selectedProblem, onProblemSelect }) => {
  return (
    <div className="problem-list">
      {problems.map((problem) => (
        <div
          key={problem.id}
          className={`problem-item ${selectedProblem?.id === problem.id ? 'selected' : ''}`}
          onClick={() => onProblemSelect(problem)}
        >
          <div className="problem-title">{problem.title}</div>
          <div className="problem-meta">
            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            <span className="points">+{problem.points}pts</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProblemList;
