
import { Question } from '../context/QuizContext';

// In production, this would be an environment variable
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const generateQuizQuestions = async (
  category: string,
  difficulty: string,
  count: number
): Promise<Question[]> => {
  try {
    const prompt = `Generate ${count} multiple-choice trivia questions about ${category} at ${difficulty} difficulty level. Each question should have 4 options with one correct answer. Format as JSON with this structure:
    [
      {
        "id": "unique_id",
        "text": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct option text",
        "category": "${category}",
        "difficulty": "${difficulty}"
      }
    ]`;

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    // Extract the JSON string from the response and parse it
    const text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to generate quiz questions:', error);
    throw error;
  }
};

export const generateGameFeedback = async (
  playerStats: {
    name: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  }
): Promise<string> => {
  try {
    const prompt = `Generate personalized feedback for a player named ${playerStats.name} who completed a quiz game. 
    They scored ${playerStats.score} points, getting ${playerStats.correctAnswers} correct answers out of ${playerStats.totalQuestions} questions.
    Keep it encouraging, positive, and around 3-4 sentences. Avoid generic phrases like "keep up the good work" and make it feel personalized.`;

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Failed to generate game feedback:', error);
    throw error;
  }
};
