import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Shared rooms storage to simulate server-side room data
// This will allow different socket instances to share room data
const mockGameRooms = new Map();

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
  let currentRoomId: string | null = null;
  let timerInterval: NodeJS.Timeout | null = null;
  
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
            currentRoomId = data.roomId;
            
            // Create room if it doesn't exist
            if (!mockGameRooms.has(currentRoomId)) {
              mockGameRooms.set(currentRoomId, {
                players: [],
                questions: [],
                hostId: userId, // First player to join is the host
                currentQuestion: 0,
                playerScores: [],
                gameStarted: false
              });
            }
            
            const room = mockGameRooms.get(currentRoomId);
            
            // Add player if not already in the room
            if (!room.players.find((p: any) => p.id === userId)) {
              room.players.push({ 
                id: userId, 
                name: userName, 
                photoURL: userPhoto,
                score: 0,
                correctAnswers: 0,
                answeredQuestions: 0
              });
            }
            
            // Notify all connected players about the new player
            if (eventHandlers['player-joined']) {
              eventHandlers['player-joined'].forEach(callback => 
                callback({ players: room.players })
              );
            }
            break;
            
          case 'start-game':
            if (!currentRoomId) break;
            
            const startRoom = mockGameRooms.get(currentRoomId);
            if (!startRoom) break;
            
            // Store questions and mark game as started
            startRoom.questions = [...data.questions];
            startRoom.gameStarted = true;
            startRoom.currentQuestion = 0;
            
            // Reset player scores
            startRoom.playerScores = startRoom.players.map((player: any) => ({
              userId: player.id,
              name: player.name,
              photoURL: player.photoURL,
              score: 0,
              correctAnswers: 0,
              answeredQuestions: 0
            }));
            
            if (eventHandlers['game-started']) {
              eventHandlers['game-started'].forEach(callback => 
                callback({ questions: startRoom.questions })
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
                
                // If room was deleted or game ended, clear timer
                if (!mockGameRooms.has(currentRoomId) || 
                    !mockGameRooms.get(currentRoomId).gameStarted) {
                  if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                  }
                  return;
                }
                
                eventHandlers['timer-update'].forEach(callback => callback({ timeLeft }));
                
                if (timeLeft <= 0) {
                  if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                  }
                  
                  // Handle question timeout for this player
                  handleQuestionEnd(currentRoomId, 0, null);
                }
              }, 1000);
            }
            break;
            
          case 'submit-answer':
            if (!currentRoomId) break;
            
            // Handle player's answer submission
            handleQuestionEnd(currentRoomId, data.questionIndex, data.selectedAnswer);
            break;
            
          case 'leave-room':
            if (!currentRoomId) break;
            
            // Clear any running timer
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            
            // Remove player from room
            const leaveRoom = mockGameRooms.get(currentRoomId);
            if (leaveRoom) {
              leaveRoom.players = leaveRoom.players.filter((p: any) => p.id !== userId);
              
              // If room is empty, delete it
              if (leaveRoom.players.length === 0) {
                mockGameRooms.delete(currentRoomId);
              } 
              // Otherwise notify remaining players
              else if (eventHandlers['player-left']) {
                eventHandlers['player-left'].forEach(callback => 
                  callback({ players: leaveRoom.players })
                );
              }
            }
            
            currentRoomId = null;
            break;
          
          default:
            break;
        }
      }, 300); // Simulate network delay
    },
    disconnect: () => {
      // Clean up on disconnect
      if (currentRoomId) {
        const disconnectRoom = mockGameRooms.get(currentRoomId);
        if (disconnectRoom) {
          disconnectRoom.players = disconnectRoom.players.filter((p: any) => p.id !== userId);
          
          // If room is empty, delete it
          if (disconnectRoom.players.length === 0) {
            mockGameRooms.delete(currentRoomId);
          }
        }
      }
      
      // Clear any running timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      
      console.log('[Mock Socket] Disconnected');
    }
  };
  
  // Helper function to handle question end (timeout or answer submission)
  function handleQuestionEnd(roomId: string, questionIndex: number, selectedAnswer: string | null) {
    const room = mockGameRooms.get(roomId);
    if (!room || !room.gameStarted) return;
    
    const questionData = room.questions[questionIndex];
    const correctAnswer = questionData.correctAnswer;
    
    // Find or create player score
    let playerScore = room.playerScores.find((score: any) => score.userId === userId);
    if (!playerScore) {
      playerScore = {
        userId,
        name: userName,
        photoURL: userPhoto,
        score: 0,
        correctAnswers: 0,
        answeredQuestions: 0
      };
      room.playerScores.push(playerScore);
    }
    
    // Update player score
    playerScore.answeredQuestions++;
    if (selectedAnswer === correctAnswer) {
      playerScore.correctAnswers++;
      playerScore.score += 100;
    }
    
    // Notify about question results
    if (eventHandlers['question-ended']) {
      eventHandlers['question-ended'].forEach(callback => 
        callback({
          correctAnswer,
          scores: room.playerScores
        })
      );
    }
    
    // After a delay, move to next question
    setTimeout(() => {
      // Check if room still exists
      if (!mockGameRooms.has(roomId) || !room.gameStarted) return;
      
      const nextIndex = questionIndex + 1;
      
      // If we've reached the last question, end the game
      if (nextIndex >= room.questions.length) {
        room.gameStarted = false;
        
        if (eventHandlers['game-ended']) {
          eventHandlers['game-ended'].forEach(callback => callback());
        }
      } else {
        room.currentQuestion = nextIndex;
        
        if (eventHandlers['next-question']) {
          eventHandlers['next-question'].forEach(callback => 
            callback({ questionIndex: nextIndex })
          );
          
          // Start timer for next question
          startTimerForQuestion(roomId, nextIndex);
        }
      }
    }, 5000);
  }
  
  // Helper function to start timer for next question
  function startTimerForQuestion(roomId: string, questionIndex: number) {
    if (!eventHandlers['timer-update']) return;
    
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    let timeLeft = 15;
    timerInterval = setInterval(() => {
      timeLeft--;
      
      // If room was deleted or game ended, clear timer
      if (!mockGameRooms.has(roomId) || 
          !mockGameRooms.get(roomId).gameStarted) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        return;
      }
      
      eventHandlers['timer-update'].forEach(callback => callback({ timeLeft }));
      
      if (timeLeft <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        
        // Handle question timeout
        handleQuestionEnd(roomId, questionIndex, null);
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
