import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Star, MessageCircle, BookOpen } from "lucide-react";
import { VideoData } from "@/services/videoService";
import { markVideoComplete, saveQuizScore } from "@/services/progressService";
import { useToast } from "@/components/ui/use-toast";

function extractVideoId(idOrUrl: string | undefined) {
  if (!idOrUrl) return "";
  const match = idOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : idOrUrl;
}

const Video = () => {
  const { videoId: rawVideoId } = useParams();
  const videoId = extractVideoId(rawVideoId);

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [completingVideo, setCompletingVideo] = useState(false);
  const { toast } = useToast();

  // Get video data from location state
  const video = location.state?.video as VideoData;
  const summary = location.state?.summary;
  const quiz = location.state?.quiz;
  const courseId = location.state?.courseId;

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video not found</h2>
          <Button onClick={() => navigate("/courses")}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const isAnswerCorrect = (questionIndex: number, answerIndex: number) => {
    return quiz && quiz[questionIndex] && quiz[questionIndex].correct === answerIndex;
  };

  const isAnswerSelected = (questionIndex: number, answerIndex: number) => {
    return selectedAnswers[questionIndex] === answerIndex;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-success/10 text-success border-success/20";
      case "intermediate":
        return "bg-warning/10 text-warning border-warning/20";
      case "advanced":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const calculateQuizScore = () => {
    if (!quiz || quiz.length === 0) return 0;
    const correctAnswers = quiz.filter((question, index) =>
      selectedAnswers[index] === question.correct
    ).length;
    return Math.round((correctAnswers / quiz.length) * 10);
  };

  const handleMarkComplete = async () => {
    if (!video?.id || !courseId) {
      toast({
        title: "Error",
        description: "Missing video or course information",
        variant: "destructive",
      });
      return;
    }

    setCompletingVideo(true);

    try {
      await markVideoComplete(video.id, courseId);

      if (quiz && Object.keys(selectedAnswers).length > 0) {
        const score = calculateQuizScore();
        await saveQuizScore(video.id, courseId, score);
        toast({
          title: "Video Completed!",
          description: `Quiz score: ${score}/10. Great job!`,
        });
      } else {
        toast({
          title: "Video Completed!",
          description: "Keep up the great learning!",
        });
      }

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
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>

            {/* rest of your code unchanged ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
