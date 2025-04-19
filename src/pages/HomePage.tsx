
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Trophy, 
  Users, 
  Brain, 
  Zap, 
  Timer, 
  LogIn, 
  LogOut, 
  UserCircle 
} from 'lucide-react';

const HomePage = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-quiz-primary" />
            <h1 className="text-2xl font-bold gradient-heading">QuizArena AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {currentUser ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => logout()}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => loginWithGoogle()}
                className="quiz-button-primary flex items-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Login with Google</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-heading animate-fade-in">
              Test Your Knowledge in Real-Time
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto text-gray-700">
              Join multiplayer quiz games with AI-generated questions. Compete with friends, track your progress, and climb the global leaderboard!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {currentUser ? (
                <>
                  <Link to="/create">
                    <Button className="quiz-button-primary w-full sm:w-auto px-8 py-6 text-lg">Create Game</Button>
                  </Link>
                  <Link to="/join">
                    <Button className="quiz-button-secondary w-full sm:w-auto px-8 py-6 text-lg">Join Game</Button>
                  </Link>
                </>
              ) : (
                <Button 
                  onClick={() => loginWithGoogle()}
                  className="quiz-button-primary w-full sm:w-auto px-8 py-6 text-lg"
                >
                  Login to Start Playing
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Game Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="quiz-card p-6 flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-quiz-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Multiplayer Rooms</h3>
                <p className="text-gray-600">Create or join game rooms and play with friends in real-time.</p>
              </div>

              <div className="quiz-card p-6 flex flex-col items-center text-center">
                <Brain className="h-12 w-12 text-quiz-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Generated Questions</h3>
                <p className="text-gray-600">Dynamic questions across various categories powered by Gemini API.</p>
              </div>

              <div className="quiz-card p-6 flex flex-col items-center text-center">
                <Timer className="h-12 w-12 text-quiz-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Timed Rounds</h3>
                <p className="text-gray-600">Answer quickly to score more points in 15-second rounds.</p>
              </div>

              <div className="quiz-card p-6 flex flex-col items-center text-center">
                <Trophy className="h-12 w-12 text-quiz-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Leaderboard</h3>
                <p className="text-gray-600">Compete for the top spot and track your progress over time.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Challenge Your Friends?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700">
              Create a game room, invite your friends with a unique code, and start the quiz!
            </p>
            {currentUser && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/create">
                  <Button className="quiz-button-primary w-full sm:w-auto">Create a Game</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="outline" className="w-full sm:w-auto">View Leaderboard</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-quiz-primary mr-2" />
              <span className="font-bold">QuizArena AI</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-quiz-primary transition-colors">Home</Link>
              <Link to="/leaderboard" className="hover:text-quiz-primary transition-colors">Leaderboard</Link>
              {currentUser && (
                <Link to="/profile" className="hover:text-quiz-primary transition-colors">Profile</Link>
              )}
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-gray-400 text-sm">
            © 2025 QuizArena AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
