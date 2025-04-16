import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Mock Socket interface to match Socket.io-client's interface
interface MockSocket {
  id: string;
  connected: boolean;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void; // Added off method
  emit: (event: string, data: any) => void;
  disconnect: () => void;
}

// Create a mock socket implementation
const createMockSocket = (userId: string, userName: string, userPhoto: string): MockSocket => {
  const eventHandlers: Record<string, Function[]> = {};
  
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
            if (eventHandlers['game-started']) {
              eventHandlers['game-started'].forEach(callback => 
                callback({ questions: data.questions })
              );
            }
            
            // Simulate a timer update for the first question
            if (eventHandlers['timer-update']) {
              let timeLeft = 15;
              const timerInterval = setInterval(() => {
                timeLeft--;
                eventHandlers['timer-update'].forEach(callback => callback({ timeLeft }));
                
                if (timeLeft <= 0) {
                  clearInterval(timerInterval);
                  
                  // Simulate question ended event
                  if (eventHandlers['question-ended']) {
                    eventHandlers['question-ended'].forEach(callback => 
                      callback({
                        correctAnswer: data.questions[0].correctAnswer,
                        scores: [
                          {
                            userId,
                            name: userName,
                            photoURL: userPhoto,
                            score: 100,
                            correctAnswers: 1,
                            answeredQuestions: 1
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
                    }
                  }, 5000);
                }
              }, 1000);
            }
            break;
            
          case 'submit-answer':
            // No immediate response needed, the timer will handle transitioning to the next question
            break;
            
          case 'leave-room':
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
      console.log('[Mock Socket] Disconnected');
    }
  };
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
