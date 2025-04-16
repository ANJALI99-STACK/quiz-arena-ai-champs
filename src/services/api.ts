
import axios from 'axios';
import { Question } from '../context/QuizContext';

// In production, this would be an environment variable
const API_BASE_URL = 'http://localhost:3001/api';

export const createRoom = async (
  userId: string,
  settings: {
    category: string;
    difficulty: string;
    questionCount: number;
  }
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms`, {
      hostId: userId,
      settings
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, userId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms/${roomId}/join`, {
      userId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to join room:', error);
    throw error;
  }
};

export const leaveRoom = async (roomId: string, userId: string) => {
  try {
    await axios.post(`${API_BASE_URL}/rooms/${roomId}/leave`, {
      userId
    });
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
    const response = await axios.get(`${API_BASE_URL}/questions`, {
      params: { category, difficulty, count }
    });
    return response.data;
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
    await axios.post(`${API_BASE_URL}/games/results`, {
      roomId,
      results
    });
  } catch (error) {
    console.error('Failed to save game results:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
};
