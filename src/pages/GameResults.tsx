import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generateGameFeedback } from '../services/gemini';
import { saveGameResults } from '../services/api';
import { 
  Trophy, 
  Medal, 
  Award,
  Home,
  RotateCw,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GameResults = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { 
    questions, 
    playerScores,
    isHost 
  } = useQuiz();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (playerScores.length === 0) {
      navigate('/');
    }
  }, [playerScores, navigate]);

  useEffect(() => {
    const saveResults = async () => {
      if (isHost && roomId && playerScores.length > 0 && questions.length > 0) {
        try {
          const resultsData = {
            players: playerScores.map(player => ({
              userId: player.userId,
              score: player.score,
              correctAnswers: player.correctAnswers,
              totalQuestions: questions.length
            })),
            questions
          };
          
          await saveGameResults(roomId, resultsData);
        } catch (error) {
          console.error('Error saving game results:', error);
        }
      }
    };

    saveResults();
  }, [isHost, roomId, playerScores, questions]);

  useEffect(() => {
    const getPersonalFeedback = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const currentPlayerScore = playerScores.find(player => player.userId === currentUser.uid);
        
        if (currentPlayerScore) {
          const personalFeedback = await generateGameFeedback({
            name: currentPlayerScore.name,
            score: currentPlayerScore.score,
            correctAnswers: currentPlayerScore.correctAnswers,
            totalQuestions: questions.length
          });
          
          setFeedback(personalFeedback);
        }
      } catch (error) {
        console.error('Error generating feedback:', error);
        setFeedback('Great job playing! Check out your score on the leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    getPersonalFeedback();
  }, [currentUser, playerScores, questions]);

  useEffect(() => {
    if (playerScores.length > 0 && currentUser) {
      const sortedScores = [...playerScores].sort((a, b) => b.score - a.score);
      const currentPlayerRank = sortedScores.findIndex(player => player.userId === currentUser.uid);
      
      if (currentPlayerRank === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [playerScores, currentUser]);

  const handleNewGame = () => {
    navigate(`/lobby/${roomId}`);
  };

  const getCurrentPlayerPosition = () => {
    if (!currentUser) return -1;
    const sortedScores = [...playerScores].sort((a, b) => b.score - a.score);
    return sortedScores.findIndex(player => player.userId === currentUser.uid) + 1;
  };

  const sortedPlayers = [...playerScores].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-heading mb-2">Game Results</h1>
          <p className="text-gray-600">See how you did and where you stand!</p>
        </div>

        <div className="mb-12">
          <div className="relative h-48 md:h-56 flex items-end justify-center mb-6">
            {sortedPlayers.length > 1 && (
              <div className="absolute left-1/4 transform -translate-x-1/2 bottom-0 text-center z-10">
                <div className="bg-gray-100 border-2 border-gray-300 w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mx-auto mb-2">
                  <img 
                    src={sortedPlayers[1].photoURL || 'https://via.placeholder.com/112'} 
                    alt={sortedPlayers[1].name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-quiz-secondary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1">
                  <Medal className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm md:text-base truncate max-w-[120px]">{sortedPlayers[1].name}</p>
                <p className="font-bold">{sortedPlayers[1].score}</p>
              </div>
            )}
            
            {sortedPlayers.length > 0 && (
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 text-center z-20">
                <div className="bg-quiz-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="bg-yellow-100 border-2 border-yellow-400 w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mx-auto mb-2 shadow-lg">
                  <img 
                    src={sortedPlayers[0].photoURL || 'https://via.placeholder.com/144'} 
                    alt={sortedPlayers[0].name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="font-semibold text-lg truncate max-w-[120px] mx-auto">{sortedPlayers[0].name}</p>
                <p className="font-bold text-xl">{sortedPlayers[0].score}</p>
              </div>
            )}
            
            {sortedPlayers.length > 2 && (
              <div className="absolute left-3/4 transform -translate-x-1/2 bottom-0 text-center z-10">
                <div className="bg-gray-100 border-2 border-gray-300 w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mx-auto mb-2">
                  <img 
                    src={sortedPlayers[2].photoURL || 'https://via.placeholder.com/112'} 
                    alt={sortedPlayers[2].name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1">
                  <Award className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm md:text-base truncate max-w-[120px]">{sortedPlayers[2].name}</p>
                <p className="font-bold">{sortedPlayers[2].score}</p>
              </div>
            )}
          </div>
        </div>

        {currentUser && (
          <Card className="mb-8 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-quiz-primary" />
                <h2 className="text-xl font-semibold">Your Performance</h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-quiz-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 mb-4">
                    <div className="bg-purple-50 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-1">Your Position</p>
                      <p className="text-3xl font-bold text-quiz-primary">{getCurrentPlayerPosition()}</p>
                      <p className="text-sm text-gray-500">of {playerScores.length}</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-1">Score</p>
                      <p className="text-3xl font-bold text-quiz-primary">
                        {playerScores.find(p => p.userId === currentUser.uid)?.score || 0}
                      </p>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-1">Correct Answers</p>
                      <p className="text-3xl font-bold text-quiz-primary">
                        {playerScores.find(p => p.userId === currentUser.uid)?.correctAnswers || 0}
                      </p>
                      <p className="text-sm text-gray-500">of {questions.length}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
                    <p className="italic">{feedback}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <button 
            className="flex items-center gap-2 mb-4 font-semibold text-quiz-primary"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>Full Leaderboard</span>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showDetails && (
            <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in">
              <div className="grid grid-cols-12 bg-gray-100 p-3 font-medium">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-7">Player</div>
                <div className="col-span-2 text-center">Correct</div>
                <div className="col-span-2 text-right">Score</div>
              </div>
              <div className="divide-y">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.userId} 
                    className={`grid grid-cols-12 p-3 items-center ${player.userId === currentUser?.uid ? 'bg-purple-50' : ''}`}
                  >
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
                      {player.userId === currentUser?.uid && (
                        <span className="text-xs text-gray-500">(You)</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      {player.correctAnswers}/{questions.length}
                    </div>
                    <div className="col-span-2 text-right font-bold">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span>Back to Home</span>
            </Button>
          </Link>
          
          <Button 
            onClick={handleNewGame}
            className="quiz-button-primary w-full sm:w-auto flex items-center gap-2"
          >
            <RotateCw className="h-5 w-5" />
            <span>Play New Game</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
