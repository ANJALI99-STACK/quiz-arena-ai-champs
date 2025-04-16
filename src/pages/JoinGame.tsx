
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { joinRoom } from '../services/api';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JoinGame = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { currentUser } = useAuth();
  const { setRoomId, setIsHost } = useQuiz();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a valid room code to join a game.",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to join a game.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsJoining(true);
      await joinRoom(roomCode, currentUser.uid);
      setRoomId(roomCode);
      setIsHost(false);
      navigate(`/lobby/${roomCode}`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: "Failed to join game",
        description: "The room code might be invalid or the game has already started.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center gradient-heading">Join a Quiz Game</CardTitle>
          <CardDescription className="text-center">
            Enter the room code to join an existing game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinGame} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomCode" className="text-sm font-medium">
                Room Code
              </label>
              <Input
                id="roomCode"
                placeholder="Enter 6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="text-center text-xl tracking-widest"
                maxLength={6}
                autoComplete="off"
              />
            </div>
            <Button 
              type="submit" 
              className="quiz-button-primary w-full"
              disabled={isJoining || !roomCode.trim() || !currentUser}
            >
              {isJoining ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Joining...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Join Game
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default JoinGame;
