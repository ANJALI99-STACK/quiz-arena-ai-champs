
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Trophy, Medal, Award, Filter, Users } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  photoURL: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
  accuracy: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'totalScore' | 'accuracy' | 'averageScore'>('totalScore');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback data for demonstration
        setLeaderboard([
          {
            userId: '1',
            name: 'Jane Smith',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Jane',
            totalScore: 2450,
            gamesPlayed: 15,
            averageScore: 163,
            accuracy: 0.85
          },
          {
            userId: '2',
            name: 'Alex Johnson',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Alex',
            totalScore: 2280,
            gamesPlayed: 14,
            averageScore: 162,
            accuracy: 0.82
          },
          {
            userId: '3',
            name: 'Taylor Williams',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Taylor',
            totalScore: 1940,
            gamesPlayed: 12,
            averageScore: 161,
            accuracy: 0.78
          },
          {
            userId: currentUser?.uid || '4',
            name: currentUser?.displayName || 'Chris Robinson',
            photoURL: currentUser?.photoURL || 'https://api.dicebear.com/6.x/adventurer/svg?seed=Chris',
            totalScore: 1680,
            gamesPlayed: 10,
            averageScore: 168,
            accuracy: 0.84
          },
          {
            userId: '5',
            name: 'Jordan Lee',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Jordan',
            totalScore: 1520,
            gamesPlayed: 10,
            averageScore: 152,
            accuracy: 0.76
          },
          {
            userId: '6',
            name: 'Morgan Taylor',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Morgan',
            totalScore: 1340,
            gamesPlayed: 9,
            averageScore: 148,
            accuracy: 0.74
          },
          {
            userId: '7',
            name: 'Riley Garcia',
            photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Riley',
            totalScore: 980,
            gamesPlayed: 7,
            averageScore: 140,
            accuracy: 0.70
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser]);

  const getSortedLeaderboard = () => {
    return [...leaderboard].sort((a, b) => b[sortBy] - a[sortBy]);
  };

  const getCurrentUserRank = () => {
    if (!currentUser) return null;
    
    const sortedList = getSortedLeaderboard();
    const rank = sortedList.findIndex(player => player.userId === currentUser.uid);
    
    if (rank === -1) return null;
    
    return {
      rank: rank + 1,
      total: sortedList.length,
      ...sortedList[rank]
    };
  };

  const getStatLabel = (key: string) => {
    switch (key) {
      case 'totalScore': return 'Total Score';
      case 'accuracy': return 'Accuracy';
      case 'averageScore': return 'Avg. Score';
      default: return '';
    }
  };

  const formatStatValue = (key: string, value: number) => {
    if (key === 'accuracy') {
      return `${Math.round(value * 100)}%`;
    }
    return value.toString();
  };

  const userRank = getCurrentUserRank();
  const sortedLeaderboard = getSortedLeaderboard();

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
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-heading mb-2">Global Leaderboard</h1>
          <p className="text-gray-600">See how you stack up against other players</p>
        </div>

        {currentUser && userRank && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-quiz-primary">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-quiz-primary">
                  <img 
                    src={userRank.photoURL || 'https://via.placeholder.com/64'} 
                    alt={userRank.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{userRank.name} <span className="text-gray-500 text-sm">(You)</span></h2>
                  <p className="text-gray-600">Rank: {userRank.rank} of {userRank.total}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-bold text-quiz-primary">{userRank[sortBy].toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">{getStatLabel(sortBy)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-quiz-primary" />
                <span>Top Players</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalScore">Total Score</SelectItem>
                    <SelectItem value="averageScore">Average Score</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-quiz-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedLeaderboard.map((player, index) => (
                  <div 
                    key={player.userId} 
                    className={`p-3 rounded-lg flex items-center ${
                      player.userId === currentUser?.uid ? 'bg-purple-50' : index % 2 === 0 ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="w-8 text-center font-bold">
                      {index === 0 ? (
                        <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                      ) : index === 1 ? (
                        <Medal className="h-5 w-5 text-gray-400 mx-auto" />
                      ) : index === 2 ? (
                        <Award className="h-5 w-5 text-amber-700 mx-auto" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1 ml-2">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img 
                          src={player.photoURL || 'https://via.placeholder.com/40'} 
                          alt={player.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">
                          {player.name}
                          {player.userId === currentUser?.uid && (
                            <span className="text-xs text-gray-500 ml-1">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.gamesPlayed} games played
                        </div>
                      </div>
                    </div>
                    <div className="text-right mr-2">
                      <div className="font-bold">{formatStatValue(sortBy, player[sortBy])}</div>
                      <div className="text-xs text-gray-500">{getStatLabel(sortBy)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center gap-2 bg-white rounded-lg px-4 py-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-quiz-primary" />
            <span>{leaderboard.length} players on the leaderboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
