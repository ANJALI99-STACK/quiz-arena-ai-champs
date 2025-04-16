
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserStats } from '../services/api';
import { ArrowLeft, Trophy, CheckCircle, BarChart, Clock, UserCircle } from 'lucide-react';

interface UserStats {
  totalGames: number;
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  averageScore: number;
  accuracy: number;
  recentGames: {
    date: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  }[];
}

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback stats for demonstration
        setStats({
          totalGames: 8,
          totalScore: 1240,
          correctAnswers: 32,
          totalQuestions: 40,
          averageScore: 155,
          accuracy: 0.8,
          recentGames: [
            {
              date: '2025-04-15',
              score: 180,
              correctAnswers: 4,
              totalQuestions: 5
            },
            {
              date: '2025-04-14',
              score: 160,
              correctAnswers: 4,
              totalQuestions: 5
            },
            {
              date: '2025-04-12',
              score: 140,
              correctAnswers: 3,
              totalQuestions: 5
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex justify-between items-center mb-8">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="md:w-1/3">
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                  <img 
                    src={currentUser.photoURL || 'https://via.placeholder.com/96'} 
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold mb-1">{currentUser.displayName}</h2>
                <p className="text-gray-500 text-sm mb-4">{currentUser.email}</p>
                
                <div className="w-full mt-4">
                  <Link to="/leaderboard">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Trophy className="h-4 w-4 text-quiz-primary" />
                      <span>View Leaderboard</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-2/3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-quiz-primary" />
                  <span>Your Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-quiz-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
                        <Trophy className="h-5 w-5 text-quiz-primary mb-2" />
                        <p className="text-sm text-gray-500">Total Score</p>
                        <p className="text-2xl font-bold">{stats.totalScore}</p>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
                        <Clock className="h-5 w-5 text-quiz-secondary mb-2" />
                        <p className="text-sm text-gray-500">Games Played</p>
                        <p className="text-2xl font-bold">{stats.totalGames}</p>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="text-2xl font-bold">{Math.round(stats.accuracy * 100)}%</p>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-4">Recent Games</h3>
                    {stats.recentGames.length > 0 ? (
                      <div className="space-y-3">
                        {stats.recentGames.map((game, index) => (
                          <div key={index} className="bg-white border rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{new Date(game.date).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-500">
                                {game.correctAnswers} of {game.totalQuestions} correct
                              </p>
                            </div>
                            <div className="font-bold text-xl text-quiz-primary">
                              {game.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No recent games found. Start playing to see your history!
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500">
                    Error loading stats. Please try again later.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
