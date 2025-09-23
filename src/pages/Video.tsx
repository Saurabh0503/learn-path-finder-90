import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Star, MessageCircle, BookOpen, Play, Lock } from "lucide-react";
import { VideoData } from "@/services/videoService";
import { markVideoComplete, saveQuizScore, markVideoCompleted } from "@/services/progressService";
import { getQuizzesByVideo, isVideoCompleted, Quiz } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { safeString, safeLowerCase, safeVideoNormalize, videoDefaults } from "@/utils/safeString";

const Video = () => {
  const { videoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [completingVideo, setCompletingVideo] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Get video data from location state with safe defaults
  const rawVideo = location.state?.video as VideoData;
  const video = rawVideo ? safeVideoNormalize(rawVideo) : null;
  const summary = safeString(location.state?.summary);
  const quiz = Array.isArray(location.state?.quiz) ? location.state.quiz : videoDefaults.quizzes;
  const courseId = safeString(location.state?.courseId);
  
  // videoId is now guaranteed to be a clean YouTube ID from videoService
  console.log("🎥 Embedding videoId:", videoId);

  // Construct video URL from video ID
  const videoUrl = video?.id ? `https://www.youtube.com/watch?v=${video.id}` : '';

  // Get current user and check completion status
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && videoUrl) {
        const completed = await isVideoCompleted(user.id, videoUrl);
        setIsCompleted(completed);
        
        // If already completed, load quizzes
        if (completed) {
          await loadQuizzes();
        }
      }
    };
    
    getCurrentUser();
  }, [videoUrl]);

  // Show toast if redirected from courses page after completion
  useEffect(() => {
    if (location.state?.fromCompletion) {
      toast({
        title: "Video marked completed. Quiz unlocked!",
        description: "You can now access the quiz below the video.",
      });
    }
  }, [location.state?.fromCompletion, toast]);

  // Load quizzes for the video
  const loadQuizzes = async () => {
    if (!videoUrl) return;
    
    setLoadingQuizzes(true);
    try {
      const searchTerm = location.state?.searchTerm;
      const learningGoal = location.state?.learningGoal;
      const fetchedQuizzes = await getQuizzesByVideo(videoUrl, searchTerm, learningGoal);
      setQuizzes(fetchedQuizzes);
      console.log("✅ Quiz unlocked for video:", video?.id || videoId);
    } catch (error: any) {
      console.error('Error loading quizzes:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message?.includes('schema') 
        ? "Database schema mismatch detected. Please contact support."
        : "Failed to load quizzes. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingQuizzes(false);
    }
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video not found</h2>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const isAnswerCorrect = (questionIndex: number, answerIndex: number) =>
    quiz && quiz[questionIndex] && quiz[questionIndex].correct === answerIndex;

  const isAnswerSelected = (questionIndex: number, answerIndex: number) =>
    selectedAnswers[questionIndex] === answerIndex;

  const getDifficultyColor = (difficulty?: string | null) => {
    const safeDifficulty = safeLowerCase(difficulty);
    switch (safeDifficulty) {
      case "beginner":
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "intermediate":
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "advanced":
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const calculateQuizScore = () => {
    if (!quiz || quiz.length === 0) return 0;
    const correctAnswers = quiz.filter((question, index) => selectedAnswers[index] === question.correct).length;
    return Math.round((correctAnswers / quiz.length) * 10);
  };

  const handleMarkComplete = async () => {
    if (!currentUser || !videoUrl) {
      toast({
        title: "Error",
        description: "Missing user or video information",
        variant: "destructive",
      });
      return;
    }

    setCompletingVideo(true);

    try {
      // Mark video as completed in the user_progress table
      await markVideoCompleted(video?.id || videoId || '');

      // Also mark in the existing user_progress table if courseId exists
      if (video?.id && courseId) {
        await markVideoComplete(video.id, courseId);
        
        if (quiz && Object.keys(selectedAnswers).length > 0) {
          const score = calculateQuizScore();
          await saveQuizScore(video.id, courseId, score);
        }
      }

      toast({
        title: "Video Completed! ✅",
        description: "Quizzes are now unlocked for this video.",
      });

      setIsCompleted(true);
      
      // Load quizzes after marking as complete
      await loadQuizzes();
    } catch (error) {
      console.error("Error marking video complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark video as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompletingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-card overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${safeString(video?.id)}?rel=0`}
                  title={safeString(video?.title) || 'Video'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>

            {/* Mark as Completed Button */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Video Progress</h3>
                    <p className="text-muted-foreground">
                      {isCompleted ? "You've completed this video!" : "Mark this video as completed to unlock quizzes"}
                    </p>
                  </div>
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isCompleted || completingVideo}
                    className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {completingVideo ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed ✅
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isCompleted ? (
                  <div className="text-center py-8">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Complete the video to unlock quizzes
                    </p>
                  </div>
                ) : loadingQuizzes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading quizzes...</p>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No quizzes available for this video yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz, index) => {
                      const safeQuiz = {
                        difficulty: safeString(quiz?.difficulty) || videoDefaults.difficulty,
                        question: safeString(quiz?.question) || 'No question available',
                        answer: safeString(quiz?.answer) || 'No answer available'
                      };
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-sm">Question {index + 1}</h4>
                            <Badge 
                              variant="outline" 
                              className={getDifficultyColor(safeQuiz.difficulty)}
                            >
                              {safeQuiz.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm mb-3 leading-relaxed">{safeQuiz.question}</p>
                          <div className="bg-muted/30 rounded-md p-3">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                            <p className="text-sm">{safeQuiz.answer}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video Info */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {safeString(video?.title) || 'Untitled Video'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">
                    {safeString(video?.channel) || 'Unknown Channel'}
                  </span>
                </div>
                <Badge variant="outline" className={getDifficultyColor(video?.difficulty)}>
                  {safeString(video?.difficulty) || videoDefaults.level}
                </Badge>
                {summary && (
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
