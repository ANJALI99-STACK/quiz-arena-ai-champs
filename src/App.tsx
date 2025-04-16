
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinGame from "./pages/JoinGame";
import CreateGame from "./pages/CreateGame";
import GameLobby from "./pages/GameLobby";
import QuizGame from "./pages/QuizGame";
import GameResults from "./pages/GameResults";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { QuizProvider } from "./context/QuizContext";
import { SocketProvider } from "./context/SocketContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <QuizProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/join" element={<JoinGame />} />
                <Route path="/create" element={<CreateGame />} />
                <Route path="/lobby/:roomId" element={<GameLobby />} />
                <Route path="/game/:roomId" element={<QuizGame />} />
                <Route path="/results/:roomId" element={<GameResults />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QuizProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
