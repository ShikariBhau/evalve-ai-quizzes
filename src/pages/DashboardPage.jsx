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
        {/* Header */}
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back, {profile?.name || "Student"}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your progress and continue learning
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer rounded-2xl transition-all duration-200 hover:shadow-soft"
              onClick={() => navigate(action.url)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl p-3 ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.title === "Create Quiz"
                      ? "Design custom quizzes"
                      : action.title === "Join Quiz"
                      ? "Take available quizzes"
                      : "Generate AI-powered questions"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance Chart */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
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
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Target className="mx-auto h-8 w-8 mb-2" />
                    <p>No quiz attempts yet</p>
                    <p className="text-sm">Complete a quiz to see your progress</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="rounded-2xl">
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
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
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
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Trophy className="mx-auto h-8 w-8 mb-2" />
                    <p>No leaderboard data yet</p>
                    <p className="text-sm">Complete quizzes to see rankings</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((attempt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Quiz {attempts.length - index}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {attempt.quiz?.title || "Quiz"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {attempt.totalQuestions > 0
                          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {attempt.score}/{attempt.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weak Topics Alert */}
        {weakTopics.length > 0 && (
          <Card className="rounded-2xl border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900 dark:text-orange-100">
                  Areas for Improvement
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Focus on: {weakTopics.join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;