import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { useSocket } from '../context/SocketContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuizGame = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    questions, 
    currentQuestion, 
    setCurrentQuestion,
    timeRemaining,
    setTimeRemaining,
    selectedAnswer,
    setSelectedAnswer,
    playerScores,
    setPlayerScores,
    gameStatus,
    setGameStatus
  } = useQuiz();
  const { socket } = useSocket();
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);

  // Watch for time running out
  useEffect(() => {
    if (timeRemaining === 0 && !submitted && !showResults) {
      toast({
        title: "Time's Up!",
        description: "You ran out of time for this question.",
        variant: "destructive",
      });
      setSubmitted(true);
    }
  }, [timeRemaining, submitted, showResults, toast]);

  // Redirect if no questions loaded
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/');
    }
  }, [questions, navigate]);

  // Reset game state when component mounts
  useEffect(() => {
    setSubmitted(false);
    setShowResults(false);
    setCorrectAnswer(null);
  }, []);

  // Initialize timer and listeners when component mounts
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room
    socket.emit('join-game', { roomId });

    // Set up event listeners
    socket.on('timer-update', ({ timeLeft }) => {
      setTimeRemaining(timeLeft);
    });

    socket.on('question-ended', ({ correctAnswer, scores }) => {
      setCorrectAnswer(correctAnswer);
      setPlayerScores(scores);
      setShowResults(true);
    });

    socket.on('next-question', ({ questionIndex }) => {
      setCurrentQuestion(questionIndex);
      setSelectedAnswer(null);
      setSubmitted(false);
      setShowResults(false);
      setCorrectAnswer(null);
    });

    socket.on('game-ended', () => {
      setGameStatus('ended');
      navigate(`/results/${roomId}`);
    });

    // Cleanup on unmount
    return () => {
      socket.off('timer-update');
      socket.off('question-ended');
      socket.off('next-question');
      socket.off('game-ended');
    };
  }, [socket, roomId, setTimeRemaining, setPlayerScores, setCurrentQuestion, setSelectedAnswer, setGameStatus, navigate]);

  const handleSelectAnswer = (option: string) => {
    if (submitted || showResults) return;
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!socket || !roomId || !selectedAnswer || submitted) return;
    
    socket.emit('submit-answer', {
      roomId,
      questionIndex: currentQuestion,
      selectedAnswer,
      questions // Pass the entire questions array to the mock socket
    });

    setSubmitted(true);
  };

  // Get current question
  const questionData = questions[currentQuestion];
  if (!questionData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Timer and Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-quiz-primary" />
              <span className="font-bold">{timeRemaining}s</span>
            </div>
            <div>
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          <Progress value={(timeRemaining / 15) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8 p-6 animate-fade-in">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">{questionData.text}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {questionData.options.map((option, index) => {
              let optionClass = "answer-option";
              
              if (showResults) {
                if (option === questionData.correctAnswer) {
                  optionClass += " correct";
                } else if (option === selectedAnswer && option !== questionData.correctAnswer) {
                  optionClass += " incorrect";
                }
              } else if (option === selectedAnswer) {
                optionClass += " selected";
              }
              
              return (
                <div 
                  key={index}
                  className={optionClass}
                  onClick={() => handleSelectAnswer(option)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-3">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {!showResults && (
            <div className="text-center">
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitted}
                className="quiz-button-primary px-8"
              >
                {submitted ? "Answer Submitted" : "Submit Answer"}
              </Button>
            </div>
          )}

          {showResults && correctAnswer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="font-medium text-green-800">
                Correct answer: {correctAnswer}
              </p>
            </div>
          )}
        </Card>

        {/* Waiting Message */}
        {submitted && !showResults && (
          <div className="text-center animate-pulse-light">
            <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2">
              <AlertCircle className="h-5 w-5 text-quiz-primary" />
              <span>Waiting for other players to answer...</span>
            </div>
          </div>
        )}

        {/* Live Scoreboard */}
        {showResults && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-semibold mb-4">Current Standings</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-100 p-3 font-medium">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-7">Player</div>
                <div className="col-span-2 text-center">Correct</div>
                <div className="col-span-2 text-right">Score</div>
              </div>
              <div className="divide-y">
                {playerScores
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.userId} className="grid grid-cols-12 p-3 items-center">
                      <div className="col-span-1 text-center font-medium">{index + 1}</div>
                      <div className="col-span-7 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden">
                          <img 
                            src={player.photoURL || 'https://via.placeholder.com/32'} 
                            alt={player.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="truncate">{player.name}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        {player.correctAnswers}/{player.answeredQuestions}
                      </div>
                      <div className="col-span-2 text-right font-bold">{player.score}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGame;
