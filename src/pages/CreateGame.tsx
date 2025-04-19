import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { createRoom } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'custom', label: 'Custom Topic' },
];

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const CreateGame = () => {
  const [category, setCategory] = useState('general');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const { currentUser } = useAuth();
  const { setRoomId, setIsHost } = useQuiz();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateGame = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a game.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      const { roomId } = await createRoom(currentUser.uid, {
        category: category === 'custom' ? 'custom' : category,
        customTopic: category === 'custom' ? customTopic : undefined,
        difficulty,
        questionCount
      });
      
      setRoomId(roomId);
      setIsHost(true);
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Failed to create game",
        description: "There was a problem creating the game. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center gradient-heading">Create a Quiz Game</CardTitle>
          <CardDescription className="text-center">
            Customize your game settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Question Category
            </label>
            <Select 
              value={category} 
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === 'custom' && (
            <div className="space-y-2">
              <label htmlFor="customTopic" className="text-sm font-medium">
                Enter Your Topic
              </label>
              <Input
                id="customTopic"
                placeholder="Enter a specific topic (e.g., 'Ancient Rome', 'Jazz Music')"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="difficulty" className="text-sm font-medium">
              Difficulty Level
            </label>
            <Select 
              value={difficulty} 
              onValueChange={setDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff.value} value={diff.value}>
                    {diff.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="questionCount" className="text-sm font-medium">
              Number of Questions: {questionCount}
            </label>
            <Slider
              id="questionCount"
              min={3}
              max={15}
              step={1}
              value={[questionCount]}
              onValueChange={(value) => setQuestionCount(value[0])}
              className="py-4"
            />
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleCreateGame} 
              className="quiz-button-primary w-full"
              disabled={isCreating || !currentUser || (category === 'custom' && !customTopic.trim())}
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Create Game
                </span>
              )}
            </Button>
          </div>
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

export default CreateGame;
