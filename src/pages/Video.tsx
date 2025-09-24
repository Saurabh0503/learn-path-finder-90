import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
      }
    };
    
    getCurrentUser();
  }, [videoUrl]);

  // Load quizzes directly from Supabase using videoId
  useEffect(() => {
    const loadQuizzes = async () => {
      if (!videoId) return;
      
      setLoadingQuizzes(true);
      try {
        // Fetch quizzes from Supabase using videoId
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("video_id", videoId);
        
        // Debug log the fetch results
        console.log("🐛 Supabase quiz fetch:", { videoId, data, error });
        
        if (error) {
          console.error("Error fetching quizzes:", error);
          setQuizzes([]);
          return;
        }
        
        // Normalize quiz data by flattening questions arrays
        const normalizedQuizzes = (data || [])
          .flatMap((quiz: any) => {
            // If quiz has questions array, flatten it
            if (Array.isArray(quiz.questions)) {
              return quiz.questions.map((q: any) => ({
                question: q.question,
                answer: q.answer
              }));
            }
            // If quiz itself has question/answer, use it directly
            if (quiz.question && quiz.answer) {
              return [{
                question: quiz.question,
                answer: quiz.answer
              }];
            }
            return [];
          })
          .filter(q => q && q.question && q.answer); // Filter out invalid entries
        
        // Debug log normalized results
        console.log("✅ Normalized quizzes:", normalizedQuizzes);
        
        setQuizzes(normalizedQuizzes);
      } catch (error) {
        console.error("Error loading quizzes:", error);
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    
    loadQuizzes();
  }, [videoId]);

  // Show toast if redirected from courses page after completion
  useEffect(() => {
    if (location.state?.fromCompletion) {
      toast({
        title: "Video marked completed!",
        description: "Your progress has been saved successfully.",
      });
    }
  }, [location.state?.fromCompletion, toast]);

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
      await markVideoCompleted(video?.id || videoId || '', courseId);

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
        description: "Your progress has been saved successfully.",
      });

      setIsCompleted(true);
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
                      {isCompleted ? "You've completed this video!" : "Mark this video as completed to track your progress"}
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
                {loadingQuizzes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading quizzes...</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-semibold mt-6 mb-2">📘 Quiz</h2>
                    {quizzes.length === 0 ? (
                      <p className="text-muted-foreground">No quizzes available for this video.</p>
                    ) : (
                      <div className="space-y-3">
                        {quizzes.map((quiz, index) => (
                          <Collapsible key={index}>
                            <CollapsibleTrigger className="font-medium text-left w-full p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              {quiz.question}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="text-sm text-muted-foreground p-3 border-l-2 border-primary/20 ml-3 mt-2">
                              {quiz.answer}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
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
