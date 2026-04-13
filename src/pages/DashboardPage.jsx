import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// FIXED: removed @ alias
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../integrations/api/client";
import { AppLayout } from "../components/AppLayout";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

import {
  PlusCircle,
  Users,
  Brain,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  Medal,
  AlertTriangle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function DashboardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const attemptsRes = await apiClient.getAttempts();
        const allAttempts = Array.isArray(attemptsRes) ? attemptsRes : (attemptsRes?.attempts || attemptsRes?.data || []);
        setAttempts(allAttempts);
        const userScores = new Map();

        allAttempts.forEach((attempt) => {
          const prev = userScores.get(attempt.userId) || {
            total: 0,
            questions: 0,
          };

          userScores.set(attempt.userId, {
            total: prev.total + attempt.score,
            questions: prev.questions + attempt.totalQuestions,
          });
        });

        const sorted = Array.from(userScores.entries())
          .map(([userId, scores]) => ({
            userId,
            score:
              scores.questions > 0
                ? Math.round((scores.total / scores.questions) * 100)
                : 0,
          }))
          .sort((a, b) => b.score - a.score);

        setLeaderboard(
          sorted.slice(0, 5).map((entry, index) => ({
            rank: index + 1,
            name:
              entry.userId === user.id
                ? profile?.name || "You"
                : `User ${entry.userId.slice(0, 8)}`,
            score: entry.score,
          }))
        );

        const myEntry = sorted.find(
          (entry) => entry.userId === user.id
        );

        setUserRank(
          myEntry ? sorted.indexOf(myEntry) + 1 : null
        );

        setActiveQuizzes([]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, profile?.name]);

  const totalQuizzes = attempts.length;
  const totalCorrect = attempts.reduce(
    (sum, a) => sum + a.score,
    0
  );

  const totalQuestions = attempts.reduce(
    (sum, a) => sum + a.totalQuestions,
    0
  );

  const avgScore =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const bestScore =
    attempts.length > 0
      ? Math.max(
          ...attempts.map((a) =>
            a.totalQuestions > 0
              ? Math.round((a.score / a.totalQuestions) * 100)
              : 0
          )
        )
      : 0;

  const chartData = attempts.map((a, i) => ({
    name: `Quiz ${i + 1}`,
    score:
      a.totalQuestions > 0
        ? Math.round((a.score / a.totalQuestions) * 100)
        : 0,
  }));

  const recentActivity = [...attempts].reverse().slice(0, 5);

  const topicScores = new Map();

  attempts.forEach((attempt) => {
    const topic = attempt.quiz?.topic || "General";
    const prev = topicScores.get(topic) || { correct: 0, total: 0 };

    topicScores.set(topic, {
      correct: prev.correct + attempt.score,
      total: prev.total + attempt.totalQuestions,
    });
  });

  const weakTopics = Array.from(topicScores.entries())
    .filter(
      ([, s]) => s.total > 0 && s.correct / s.total < 0.6
    )
    .map(([topic]) => topic);

  const stats = [
    {
      label: "Quizzes Attempted",
      value: totalQuizzes,
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Average Score",
      value: `${avgScore}%`,
      icon: Target,
      color: "bg-secondary/10 text-secondary",
    },
    {
      label: "Best Score",
      value: `${bestScore}%`,
      icon: TrendingUp,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "Current Rank",
      value: userRank ? `#${userRank}` : "—",
      icon: Trophy,
      color:
        "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    },
  ];

  const quickActions = [
    ...(profile?.role === "teacher"
      ? [
          {
            title: "Create Quiz",
            icon: PlusCircle,
            url: "/create-quiz",
            color: "bg-primary/10 text-primary",
          },
        ]
      : []),
    {
      title: "Join Quiz",
      icon: Users,
      url: "/join-quiz",
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "AI Practice",
      icon: Brain,
      url: "/create-quiz?ai=true",
      color: "bg-accent/10 text-accent",
    },
  ];

  const getRankIcon = (rank) => {
    if (rank === 1)
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2)
      return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (rank === 3)
      return <Medal className="h-4 w-4 text-orange-500" />;
    return (
      <span className="text-xs font-medium text-muted-foreground">
        #{rank}
      </span>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Welcome back, {profile?.name || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your learning progress and quick actions.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="rounded-2xl border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Performance Chart */}
          <Card className="lg:col-span-2 rounded-2xl border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No quiz attempts yet. Start your learning journey!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.url)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-soft ${action.color} border-border hover:border-primary/30`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="font-medium">{action.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard */}
          <Card className="rounded-2xl border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.name === (profile?.name || "You")
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <Badge variant="secondary">{entry.score}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No leaderboard data yet. Be the first to take a quiz!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          Quiz {attempt.quiz?.title || `Attempt #${attempt.id?.slice(-4)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {attempt.totalQuestions} questions
                        </p>
                      </div>
                      <Badge
                        variant={
                          (attempt.score / attempt.totalQuestions) >= 0.8
                            ? "default"
                            : (attempt.score / attempt.totalQuestions) >= 0.6
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {attempt.totalQuestions > 0
                          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                          : 0
                        }%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No recent activity. Start taking quizzes to see your progress!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weak Topics Alert */}
        {weakTopics.length > 0 && (
          <Card className="rounded-2xl border-0 shadow-soft border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    Areas for Improvement
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    You might want to focus on: {weakTopics.join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;