
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: string;
}

export interface PlayerScore {
  userId: string;
  name: string;
  photoURL: string;
  score: number;
  correctAnswers: number;
  answeredQuestions: number;
}

interface QuizContextType {
  roomId: string | null;
  isHost: boolean;
  questions: Question[];
  currentQuestion: number;
  timeRemaining: number;
  playerScores: PlayerScore[];
  selectedAnswer: string | null;
  gameStatus: 'waiting' | 'starting' | 'question' | 'results' | 'ended';
  setRoomId: (id: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  setPlayerScores: (scores: PlayerScore[]) => void;
  setSelectedAnswer: (answer: string | null) => void;
  setGameStatus: (status: 'waiting' | 'starting' | 'question' | 'results' | 'ended') => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'starting' | 'question' | 'results' | 'ended'>('waiting');

  const value = {
    roomId,
    isHost,
    questions,
    currentQuestion,
    timeRemaining,
    playerScores,
    selectedAnswer,
    gameStatus,
    setRoomId,
    setIsHost,
    setQuestions,
    setCurrentQuestion,
    setTimeRemaining,
    setPlayerScores,
    setSelectedAnswer,
    setGameStatus
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};
