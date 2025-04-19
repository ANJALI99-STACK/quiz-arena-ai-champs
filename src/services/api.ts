
import { Question } from '../context/QuizContext';
import { v4 as uuidv4 } from 'uuid';

// Mock API base URL (for development only)
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a random room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate mock questions based on category and difficulty
const generateMockQuestions = (
  category: string, 
  difficulty: string, 
  count: number,
  customTopic?: string
): Question[] => {
  const questions = [];
  
  // Adjust category name for display if it's a custom topic
  const displayCategory = customTopic || category;
  
  for (let i = 0; i < count; i++) {
    questions.push({
      id: uuidv4(),
      text: `Sample ${displayCategory} question ${i + 1} (${difficulty} difficulty)`,
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
};

export const createRoom = async (
  userId: string,
  settings: {
    category: string;
    difficulty: string;
    questionCount: number;
    customTopic?: string;
  }
) => {
  try {
    // Simulate network delay
    await delay(500);
    
    // Generate a random room ID
    const roomId = generateRoomId();
    
    console.log('Created room with ID:', roomId);
    return { roomId };
  } catch (error) {
    console.error('Failed to create room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, userId: string) => {
  try {
    // Simulate network delay
    await delay(300);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to join room:', error);
    throw error;
  }
};

export const leaveRoom = async (roomId: string, userId: string) => {
  try {
    // Simulate network delay
    await delay(200);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to leave room:', error);
    throw error;
  }
};

export const getQuestions = async (
  category: string,
  difficulty: string,
  count: number
): Promise<Question[]> => {
  try {
    // Simulate network delay
    await delay(800);
    
    // Generate mock questions
    return generateMockQuestions(category, difficulty, count);
  } catch (error) {
    console.error('Failed to get questions:', error);
    throw error;
  }
};

export const saveGameResults = async (
  roomId: string,
  results: {
    players: {
      userId: string;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
    }[];
    questions: Question[];
  }
) => {
  try {
    // Simulate network delay
    await delay(400);
    
    console.log('Saved game results for room:', roomId);
    return { success: true };
  } catch (error) {
    console.error('Failed to save game results:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    // Simulate network delay
    await delay(600);
    
    // Return mock leaderboard data
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
      {
        userId: '3',
        name: 'Sam Miller',
        photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Sam',
        totalScore: 2150,
        gamesPlayed: 12,
        averageScore: 179,
        accuracy: 0.79
      }
    ];
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    // Simulate network delay
    await delay(500);
    
    // Return mock user stats
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
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
};
