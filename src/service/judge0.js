const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = 'dc9b6066famshcd8c317b5b3d5d9p10690cjsn22e10a59d4ee'; // Replace with your actual key

const HEADERS = {
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'Content-Type': 'application/json'
};

// Language IDs for Judge0
export const LANGUAGE_IDS = {
  javascript: 63,  // Node.js
  python: 71,      // Python 3
  java: 62,        // Java
  cpp: 54,         // C++
  c: 50            // C
};

// Submit code for execution
export const submitCode = async (sourceCode, languageId, stdin = '') => {
  try {
    const payload = {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
      expected_output: null
    };

    const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, token: result.token };
  } catch (error) {
    console.error('Error submitting code:', error);
    return { success: false, error: error.message };
  }
};

// Get execution result
export const getResult = async (token) => {
  try {
    const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
      method: 'GET',
      headers: HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting result:', error);
    return { success: false, error: error.message };
  }
};

// Poll for result until completion
export const executeCode = async (sourceCode, languageId, stdin = '', maxWaitTime = 10000) => {
  try {
    // Step 1: Submit code
    const submitResult = await submitCode(sourceCode, languageId, stdin);
    if (!submitResult.success) {
      return { success: false, error: submitResult.error };
    }

    const token = submitResult.token;
    const startTime = Date.now();

    // Step 2: Poll for result
    while (Date.now() - startTime < maxWaitTime) {
      const resultResponse = await getResult(token);
      if (!resultResponse.success) {
        return { success: false, error: resultResponse.error };
      }

      const result = resultResponse.data;
      
      // Check if execution is complete
      if (result.status.id <= 2) {
        // Still processing (In Queue = 1, Processing = 2)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        continue;
      }

      // Execution completed
      return {
        success: true,
        data: {
          status: result.status.description,
          statusId: result.status.id,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compileOutput: result.compile_output || '',
          time: result.time,
          memory: result.memory
        }
      };
    }

    return { success: false, error: 'Execution timeout' };
  } catch (error) {
    console.error('Error executing code:', error);
    return { success: false, error: error.message };
  }
};

// Test specific cases against expected output
export const testCode = async (sourceCode, languageId, testCases) => {
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const input = typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input);
    
    const result = await executeCode(sourceCode, languageId, input);
    
    if (result.success) {
      const output = result.data.stdout.trim();
      const expected = typeof testCase.expected === 'string' ? testCase.expected : JSON.stringify(testCase.expected);
      
      const passed = output === expected.trim();
      
      results.push({
        testCase: i + 1,
        passed,
        input: input,
        expected: expected,
        actual: output,
        error: result.data.stderr,
        status: result.data.status
      });
    } else {
      results.push({
        testCase: i + 1,
        passed: false,
        input: input,
        expected: testCase.expected,
        actual: '',
        error: result.error,
        status: 'Error'
      });
    }
  }
  
  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
};
