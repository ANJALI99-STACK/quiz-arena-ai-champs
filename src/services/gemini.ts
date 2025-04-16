
import { Question } from '../context/QuizContext';
import { v4 as uuidv4 } from 'uuid';

// In production, this would be an environment variable
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Helper function to generate mock questions
const generateMockQuestions = (
  category: string,
  difficulty: string,
  count: number
): Question[] => {
  const questions: Question[] = [];
  
  const categoryQuestions = {
    general: [
      {
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars"
      },
      {
        text: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswer: "Leonardo da Vinci"
      },
      {
        text: "What is the capital of Japan?",
        options: ["Beijing", "Seoul", "Bangkok", "Tokyo"],
        correctAnswer: "Tokyo"
      },
      {
        text: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
        correctAnswer: "Oxygen"
      },
      {
        text: "In what year did World War II end?",
        options: ["1943", "1945", "1947", "1950"],
        correctAnswer: "1945"
      }
    ],
    science: [
      {
        text: "What is the atomic number of Carbon?",
        options: ["4", "6", "8", "12"],
        correctAnswer: "6"
      },
      {
        text: "Which of these is NOT a state of matter?",
        options: ["Plasma", "Gas", "Energy", "Solid"],
        correctAnswer: "Energy"
      }
    ],
    history: [
      {
        text: "Who was the first President of the United States?",
        options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
        correctAnswer: "George Washington"
      },
      {
        text: "When did the French Revolution begin?",
        options: ["1789", "1776", "1804", "1812"],
        correctAnswer: "1789"
      }
    ]
  };
  
  // Select questions based on category
  const questionPool = category === 'general' 
    ? categoryQuestions.general 
    : (categoryQuestions[category as keyof typeof categoryQuestions] || categoryQuestions.general);
  
  // Generate the requested number of questions
  for (let i = 0; i < count; i++) {
    const questionIndex = i % questionPool.length;
    const question = questionPool[questionIndex];
    
    questions.push({
      id: uuidv4(),
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      category,
      difficulty
    });
  }
  
  return questions;
};

export const generateQuizQuestions = async (
  category: string,
  difficulty: string,
  count: number
): Promise<Question[]> => {
  try {
    console.log(`Generating ${count} ${difficulty} questions about ${category}`);
    
    // Check if we're in development environment or API key is not set
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.log('Using mock questions (no API key provided)');
      return generateMockQuestions(category, difficulty, count);
    }
    
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

    if (!response.ok) {
      console.warn('API response not OK, falling back to mock questions');
      return generateMockQuestions(category, difficulty, count);
    }

    const data = await response.json();
    
    // Check if we have candidates in the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.warn('Invalid API response, falling back to mock questions');
      return generateMockQuestions(category, difficulty, count);
    }
    
    // Extract the JSON string from the response and parse it
    const text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to generate quiz questions:', error);
    console.log('Falling back to mock questions due to error');
    return generateMockQuestions(category, difficulty, count);
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
    // If API key is not set, return a predefined feedback message
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      const accuracy = playerStats.correctAnswers / playerStats.totalQuestions;
      
      if (accuracy >= 0.8) {
        return `Outstanding work, ${playerStats.name}! Your score of ${playerStats.score} points shows your impressive knowledge. Getting ${playerStats.correctAnswers} out of ${playerStats.totalQuestions} questions right puts you among our top players!`;
      } else if (accuracy >= 0.6) {
        return `Great job, ${playerStats.name}! You scored ${playerStats.score} points and answered ${playerStats.correctAnswers} out of ${playerStats.totalQuestions} questions correctly. Your knowledge is solid and impressive.`;
      } else {
        return `Nice effort, ${playerStats.name}! You scored ${playerStats.score} points with ${playerStats.correctAnswers} correct answers out of ${playerStats.totalQuestions}. Keep playing to improve your knowledge and beat your personal best!`;
      }
    }

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

    if (!response.ok) {
      throw new Error('Failed to generate feedback');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Failed to generate game feedback:', error);
    return `Great job, ${playerStats.name}! You scored ${playerStats.score} points with ${playerStats.correctAnswers} correct answers out of ${playerStats.totalQuestions}. Keep challenging yourself!`;
  }
};
