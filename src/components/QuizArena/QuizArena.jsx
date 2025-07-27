import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../service/firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import './QuizArena.css';

const QuizArena = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedStack, setSelectedStack] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);

  const techStacks = [
    {
      id: 'frontend',
      name: 'Frontend Development',
      icon: '🎨',
      description: 'HTML, CSS, JavaScript, React, Vue',
      difficulty: 'Easy',
      pointsPerQuestion: 10,
      color: '#3b82f6',
      totalQuestions: 5
    },
    {
      id: 'backend',
      name: 'Backend Development',
      icon: '⚙️',
      description: 'Node.js, Python, Java, APIs, Databases',
      difficulty: 'Medium',
      pointsPerQuestion: 15,
      color: '#10b981',
      totalQuestions: 5
    },
    {
      id: 'ai-ml',
      name: 'AI & Machine Learning',
      icon: '🤖',
      description: 'Python, TensorFlow, PyTorch, Algorithms',
      difficulty: 'Hard',
      pointsPerQuestion: 25,
      color: '#8b5cf6',
      totalQuestions: 5
    },
    {
      id: 'devops',
      name: 'DevOps & Cloud',
      icon: '☁️',
      description: 'Docker, Kubernetes, AWS, CI/CD',
      difficulty: 'Medium',
      pointsPerQuestion: 20,
      color: '#f59e0b',
      totalQuestions: 5
    },
    {
      id: 'mobile',
      name: 'Mobile Development',
      icon: '📱',
      description: 'React Native, Flutter, iOS, Android',
      difficulty: 'Medium',
      pointsPerQuestion: 18,
      color: '#ef4444',
      totalQuestions: 5
    },
    {
      id: 'blockchain',
      name: 'Blockchain & Web3',
      icon: '⛓️',
      description: 'Solidity, Ethereum, Smart Contracts',
      difficulty: 'Hard',
      pointsPerQuestion: 30,
      color: '#06b6d4',
      totalQuestions: 5
    }
  ];

  const quizQuestions = {
    frontend: [
      {
        id: 1,
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlink and Text Markup Language"
        ],
        correctAnswer: 0,
        explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
      },
      {
        id: 2,
        question: "Which CSS property is used to change the background color?",
        options: ["color", "bgcolor", "background-color", "bg-color"],
        correctAnswer: 2,
        explanation: "The 'background-color' property is used to set the background color of an element in CSS."
      },
      {
        id: 3,
        question: "What is the correct way to declare a JavaScript variable?",
        options: ["variable x = 5;", "var x = 5;", "v x = 5;", "declare x = 5;"],
        correctAnswer: 1,
        explanation: "In JavaScript, 'var x = 5;' is the traditional way to declare a variable. Modern alternatives include 'let' and 'const'."
      },
      {
        id: 4,
        question: "Which React hook is used for state management?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: 1,
        explanation: "useState is the primary React hook used for managing component state in functional components."
      },
      {
        id: 5,
        question: "What does CSS stand for?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Sheets",
          "Creative Style Sheets",
          "Colorful Style Sheets"
        ],
        correctAnswer: 0,
        explanation: "CSS stands for Cascading Style Sheets, used to describe the presentation of HTML documents."
      }
    ],
    backend: [
      {
        id: 1,
        question: "What is Node.js?",
        options: [
          "A JavaScript framework",
          "A JavaScript runtime environment",
          "A database management system",
          "A web browser"
        ],
        correctAnswer: 1,
        explanation: "Node.js is a JavaScript runtime environment that allows you to run JavaScript on the server side."
      },
      {
        id: 2,
        question: "Which HTTP method is used to retrieve data?",
        options: ["POST", "PUT", "GET", "DELETE"],
        correctAnswer: 2,
        explanation: "GET is the HTTP method used to retrieve data from a server."
      },
      {
        id: 3,
        question: "What does SQL stand for?",
        options: [
          "Structured Query Language",
          "Simple Query Language",
          "Standard Query Language",
          "Sequential Query Language"
        ],
        correctAnswer: 0,
        explanation: "SQL stands for Structured Query Language, used for managing and querying relational databases."
      },
      {
        id: 4,
        question: "Which is NOT a NoSQL database?",
        options: ["MongoDB", "Redis", "MySQL", "Cassandra"],
        correctAnswer: 2,
        explanation: "MySQL is a relational database (SQL), while MongoDB, Redis, and Cassandra are NoSQL databases."
      },
      {
        id: 5,
        question: "What is an API?",
        options: [
          "Application Programming Interface",
          "Advanced Programming Interface",
          "Automated Programming Interface",
          "Application Processing Interface"
        ],
        correctAnswer: 0,
        explanation: "API stands for Application Programming Interface, which allows different software applications to communicate."
      }
    ],
    'ai-ml': [
      {
        id: 1,
        question: "What is supervised learning?",
        options: [
          "Learning without labeled data",
          "Learning with labeled training data",
          "Learning through trial and error",
          "Learning through clustering"
        ],
        correctAnswer: 1,
        explanation: "Supervised learning is a machine learning approach where models learn from labeled training data."
      },
      {
        id: 2,
        question: "Which algorithm is commonly used for classification?",
        options: ["K-means", "Random Forest", "PCA", "DBSCAN"],
        correctAnswer: 1,
        explanation: "Random Forest is a popular ensemble algorithm commonly used for classification tasks."
      },
      {
        id: 3,
        question: "What does CNN stand for in deep learning?",
        options: [
          "Computer Neural Network",
          "Convolutional Neural Network",
          "Complex Neural Network",
          "Connected Neural Network"
        ],
        correctAnswer: 1,
        explanation: "CNN stands for Convolutional Neural Network, commonly used for image processing tasks."
      },
      {
        id: 4,
        question: "Which library is most popular for deep learning in Python?",
        options: ["NumPy", "Pandas", "TensorFlow", "Matplotlib"],
        correctAnswer: 2,
        explanation: "TensorFlow is one of the most popular deep learning libraries for Python, along with PyTorch."
      },
      {
        id: 5,
        question: "What is overfitting in machine learning?",
        options: [
          "Model performs well on training and test data",
          "Model performs poorly on both training and test data",
          "Model performs well on training but poorly on test data",
          "Model cannot learn from training data"
        ],
        correctAnswer: 2,
        explanation: "Overfitting occurs when a model learns the training data too well but fails to generalize to new, unseen data."
      }
    ],
    devops: [
      {
        id: 1,
        question: "What is Docker?",
        options: [
          "A programming language",
          "A containerization platform",
          "A database system",
          "A web framework"
        ],
        correctAnswer: 1,
        explanation: "Docker is a containerization platform that allows you to package applications and their dependencies into containers."
      },
      {
        id: 2,
        question: "What does CI/CD stand for?",
        options: [
          "Continuous Integration/Continuous Deployment",
          "Computer Integration/Computer Deployment",
          "Code Integration/Code Deployment",
          "Continuous Installation/Continuous Development"
        ],
        correctAnswer: 0,
        explanation: "CI/CD stands for Continuous Integration/Continuous Deployment, a DevOps practice for automated software delivery."
      },
      {
        id: 3,
        question: "Which is a popular container orchestration tool?",
        options: ["Docker", "Git", "Kubernetes", "Jenkins"],
        correctAnswer: 2,
        explanation: "Kubernetes is a popular container orchestration platform for automating deployment, scaling, and management of containerized applications."
      },
      {
        id: 4,
        question: "What is Infrastructure as Code (IaC)?",
        options: [
          "Writing code for applications",
          "Managing infrastructure through code",
          "Coding infrastructure manually",
          "Installing infrastructure software"
        ],
        correctAnswer: 1,
        explanation: "Infrastructure as Code (IaC) is the practice of managing and provisioning infrastructure through machine-readable code."
      },
      {
        id: 5,
        question: "Which AWS service is used for serverless computing?",
        options: ["EC2", "S3", "Lambda", "RDS"],
        correctAnswer: 2,
        explanation: "AWS Lambda is a serverless computing service that runs code without provisioning or managing servers."
      }
    ],
    mobile: [
      {
        id: 1,
        question: "What is React Native?",
        options: [
          "A web framework",
          "A mobile app development framework",
          "A database system",
          "A testing framework"
        ],
        correctAnswer: 1,
        explanation: "React Native is a framework for building mobile applications using React and JavaScript."
      },
      {
        id: 2,
        question: "Which programming language is used for iOS development?",
        options: ["Java", "Kotlin", "Swift", "C#"],
        correctAnswer: 2,
        explanation: "Swift is the primary programming language used for iOS app development, alongside Objective-C."
      },
      {
        id: 3,
        question: "What is Flutter developed by?",
        options: ["Facebook", "Google", "Microsoft", "Apple"],
        correctAnswer: 1,
        explanation: "Flutter is an open-source mobile app development framework created by Google."
      },
      {
        id: 4,
        question: "Which language is primarily used for Android development?",
        options: ["Swift", "Objective-C", "Java/Kotlin", "C#"],
        correctAnswer: 2,
        explanation: "Java and Kotlin are the primary programming languages used for native Android app development."
      },
      {
        id: 5,
        question: "What is the main advantage of cross-platform development?",
        options: [
          "Better performance",
          "Code reusability across platforms",
          "Native look and feel",
          "Better security"
        ],
        correctAnswer: 1,
        explanation: "The main advantage of cross-platform development is code reusability, allowing developers to write once and deploy on multiple platforms."
      }
    ],
    blockchain: [
      {
        id: 1,
        question: "What is a blockchain?",
        options: [
          "A type of database",
          "A distributed ledger technology",
          "A programming language",
          "A web framework"
        ],
        correctAnswer: 1,
        explanation: "Blockchain is a distributed ledger technology that maintains a continuously growing list of records, linked and secured using cryptography."
      },
      {
        id: 2,
        question: "What is Ethereum?",
        options: [
          "A cryptocurrency only",
          "A blockchain platform for smart contracts",
          "A mining hardware",
          "A wallet application"
        ],
        correctAnswer: 1,
        explanation: "Ethereum is a blockchain platform that enables smart contracts and decentralized applications (DApps)."
      },
      {
        id: 3,
        question: "What language is commonly used for Ethereum smart contracts?",
        options: ["JavaScript", "Python", "Solidity", "Java"],
        correctAnswer: 2,
        explanation: "Solidity is the primary programming language used for writing smart contracts on the Ethereum blockchain."
      },
      {
        id: 4,
        question: "What does DeFi stand for?",
        options: [
          "Digital Finance",
          "Decentralized Finance",
          "Distributed Finance",
          "Dynamic Finance"
        ],
        correctAnswer: 1,
        explanation: "DeFi stands for Decentralized Finance, referring to financial services built on blockchain technology."
      },
      {
        id: 5,
        question: "What is a smart contract?",
        options: [
          "A legal document",
          "A self-executing contract with terms directly written into code",
          "A contract management software",
          "A blockchain mining process"
        ],
        correctAnswer: 1,
        explanation: "A smart contract is a self-executing contract with the terms of the agreement directly written into code on the blockchain."
      }
    ]
  };

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

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !showAnswer && !quizCompleted) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !showAnswer) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, showAnswer, quizCompleted]);

  const handleStackSelect = (stack) => {
    setSelectedStack(stack);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setShowAnswer(false);
    setQuizCompleted(false);
    setScore(0);
    setTimeLeft(30);
    setQuizStarted(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeLeft(30);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showAnswer) return;

    const question = quizQuestions[selectedStack.id][currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;
    
    setUserAnswers([...userAnswers, answerIndex]);
    setShowAnswer(true);
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleTimeUp = () => {
    if (!showAnswer) {
      setUserAnswers([...userAnswers, -1]); // -1 indicates no answer
      setShowAnswer(true);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedStack.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowAnswer(false);
      setTimeLeft(30);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);
    const pointsEarned = score * selectedStack.pointsPerQuestion;
    
    try {
      if (auth.currentUser && userProfile) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          points: increment(pointsEarned),
          [`quizResults.${selectedStack.id}`]: {
            score: score,
            totalQuestions: selectedStack.totalQuestions,
            pointsEarned: pointsEarned,
            difficulty: selectedStack.difficulty,
            completedAt: new Date()
          }
        });

        setUserPoints(prev => prev + pointsEarned);
      }
    } catch (error) {
      console.error('Error updating quiz results:', error);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedStack) {
    return (
      <div className="quiz-arena">
        {/* Header */}
        <header className="quiz-header">
          <div className="header-content">
            <div className="header-left">
              <button onClick={() => navigate('/dashboard')} className="back-btn">
                ← Back to Arena
              </button>
              <div className="title-section">
                <h1>🧠 Quiz Arena</h1>
                <p>Test your knowledge across different tech stacks</p>
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
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}&background=8b5cf6&color=fff`}
                    alt="User" 
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stack Selection */}
        <main className="quiz-main">
          <div className="stack-selection">
            <div className="selection-header">
              <h2>Choose Your Tech Stack</h2>
              <p>Select a technology stack to test your knowledge. Points are awarded based on difficulty!</p>
            </div>

            <div className="stacks-grid">
              {techStacks.map((stack) => (
                <div
                  key={stack.id}
                  className="stack-card"
                  onClick={() => handleStackSelect(stack)}
                  style={{ borderColor: stack.color }}
                >
                  <div className="stack-header">
                    <div className="stack-icon" style={{ color: stack.color }}>
                      {stack.icon}
                    </div>
                    <div 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(stack.difficulty) }}
                    >
                      {stack.difficulty}
                    </div>
                  </div>
                  
                  <h3 style={{ color: stack.color }}>{stack.name}</h3>
                  <p>{stack.description}</p>
                  
                  <div className="stack-meta">
                    <div className="questions-count">
                      📝 {stack.totalQuestions} Questions
                    </div>
                    <div className="points-info">
                      🏆 {stack.pointsPerQuestion} pts/question
                    </div>
                  </div>
                  
                  <div className="max-points">
                    Max Points: {stack.totalQuestions * stack.pointsPerQuestion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quizCompleted) {
    const pointsEarned = score * selectedStack.pointsPerQuestion;
    const percentage = (score / selectedStack.totalQuestions) * 100;
    
    return (
      <div className="quiz-arena">
        <div className="quiz-completed">
          <div className="results-card">
            <div className="results-header">
              <h2>🎉 Quiz Completed!</h2>
              <div className="stack-info">
                <span className="stack-icon">{selectedStack.icon}</span>
                <span className="stack-name">{selectedStack.name}</span>
              </div>
            </div>
            
            <div className="score-display">
              <div className="score-circle">
                <div className="score-number">{score}</div>
                <div className="score-total">/ {selectedStack.totalQuestions}</div>
              </div>
              <div className="percentage">{percentage.toFixed(0)}%</div>
            </div>
            
            <div className="results-stats">
              <div className="stat-item">
                <span className="stat-label">Points Earned</span>
                <span className="stat-value">{pointsEarned}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Difficulty</span>
                <span className="stat-value">{selectedStack.difficulty}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{percentage.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="results-actions">
              <button 
                onClick={() => setSelectedStack(null)}
                className="try-another-btn"
              >
                Try Another Stack
              </button>
              <button 
                onClick={() => handleStackSelect(selectedStack)}
                className="retake-btn"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = quizQuestions[selectedStack.id][currentQuestion];

  return (
    <div className="quiz-arena">
      {/* Quiz Header */}
      <header className="quiz-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => setSelectedStack(null)} className="back-btn">
              ← Back to Stacks
            </button>
            <div className="quiz-info">
              <h1>{selectedStack.icon} {selectedStack.name}</h1>
              <div className="progress-info">
                Question {currentQuestion + 1} of {selectedStack.totalQuestions}
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="timer" style={{ color: timeLeft <= 10 ? '#ef4444' : '#10b981' }}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            <div className="quiz-score">
              🏆 {score * selectedStack.pointsPerQuestion} pts
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="quiz-content">
        {!quizStarted ? (
          <div className="quiz-start">
            <div className="start-card">
              <h2>Ready to start the quiz?</h2>
              <div className="quiz-details">
                <p><strong>Stack:</strong> {selectedStack.name}</p>
                <p><strong>Questions:</strong> {selectedStack.totalQuestions}</p>
                <p><strong>Points per question:</strong> {selectedStack.pointsPerQuestion}</p>
                <p><strong>Time per question:</strong> 30 seconds</p>
                <p><strong>Total possible points:</strong> {selectedStack.totalQuestions * selectedStack.pointsPerQuestion}</p>
              </div>
              <button onClick={startQuiz} className="start-quiz-btn">
                Start Quiz 🚀
              </button>
            </div>
          </div>
        ) : (
          <div className="question-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / selectedStack.totalQuestions) * 100}%` }}
              ></div>
            </div>

            <div className="question-card">
              <div className="question-header">
                <div className="question-number">
                  Question {currentQuestion + 1}
                </div>
                <div 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(selectedStack.difficulty) }}
                >
                  {selectedStack.difficulty}
                </div>
              </div>

              <h2 className="question-text">{question.question}</h2>

              <div className="options-container">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${
                      showAnswer && index === question.correctAnswer ? 'correct' : 
                      showAnswer && userAnswers[currentQuestion] === index && index !== question.correctAnswer ? 'incorrect' : 
                      userAnswers[currentQuestion] === index ? 'selected' : ''
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showAnswer}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                    {showAnswer && index === question.correctAnswer && (
                      <span className="check-icon">✓</span>
                    )}
                    {showAnswer && userAnswers[currentQuestion] === index && index !== question.correctAnswer && (
                      <span className="cross-icon">✗</span>
                    )}
                  </button>
                ))}
              </div>

              {showAnswer && (
                <div className="answer-explanation">
                  <div className="explanation-header">
                    <span className="explanation-icon">💡</span>
                    <strong>Explanation:</strong>
                  </div>
                  <p>{question.explanation}</p>
                  
                  <button onClick={nextQuestion} className="next-btn">
                    {currentQuestion < selectedStack.totalQuestions - 1 ? 'Next Question' : 'Complete Quiz'} →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizArena;
