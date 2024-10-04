const readline = require('readline');
const OpenAI = require('openai');
require('dotenv').config();
const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/ask', async (req, res) => {
  const question = req.body.question;
  const answer = await askAI(question);
  res.json({ answer });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Create public directory and index.html file
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Question Answering App</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f0f4f8;
            color: #333;
            line-height: 1.6;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        #chat {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #bdc3c7;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        #question {
            width: 75%;
            padding: 12px;
            border: 2px solid #3498db;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        #question:focus {
            outline: none;
            border-color: #2980b9;
        }
        #submit {
            padding: 12px 24px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s, transform 0.1s;
        }
        #submit:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
        }
        #submit:active {
            transform: translateY(0);
        }
        .message {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .user-message {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
        }
        .ai-message {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
    </style>
</head>
<body>
    <h1>AI Question Answering App</h1>
    <div id="chat"></div>
    <input type="text" id="question" placeholder="Ask a question...">
    <button id="submit">Ask</button>

    <script>
        const chatDiv = document.getElementById('chat');
        const questionInput = document.getElementById('question');
        const submitButton = document.getElementById('submit');
        
        submitButton.addEventListener('click', askQuestion);
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askQuestion();
        });

        function askQuestion() {
            const question = questionInput.value.trim();
            if (question) {
                addMessage('You', question, 'user-message');
                fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question })
                })
                .then(response => response.json())
                .then(data => {
                    addMessage('AI', data.answer, 'ai-message');
                })
                .catch(error => {
                    console.error('Error:', error);
                    addMessage('AI', 'Sorry, I encountered an error.', 'ai-message');
                });
                questionInput.value = '';
            }
        }

        function addMessage(sender, message, className) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + className;
            messageDiv.innerHTML = '<strong>' + sender + ':</strong> ' + message;
            chatDiv.appendChild(messageDiv);
            chatDiv.scrollTop = chatDiv.scrollHeight;
        }
    </script>
</body>
</html>
`;


fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
console.log('HTML file created at ' + path.join(publicDir, 'index.html'));


// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askAI(question, isInterview = false) {
    try {
      let systemMessage = "You are a helpful AI assistant.";
      if (isInterview) {
        systemMessage = "You are an AI interviewer for a customer engineer position at Sourcegraph. Ask relevant interview questions, evaluate the answers, and provide constructive feedback. Focus on technical skills, problem-solving abilities, and customer interaction skills.";
      }
  
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: question }
        ],
        max_tokens: 150,
      });
  
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error:', error);
      return 'I encountered an error while processing your request.';
    }
  }
  

function startConversation() {
  rl.question('Ask a question (or type "exit" to quit): ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const answer = await askAI(input);
    console.log('AI:', answer);
    startConversation();
  });
}
function startInterview() {
    isInterview = true;
    addMessage('System', 'Starting interview for customer engineer position at Sourcegraph...', 'ai-message');
    fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Ask the first interview question for a customer engineer position at Sourcegraph', isInterview: true })
    })
    .then(response => response.json())
    .then(data => {
        addMessage('AI Interviewer', data.answer, 'ai-message');
    })
    .catch(error => {
        console.error('Error:', error);
        addMessage('AI', 'Sorry, I encountered an error starting the interview.', 'ai-message');
    });
}

console.log('Welcome to the AI Question Answering App!');
startConversation();
