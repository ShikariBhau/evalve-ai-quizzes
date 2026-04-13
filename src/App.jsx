import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

// FIXED: removed @ alias
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "\./contexts/ThemeContext";

// IMPORTANT: use default import (most cases)
import ProtectedRoute from "\./components/ProtectedRoute";

// Pages
import LoginPage from "\./pages/LoginPage";
import SignupPage from "\./pages/SignupPage";
import DashboardPage from "\./pages/DashboardPage";
import CreateQuizPage from "\./pages/CreateQuizPage";
import JoinQuizPage from "\./pages/JoinQuizPage";
import QuizAttemptPage from "\./pages/QuizAttemptPage";
import LeaderboardPage from "\./pages/LeaderboardPage";
import AnalyticsPage from "\./pages/AnalyticsPage";
import ProfilePage from "\./pages/ProfilePage";
import NotFound from "\./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>

                {/* FIXED: safer default route */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/create-quiz"
                  element={
                    <ProtectedRoute>
                      <CreateQuizPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/join-quiz"
                  element={
                    <ProtectedRoute>
                      <JoinQuizPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/quiz/:quizId"
                  element={
                    <ProtectedRoute>
                      <QuizAttemptPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <LeaderboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />

              </Routes>
            </BrowserRouter>

          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
