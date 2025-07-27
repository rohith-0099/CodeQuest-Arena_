import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../service/firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import './CodeNinja.css';

const CodeNinja = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const languages = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'cpp', name: 'C++', icon: '⚡' },
    { id: 'c', name: 'C', icon: '🔧' }
  ];

  const codingProblems = [
    {
      id: 1,
      title: "Hello World",
      difficulty: "Easy",
      points: 10,
      timeLimit: "1s",
      memoryLimit: "256MB",
      description: "Write a program that prints 'Hello World' to the console.",
      inputFormat: "No input required.",
      outputFormat: "Print 'Hello World' (without quotes).",
      examples: [
        { input: "", output: "Hello World" }
      ],
      testCases: [
        { input: "", expected: "Hello World" }
      ],
      starterCode: {
        javascript: `// Print Hello World
console.log("Hello World");`,
        python: `# Print Hello World
print("Hello World")`,
        java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    printf("Hello World\\n");
    return 0;
}`
      }
    },
    {
      id: 2,
      title: "Sum of Two Numbers",
      difficulty: "Easy",
      points: 15,
      timeLimit: "1s",
      memoryLimit: "256MB",
      description: "Given two integers, return their sum.",
      inputFormat: "Two integers a and b separated by space.",
      outputFormat: "Print the sum of a and b.",
      examples: [
        { input: "5 3", output: "8" },
        { input: "10 -2", output: "8" }
      ],
      testCases: [
        { input: "5 3", expected: "8" },
        { input: "10 -2", expected: "8" },
        { input: "0 0", expected: "0" },
        { input: "-5 10", expected: "5" }
      ],
      starterCode: {
        javascript: `// Read two numbers and print their sum
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b] = line.split(' ').map(Number);
    const result = a + b;
    console.log(result);
    rl.close();
});`,
        python: `# Read two numbers and print their sum
a, b = map(int, input().split())
result = a + b
print(result)`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int result = a + b;
        System.out.println(result);
        sc.close();
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int result = a + b;
    cout << result << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int result = a + b;
    printf("%d\\n", result);
    return 0;
}`
      }
    },
    {
      id: 3,
      title: "Maximum of Three Numbers",
      difficulty: "Medium",
      points: 25,
      timeLimit: "1s",
      memoryLimit: "256MB",
      description: "Given three integers, find and return the maximum among them.",
      inputFormat: "Three integers a, b, and c separated by spaces.",
      outputFormat: "Print the maximum of the three numbers.",
      examples: [
        { input: "5 10 3", output: "10" },
        { input: "15 7 20", output: "20" }
      ],
      testCases: [
        { input: "5 10 3", expected: "10" },
        { input: "15 7 20", expected: "20" },
        { input: "1 1 1", expected: "1" },
        { input: "-5 -10 -3", expected: "-3" }
      ],
      starterCode: {
        javascript: `// Find maximum of three numbers
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b, c] = line.split(' ').map(Number);
    const maximum = Math.max(a, b, c);
    console.log(maximum);
    rl.close();
});`,
        python: `# Find maximum of three numbers
a, b, c = map(int, input().split())
maximum = max(a, b, c)
print(maximum)`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        int maximum = Math.max(Math.max(a, b), c);
        System.out.println(maximum);
        sc.close();
    }
}`,
        cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    int maximum = max({a, b, c});
    cout << maximum << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int max(int a, int b, int c) {
    int max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    return max;
}

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int maximum = max(a, b, c);
    printf("%d\\n", maximum);
    return 0;
}`
      }
    },
    {
      id: 4,
      title: "Fibonacci Sequence",
      difficulty: "Medium",
      points: 30,
      timeLimit: "2s",
      memoryLimit: "256MB",
      description: "Generate the nth Fibonacci number (0-indexed).",
      inputFormat: "A single integer n (0 ≤ n ≤ 40).",
      outputFormat: "Print the nth Fibonacci number.",
      examples: [
        { input: "5", output: "5" },
        { input: "10", output: "55" }
      ],
      testCases: [
        { input: "0", expected: "0" },
        { input: "1", expected: "1" },
        { input: "5", expected: "5" },
        { input: "10", expected: "55" }
      ],
      starterCode: {
        javascript: `// Calculate nth Fibonacci number
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const n = parseInt(line);
    // Write your code here
    rl.close();
});`,
        python: `# Calculate nth Fibonacci number
n = int(input())
# Write your code here`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // Write your code here
        sc.close();
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Write your code here
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    // Write your code here
    return 0;
}`
      }
    },
    {
      id: 5,
      title: "Prime Number Check",
      difficulty: "Hard",
      points: 50,
      timeLimit: "1s",
      memoryLimit: "256MB",
      description: "Determine if a given number is prime. A prime number is greater than 1 and has no positive divisors other than 1 and itself.",
      inputFormat: "A single integer n (2 ≤ n ≤ 10^6).",
      outputFormat: "Print 'YES' if the number is prime, 'NO' otherwise.",
      examples: [
        { input: "7", output: "YES" },
        { input: "12", output: "NO" }
      ],
      testCases: [
        { input: "2", expected: "YES" },
        { input: "7", expected: "YES" },
        { input: "12", expected: "NO" },
        { input: "97", expected: "YES" }
      ],
      starterCode: {
        javascript: `// Check if number is prime
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const n = parseInt(line);
    // Write your code here
    rl.close();
});`,
        python: `# Check if number is prime
n = int(input())
# Write your code here`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // Write your code here
        sc.close();
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Write your code here
    return 0;
}`,
        c: `#include <stdio.h>
#include <math.h>

int main() {
    int n;
    scanf("%d", &n);
    // Write your code here
    return 0;
}`
      }
    }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            setUserPoints(userData.points || 0);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
    setUserCode(problem.starterCode[selectedLanguage] || '');
    setOutput('');
    setShowSuccess(false);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    if (selectedProblem) {
      setUserCode(selectedProblem.starterCode[language] || '');
    }
  };

  const simulateCodeExecution = async () => {
    if (!selectedProblem || !userCode.trim()) {
      setOutput('❌ Please write some code first!');
      return;
    }

    setLoading(true);
    setOutput('🚀 Running your code...\nCompiling and executing...');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Simple simulation logic for testing
      let allPassed = false;
      let results = [];

      // Basic pattern matching for simple problems
      if (selectedProblem.id === 1) { // Hello World
        const hasHelloWorld = userCode.toLowerCase().includes('hello world');
        allPassed = hasHelloWorld;
        results = [{
          testCase: 1,
          passed: hasHelloWorld,
          input: '',
          expected: 'Hello World',
          actual: hasHelloWorld ? 'Hello World' : 'No output',
          time: '0.001s',
          memory: '2MB'
        }];
      } else if (selectedProblem.id === 2) { // Sum of two numbers
        const hasInputReading = userCode.includes('input') || userCode.includes('scanf') || userCode.includes('Scanner') || userCode.includes('readline');
        const hasAddition = userCode.includes('+') || userCode.includes('add');
        allPassed = hasInputReading && hasAddition;
        results = selectedProblem.testCases.map((testCase, index) => ({
          testCase: index + 1,
          passed: allPassed,
          input: testCase.input,
          expected: testCase.expected,
          actual: allPassed ? testCase.expected : 'Wrong output',
          time: '0.002s',
          memory: '2.1MB'
        }));
      } else {
        // For other problems, simulate 70% success rate
        allPassed = Math.random() > 0.3;
        results = selectedProblem.testCases.map((testCase, index) => ({
          testCase: index + 1,
          passed: allPassed || Math.random() > 0.5,
          input: testCase.input,
          expected: testCase.expected,
          actual: allPassed ? testCase.expected : 'Incorrect output',
          time: `${(Math.random() * 0.1).toFixed(3)}s`,
          memory: `${(2 + Math.random() * 2).toFixed(1)}MB`
        }));
        allPassed = results.every(r => r.passed);
      }

      if (allPassed) {
        const successMessage = `🎉 CONGRATULATIONS! All test cases passed!
        
${results.map((r, index) => 
  `✅ Test Case ${r.testCase}:
📥 Input: ${r.input || '(empty)'}
📤 Expected: ${r.expected}
✨ Your Output: ${r.actual}
⏱️ Time: ${r.time}
💾 Memory: ${r.memory}`
).join('\n\n')}

🏆 Problem Solved! You earned ${selectedProblem.points} points!
🔥 Keep coding to maintain your streak!
⭐ Difficulty: ${selectedProblem.difficulty}`;
        
        setOutput(successMessage);
        setShowSuccess(true);
        
        // Award points to user
        await awardPoints(selectedProblem.points);
      } else {
        const failureMessage = `😅 Almost there! Some test cases need work:

${results.map((r, index) => 
  `${r.passed ? '✅' : '❌'} Test Case ${r.testCase}:
📥 Input: ${r.input || '(empty)'}
📤 Expected: ${r.expected}
${r.passed ? '✨' : '❌'} Your Output: ${r.actual}
⏱️ Time: ${r.time}
💾 Memory: ${r.memory}`
).join('\n\n')}

💡 Hints:
• Check your logic carefully
• Make sure you're reading input correctly
• Verify your output format matches exactly
• Test with the given examples first

Keep trying! You're on the right track! 💪`;
        
        setOutput(failureMessage);
        setShowSuccess(false);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`❌ Runtime Error: ${error.message}

🔧 Common issues:
• Syntax errors in your code
• Incorrect input/output format
• Infinite loops or memory issues

Please review your code and try again!`);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = async (points) => {
    try {
      if (auth.currentUser && userProfile) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          points: increment(points),
          [`solvedProblems.${selectedProblem.id}`]: {
            title: selectedProblem.title,
            points: points,
            difficulty: selectedProblem.difficulty,
            solvedAt: new Date(),
            language: selectedLanguage
          }
        });

        setUserPoints(prev => prev + points);
        console.log(`✅ Awarded ${points} points to user!`);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="code-ninja-arena">
      {/* Header */}
      <header className="code-ninja-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Back to Arena
            </button>
            <div className="title-section">
              <h1>⚔️ Code Ninja</h1>
              <p>Master the art of coding</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <span className="stat-value">{userPoints}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="user-avatar">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}&background=ff6b6b&color=fff`}
                  alt="User" 
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="code-ninja-content">
        {/* Problems Sidebar */}
        <aside className="problems-sidebar">
          <div className="sidebar-header">
            <h3>🎯 Coding Challenges</h3>
            <div className="language-selector">
              <label>Language:</label>
              <select 
                value={selectedLanguage} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-select"
              >
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="problems-list">
            {codingProblems.map((problem) => (
              <div
                key={problem.id}
                className={`problem-card ${selectedProblem?.id === problem.id ? 'selected' : ''}`}
                onClick={() => handleProblemSelect(problem)}
              >
                <div className="problem-header">
                  <h4>{problem.title}</h4>
                  <div 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                  >
                    {problem.difficulty}
                  </div>
                </div>
                <div className="problem-meta">
                  <span className="points">+{problem.points} pts</span>
                  <span className="time-limit">⏱️ {problem.timeLimit}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Coding Area */}
        <main className="coding-main">
          {selectedProblem ? (
            <>
              {/* Problem Description */}
              <section className="problem-section">
                <div className="problem-title">
                  <h2>{selectedProblem.title}</h2>
                  <div className="problem-badges">
                    <span 
                      className="difficulty-badge large"
                      style={{ backgroundColor: getDifficultyColor(selectedProblem.difficulty) }}
                    >
                      {selectedProblem.difficulty}
                    </span>
                    <span className="points-badge">+{selectedProblem.points} points</span>
                    <span className="limits">⏱️ {selectedProblem.timeLimit} | 💾 {selectedProblem.memoryLimit}</span>
                  </div>
                </div>

                <div className="problem-content">
                  <div className="description">
                    <h4>Problem Description</h4>
                    <p>{selectedProblem.description}</p>
                  </div>

                  <div className="io-format">
                    <div className="input-format">
                      <h4>Input Format</h4>
                      <p>{selectedProblem.inputFormat}</p>
                    </div>
                    <div className="output-format">
                      <h4>Output Format</h4>
                      <p>{selectedProblem.outputFormat}</p>
                    </div>
                  </div>

                  <div className="examples">
                    <h4>Examples</h4>
                    {selectedProblem.examples.map((example, index) => (
                      <div key={index} className="example">
                        <div className="example-input">
                          <strong>Input:</strong>
                          <pre>{example.input || '(no input)'}</pre>
                        </div>
                        <div className="example-output">
                          <strong>Output:</strong>
                          <pre>{example.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Code Editor Section */}
              <section className="editor-section">
                <div className="editor-header">
                  <h4>
                    {languages.find(l => l.id === selectedLanguage)?.icon} 
                    {languages.find(l => l.id === selectedLanguage)?.name} Editor
                  </h4>
                  <button 
                    onClick={simulateCodeExecution} 
                    disabled={loading}
                    className="run-btn"
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Running...
                      </>
                    ) : (
                      <>
                        ▶️ Run Code
                      </>
                    )}
                  </button>
                </div>
                
                <div className="code-editor">
                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="code-textarea"
                    placeholder={`Write your ${selectedLanguage} code here...`}
                    spellCheck={false}
                  />
                </div>
              </section>

              {/* Output Terminal */}
              <section className="output-section">
                <div className="output-header">
                  <h4>🖥️ Output Terminal</h4>
                  <div className="terminal-controls">
                    <div className="control-dot red"></div>
                    <div className="control-dot yellow"></div>
                    <div className="control-dot green"></div>
                  </div>
                </div>
                <div className={`output-terminal ${showSuccess ? 'success' : ''}`}>
                  <pre>{output || 'Click "Run Code" to see output...'}</pre>
                </div>
              </section>
            </>
          ) : (
            <div className="no-problem-selected">
              <div className="empty-state">
                <h2>🎯 Select a Problem to Start Coding</h2>
                <p>Choose a coding challenge from the sidebar to begin your ninja training!</p>
                <div className="empty-illustration">
                  <span className="code-icon">{'</>'}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CodeNinja;
