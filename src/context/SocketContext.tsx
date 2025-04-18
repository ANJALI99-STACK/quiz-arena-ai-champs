
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Mock Socket interface to match Socket.io-client's interface
interface MockSocket {
  id: string;
  connected: boolean;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  emit: (event: string, data: any) => void;
  disconnect: () => void;
}

// Create a mock socket implementation
const createMockSocket = (userId: string, userName: string, userPhoto: string): MockSocket => {
  const eventHandlers: Record<string, Function[]> = {};
  let playerScore = 0;
  let correctAnswersCount = 0;
  let answeredQuestionsCount = 0;
  let timerInterval: NodeJS.Timeout | null = null;
  let currentGameQuestions: any[] = [];
  
  return {
    id: `mock-socket-${Math.random().toString(36).substring(2, 9)}`,
    connected: true,
    on: (event: string, callback: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(callback);
    },
    off: (event: string, callback?: Function) => {
      // If callback is provided, remove just that callback
      if (callback && eventHandlers[event]) {
        const index = eventHandlers[event].indexOf(callback);
        if (index !== -1) {
          eventHandlers[event].splice(index, 1);
        }
      } else {
        // Otherwise, remove all callbacks for this event
        delete eventHandlers[event];
      }
    },
    emit: (event: string, data: any) => {
      console.log(`[Mock Socket] Emit: ${event}`, data);
      
      // Simulate server responses based on the emitted event
      setTimeout(() => {
        switch (event) {
          case 'join-room':
            if (eventHandlers['player-joined']) {
              eventHandlers['player-joined'].forEach(callback => 
                callback({ 
                  players: [
                    { 
                      id: userId, 
                      name: userName, 
                      photoURL: userPhoto,
                      score: 0
                    }
                  ] 
                })
              );
            }
            break;
            
          case 'start-game':
            // Store questions for this game session
            currentGameQuestions = [...data.questions];
            
            // Reset game state for a new game
            playerScore = 0;
            correctAnswersCount = 0;
            answeredQuestionsCount = 0;
            
            if (eventHandlers['game-started']) {
              eventHandlers['game-started'].forEach(callback => 
                callback({ questions: currentGameQuestions })
              );
            }
            
            // Simulate a timer update for the first question
            if (eventHandlers['timer-update']) {
              // Clear any existing timer
              if (timerInterval) {
                clearInterval(timerInterval);
              }
              
              let timeLeft = 15;
              timerInterval = setInterval(() => {
                timeLeft--;
                eventHandlers['timer-update'].forEach(callback => callback({ timeLeft }));
                
                if (timeLeft <= 0) {
                  if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                  }
                  
                  // Question timed out - count as answered but not correct
                  answeredQuestionsCount++;
                  
                  // Simulate question ended event
                  if (eventHandlers['question-ended']) {
                    eventHandlers['question-ended'].forEach(callback => 
                      callback({
                        correctAnswer: currentGameQuestions[0].correctAnswer,
                        scores: [
                          {
                            userId,
                            name: userName,
                            photoURL: userPhoto,
                            score: playerScore,
                            correctAnswers: correctAnswersCount,
                            answeredQuestions: answeredQuestionsCount
                          }
                        ]
                      })
                    );
                  }
                  
                  // Move to next question after 5 seconds
                  setTimeout(() => {
                    if (eventHandlers['next-question']) {
                      eventHandlers['next-question'].forEach(callback => 
                        callback({ questionIndex: 1 })
                      );
                      
                      // Start timer for next question
                      startTimerForQuestion(1);
                    }
                  }, 5000);
                }
              }, 1000);
            }
            break;
            
          case 'submit-answer':
            // Clear the running timer when an answer is submitted
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            
            // Since this is single player mode, immediately trigger the question-ended event
            if (eventHandlers['question-ended']) {
              const correctAnswer = currentGameQuestions[data.questionIndex].correctAnswer;
              const isCorrect = data.selectedAnswer === correctAnswer;
              
              // Update score and counters
              answeredQuestionsCount++;
              if (isCorrect) {
                correctAnswersCount++;
                playerScore += 100;
              }
              
              // Short delay to make it feel more natural
              setTimeout(() => {
                eventHandlers['question-ended'].forEach(callback => 
                  callback({
                    correctAnswer: correctAnswer,
                    scores: [
                      {
                        userId,
                        name: userName,
                        photoURL: userPhoto,
                        score: playerScore,
                        correctAnswers: correctAnswersCount,
                        answeredQuestions: answeredQuestionsCount
                      }
                    ]
                  })
                );
                
                // Move to next question after a short delay
                setTimeout(() => {
                  if (eventHandlers['next-question']) {
                    const nextIndex = data.questionIndex + 1;
                    
                    // If we've reached the last question, end the game
                    if (nextIndex >= currentGameQuestions.length) {
                      if (eventHandlers['game-ended']) {
                        eventHandlers['game-ended'].forEach(callback => callback());
                      }
                    } else {
                      eventHandlers['next-question'].forEach(callback => 
                        callback({ questionIndex: nextIndex })
                      );
                      
                      // Start timer for next question
                      startTimerForQuestion(nextIndex);
                    }
                  }
                }, 3000);
              }, 1000);
            }
            break;
            
          case 'leave-room':
            // Clear any running timer
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            
            if (eventHandlers['player-left']) {
              eventHandlers['player-left'].forEach(callback => 
                callback({ 
                  players: [] 
                })
              );
            }
            break;
          
          default:
            break;
        }
      }, 300); // Simulate network delay
    },
    disconnect: () => {
      // Clear any running timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      console.log('[Mock Socket] Disconnected');
    }
  };
  
  // Helper function to start timer for a specific question
  function startTimerForQuestion(questionIndex: number) {
    if (!eventHandlers['timer-update']) return;
    
    let timeLeft = 15;
    timerInterval = setInterval(() => {
      timeLeft--;
      eventHandlers['timer-update'].forEach(callback => callback({ timeLeft }));
      
      if (timeLeft <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        
        // Question timed out - count as answered but not correct
        answeredQuestionsCount++;
        
        // Trigger question ended event
        if (eventHandlers['question-ended']) {
          const correctAnswer = currentGameQuestions[questionIndex].correctAnswer;
          eventHandlers['question-ended'].forEach(callback => 
            callback({
              correctAnswer,
              scores: [
                {
                  userId,
                  name: userName,
                  photoURL: userPhoto,
                  score: playerScore,
                  correctAnswers: correctAnswersCount,
                  answeredQuestions: answeredQuestionsCount
                }
              ]
            })
          );
        }
        
        // Move to next question after delay
        setTimeout(() => {
          if (eventHandlers['next-question']) {
            const nextIndex = questionIndex + 1;
            
            // If we've reached the last question, end the game
            if (nextIndex >= currentGameQuestions.length) {
              if (eventHandlers['game-ended']) {
                eventHandlers['game-ended'].forEach(callback => callback());
              }
            } else {
              eventHandlers['next-question'].forEach(callback => 
                callback({ questionIndex: nextIndex })
              );
              
              // Start timer for next question
              startTimerForQuestion(nextIndex);
            }
          }
        }, 5000);
      }
    }, 1000);
  }
};

interface SocketContextType {
  socket: MockSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<MockSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const mockSocket = createMockSocket(
        currentUser.uid,
        currentUser.displayName || 'Anonymous',
        currentUser.photoURL || ''
      );
      
      setSocket(mockSocket);
      setIsConnected(true);
      
      console.log('[Mock Socket] Connected');
      
      return () => {
        mockSocket.disconnect();
        setIsConnected(false);
      };
    }
    
    return undefined;
  }, [currentUser]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
