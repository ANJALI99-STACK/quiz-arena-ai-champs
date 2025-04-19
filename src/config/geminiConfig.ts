export const GEMINI_CONFIG = {
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  defaultParams: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topK: 40,
    topP: 0.95,
  },
  questionGeneration: {
    systemPrompt: (category: string, difficulty: string, count: number) => `
Generate ${count} multiple-choice trivia questions about ${category} at ${difficulty} difficulty level.
Each question should:
- Be engaging and clear
- Have exactly 4 options
- Include one definitively correct answer
- Match the difficulty level
- Be factually accurate
- Be appropriate for all ages

Format as valid JSON with this structure:
[
  {
    "id": "unique_id",
    "text": "question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option text",
    "category": "${category}",
    "difficulty": "${difficulty}"
  }
]`,
    mockQuestions: {
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
    }
  }
};

export const validateGeminiResponse = (response: any): boolean => {
  if (!response || !Array.isArray(response)) return false;
  
  return response.every(question => (
    question.id &&
    question.text &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.correctAnswer &&
    question.options.includes(question.correctAnswer) &&
    question.category &&
    question.difficulty
  ));
};

export const parseGeminiResponse = (text: string) => {
  try {
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return null;
  }
};
