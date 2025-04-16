
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { useSocket } from '../context/SocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getQuestions } from '../services/api';
import { generateQuizQuestions } from '../services/gemini';
import { Users, Copy, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  photoURL: string;
}

const GameLobby = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const { isHost, setQuestions } = useQuiz();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (socket && roomId) {
      socket.emit('join-room', { roomId });

      socket.on('player-joined', (data) => {
        setPlayers(data.players);
      });

      socket.on('player-left', (data) => {
        setPlayers(data.players);
      });

      socket.on('game-started', async (data) => {
        try {
          setQuestions(data.questions);
          navigate(`/game/${roomId}`);
        } catch (error) {
          console.error('Error starting game:', error);
        }
      });

      return () => {
        socket.off('player-joined');
        socket.off('player-left');
        socket.off('game-started');
      };
    }
  }, [socket, roomId, currentUser, navigate, setQuestions]);

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startGame = async () => {
    if (!isHost || !roomId || !socket) return;

    try {
      setLoading(true);
      
      // Get AI-generated questions or fetch from API
      const questions = await generateQuizQuestions('general', 'medium', 5);
      // Alternative: Use API instead of Gemini
      // const questions = await getQuestions('general', 'medium', 5);
      
      socket.emit('start-game', { roomId, questions });
      setQuestions(questions);
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Failed to start game",
        description: "There was a problem generating questions. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-heading mb-2">Game Lobby</h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="text-lg font-semibold bg-white px-4 py-2 rounded-lg border">
              Room Code: <span className="font-mono">{roomId}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyRoomCode}
              className="flex items-center justify-center"
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md mb-8 flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left text-yellow-700">
              <p className="font-medium">Share the room code with friends to invite them to your game.</p>
              <p>Once everyone has joined, the host can start the game.</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-quiz-primary" />
            <h2 className="text-xl font-semibold">Players ({players.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player) => (
              <Card key={player.id} className="animate-fade-in">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={player.photoURL || 'https://via.placeholder.com/40'} 
                      alt={player.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <p className="font-medium truncate">{player.name}</p>
                    {player.id === (currentUser?.uid ?? '') && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="text-center">
            <Button
              onClick={startGame}
              disabled={loading || players.length < 1}
              className="quiz-button-primary px-8 py-6 text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating Questions...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  Start Game
                </span>
              )}
            </Button>
            {players.length < 1 && (
              <p className="text-sm text-gray-500 mt-2">You need at least one player to start the game.</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center">
            <div className="animate-pulse-light bg-white bg-opacity-80 rounded-lg p-4 inline-block">
              <p className="text-gray-600">Waiting for the host to start the game...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
