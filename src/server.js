
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // This would be the service account file

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to your domain
    methods: ['GET', 'POST']
  }
});

// In-memory storage for game rooms
const gameRooms = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;
  const userPhoto = socket.handshake.query.userPhoto;
  
  // Join a room
  socket.on('join-room', ({ roomId }) => {
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: [],
        hostId: null,
        settings: {
          category: 'general',
          difficulty: 'medium',
          questionCount: 5
        },
        status: 'waiting',
        questions: [],
        currentQuestion: 0,
        playerAnswers: new Map(),
        scores: []
      });
    }
    
    const room = gameRooms.get(roomId);
    
    // Add player to room if not already present
    if (!room.players.some(player => player.id === userId)) {
      room.players.push({
        id: userId,
        name: userName,
        photoURL: userPhoto,
        score: 0,
        correctAnswers: 0,
        answeredQuestions: 0
      });
    }
    
    socket.join(roomId);
    
    // Notify all players in the room
    io.to(roomId).emit('player-joined', {
      players: room.players
    });
  });
  
  // Start a game
  socket.on('start-game', ({ roomId, questions }) => {
    const room = gameRooms.get(roomId);
    
    if (!room) return;
    
    room.status = 'starting';
    room.questions = questions;
    room.currentQuestion = 0;
    room.playerAnswers = new Map();
    room.scores = room.players.map(player => ({
      userId: player.id,
      name: player.name,
      photoURL: player.photoURL,
      score: 0,
      correctAnswers: 0,
      answeredQuestions: 0
    }));
    
    io.to(roomId).emit('game-started', { questions });
    
    // Start the countdown for the first question
    startQuestionTimer(roomId);
  });
  
  // Submit an answer
  socket.on('submit-answer', ({ roomId, questionIndex, selectedAnswer }) => {
    const room = gameRooms.get(roomId);
    
    if (!room || room.status !== 'question') return;
    
    // Record the player's answer
    if (!room.playerAnswers.has(questionIndex)) {
      room.playerAnswers.set(questionIndex, []);
    }
    
    const playerAnswers = room.playerAnswers.get(questionIndex);
    
    // Check if player already answered
    const existingAnswer = playerAnswers.find(answer => answer.userId === userId);
    
    if (existingAnswer) {
      existingAnswer.answer = selectedAnswer;
    } else {
      playerAnswers.push({
        userId,
        answer: selectedAnswer
      });
    }
    
    // If all players have answered, end the question early
    if (playerAnswers.length === room.players.length) {
      endQuestion(roomId);
    }
  });
  
  // Leave room
  socket.on('leave-room', ({ roomId }) => {
    leaveRoom(roomId, userId);
    socket.leave(roomId);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find all rooms the player is in and remove them
    for (const [roomId, room] of gameRooms.entries()) {
      if (room.players.some(player => player.id === userId)) {
        leaveRoom(roomId, userId);
      }
    }
  });
});

// Helper to leave a room
function leaveRoom(roomId, userId) {
  const room = gameRooms.get(roomId);
  
  if (!room) return;
  
  // Remove player from room
  room.players = room.players.filter(player => player.id !== userId);
  
  // Notify remaining players
  io.to(roomId).emit('player-left', {
    players: room.players
  });
  
  // If room is empty, delete it
  if (room.players.length === 0) {
    gameRooms.delete(roomId);
    return;
  }
  
  // If host left, assign a new host
  if (room.hostId === userId) {
    room.hostId = room.players[0].id;
  }
}

// Start timer for a question
function startQuestionTimer(roomId) {
  const room = gameRooms.get(roomId);
  
  if (!room) return;
  
  room.status = 'question';
  let timeLeft = 15; // 15 seconds per question
  
  const timer = setInterval(() => {
    timeLeft--;
    
    // Send timer update to all players
    io.to(roomId).emit('timer-update', { timeLeft });
    
    if (timeLeft === 0) {
      clearInterval(timer);
      endQuestion(roomId);
    }
  }, 1000);
  
  // Store timer reference to clear it if needed
  room.timer = timer;
}

// End a question and calculate scores
function endQuestion(roomId) {
  const room = gameRooms.get(roomId);
  
  if (!room) return;
  
  // Clear timer if it's still running
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  
  const currentQuestionData = room.questions[room.currentQuestion];
  const correctAnswer = currentQuestionData.correctAnswer;
  const playerAnswers = room.playerAnswers.get(room.currentQuestion) || [];
  
  // Update scores
  for (const player of room.scores) {
    const playerAnswer = playerAnswers.find(answer => answer.userId === player.userId);
    
    if (playerAnswer) {
      player.answeredQuestions++;
      
      if (playerAnswer.answer === correctAnswer) {
        // Base score is 100 points for correct answer
        const baseScore = 100;
        
        // Bonus for answering quickly (not implemented in this simple version)
        player.score += baseScore;
        player.correctAnswers++;
      }
    }
  }
  
  // Notify all players of the results
  io.to(roomId).emit('question-ended', {
    correctAnswer,
    scores: room.scores
  });
  
  // Wait 5 seconds before moving to next question
  setTimeout(() => {
    moveToNextQuestion(roomId);
  }, 5000);
}

// Move to the next question or end the game
function moveToNextQuestion(roomId) {
  const room = gameRooms.get(roomId);
  
  if (!room) return;
  
  room.currentQuestion++;
  
  // Check if there are more questions
  if (room.currentQuestion < room.questions.length) {
    // Notify all players to move to next question
    io.to(roomId).emit('next-question', {
      questionIndex: room.currentQuestion
    });
    
    // Start timer for the next question
    startQuestionTimer(roomId);
  } else {
    // End the game
    room.status = 'ended';
    io.to(roomId).emit('game-ended');
  }
}

// API Routes

// Create a new room
app.post('/api/rooms', (req, res) => {
  const { hostId, settings } = req.body;
  
  // Generate a unique room code (6 alphanumeric characters)
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  gameRooms.set(roomId, {
    players: [],
    hostId,
    settings,
    status: 'waiting',
    questions: [],
    currentQuestion: 0,
    playerAnswers: new Map(),
    scores: []
  });
  
  res.json({ roomId });
});

// Join a room
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  
  const room = gameRooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Game already in progress' });
  }
  
  res.json({ success: true });
});

// Leave a room
app.post('/api/rooms/:roomId/leave', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  
  leaveRoom(roomId, userId);
  res.json({ success: true });
});

// Get AI-generated questions
app.get('/api/questions', async (req, res) => {
  const { category, difficulty, count } = req.query;
  
  try {
    // This would be implemented with a call to Gemini API
    // For demo purposes, returning mock data
    const questions = generateMockQuestions(category, difficulty, parseInt(count));
    res.json(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Save game results
app.post('/api/games/results', async (req, res) => {
  const { roomId, results } = req.body;
  
  try {
    // This would save results to Firestore or Supabase
    console.log('Saving game results:', results);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving game results:', error);
    res.status(500).json({ error: 'Failed to save game results' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    // This would fetch data from Firestore or Supabase
    const leaderboard = generateMockLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user stats
app.get('/api/users/:userId/stats', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // This would fetch data from Firestore or Supabase
    const stats = generateMockUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Helper function to generate mock questions
function generateMockQuestions(category, difficulty, count) {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    questions.push({
      id: uuidv4(),
      text: `Sample ${category} question ${i + 1} (${difficulty} difficulty)`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`
      ],
      correctAnswer: `Option A for question ${i + 1}`,
      category,
      difficulty
    });
  }
  
  return questions;
}

// Helper function to generate mock leaderboard
function generateMockLeaderboard() {
  return [
    {
      userId: '1',
      name: 'Jane Smith',
      photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Jane',
      totalScore: 2450,
      gamesPlayed: 15,
      averageScore: 163,
      accuracy: 0.85
    },
    {
      userId: '2',
      name: 'Alex Johnson',
      photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Alex',
      totalScore: 2280,
      gamesPlayed: 14,
      averageScore: 162,
      accuracy: 0.82
    },
    // Add more mock entries...
  ];
}

// Helper function to generate mock user stats
function generateMockUserStats(userId) {
  return {
    totalGames: 8,
    totalScore: 1240,
    correctAnswers: 32,
    totalQuestions: 40,
    averageScore: 155,
    accuracy: 0.8,
    recentGames: [
      {
        date: '2025-04-15',
        score: 180,
        correctAnswers: 4,
        totalQuestions: 5
      },
      {
        date: '2025-04-14',
        score: 160,
        correctAnswers: 4,
        totalQuestions: 5
      },
      {
        date: '2025-04-12',
        score: 140,
        correctAnswers: 3,
        totalQuestions: 5
      }
    ]
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
