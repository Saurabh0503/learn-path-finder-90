console.log("🔥 Courses.tsx file loaded");

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Star, Users, RefreshCw, Loader2, Play } from "lucide-react";
import { fetchVideos, VideoData } from "@/services/videoService";
import { useVideoCache } from "@/contexts/VideoCacheContext";
import { safeString, safeLowerCase } from "@/utils/safeString";
import { toast } from "@/components/ui/use-toast";
import { markVideoCompleted } from "@/services/progressService";

// 🔑 helper to sanitize YouTube ID
function extractVideoId(idOrUrl: string | undefined) {
  if (!idOrUrl) return "";
  const match = idOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : idOrUrl;
}

const Courses = () => {
  console.log("🎬 Courses page mounted");
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  const { getCachedVideos, setCachedVideos, clearCache } = useVideoCache();
  
  const topic = searchParams.get("topic");
  const goal = searchParams.get("goal");
  
  // Generate a courseId based on topic and goal for progress tracking
  const courseId = topic && goal ? `${safeLowerCase(topic).replace(/\s+/g, '-')}-${safeLowerCase(goal)}` : null;

  const loadVideos = async (forceRefresh = false) => {
    if (!topic || !goal) {
      navigate("/");
      return;
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedVideos = getCachedVideos(topic, goal);
      if (cachedVideos) {
        setVideos(cachedVideos);
        return;
      }
    }

    console.log("➡️ loadVideos called with:", { topic, goal, forceRefresh });
    setLoading(true);
    try {
      console.log("📡 About to call fetchVideos with:", { topic, goal, forceRefresh });
      const response = await fetchVideos({ topic, goal });
      console.log("✅ fetchVideos result returned to Courses:", response);
      console.log("✅ Data received from super-task:", response);
      setVideos(response.videos);
      // Cache the fetched videos
      setCachedVideos(topic, goal, response.videos);
    } catch (error) {
      toast({
        title: "Error Loading Courses",
        description: "Failed to fetch learning content. Please try again.",
        variant: "destructive",
      });
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleRefresh = () => {
    if (topic && goal) {
      clearCache(topic, goal);
      loadVideos(true);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered with topic:", topic, "goal:", goal);
    loadVideos();
  }, [topic, goal, navigate]);

  // 🔑 use sanitized ID here
  const handleWatchVideo = (video: VideoData) => {
    const cleanId = extractVideoId(video.id);

    navigate(`/video/${cleanId}`, {
      state: {
        video,
        summary: video.summary,
        quiz: video.quiz,
        courseId: courseId, // Pass courseId for progress tracking
      },
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Loading Learning Content</h2>
              <p className="text-muted-foreground">Curating the best videos for {topic}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="mb-4 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">{topic} Courses</h1>
          <p className="text-lg text-muted-foreground mb-4">
            {goal?.charAt(0).toUpperCase() + goal?.slice(1)} level learning path
          </p>
          <Badge variant="outline" className="text-sm">
            {videos.length} course{videos.length !== 1 ? "s" : ""} found
          </Badge>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Learning Path Being Prepared</h3>
            <p className="text-muted-foreground mb-4">
              We're curating the best {topic} content for {goal} level learners.
            </p>
            <p className="text-sm text-muted-foreground">
              This topic has been added to our generation queue. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => {
              const isCompleted = !!video.completed;
              return (
                <Card
                  key={video.id}
                  className="border-0 shadow-card hover:shadow-elevation transition-smooth group overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <Button size="sm" className="bg-background/90 text-foreground hover:bg-background" onClick={() => handleWatchVideo(video)}>
                        <Play className="h-4 w-4 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className={getDifficultyColor(video.difficulty)}>
                        {video.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-smooth">
                      {video.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {video.channel}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-warning fill-warning" />
                        <span>#{video.rank}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={() => handleWatchVideo(video)} className="w-full bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce">
                        <Play className="h-4 w-4 mr-2" />
                        Start Learning
                      </Button>
                      
                      <Button
                        variant={isCompleted ? "default" : "outline"}
                        className={`w-full ${isCompleted ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={async () => {
                          if (isCompleted) {
                            toast({ title: "Already completed", description: "This video is already marked completed." });
                            return;
                          }
                          try {
                            const { data, error } = await markVideoCompleted(video.id);
                            if (error) {
                              console.error("Error marking completed:", error);
                              toast({ title: "Error", description: error?.message || "Failed to mark completed." });
                              return;
                            }
                            // Update local UI state
                            setVideos((prev) => prev.map((p) => (p.id === video.id ? { ...p, completed: true } : p)));
                            toast({ title: "Marked completed", description: "Quizzes are now available for this video." });
                          } catch (err) {
                            console.error(err);
                            toast({ title: "Error", description: "Failed to mark completed." });
                          }
                        }}
                      >
                        {isCompleted ? "Completed ✅" : "Mark as completed"}
                      </Button>
                    </div>

                    {/* Show quizzes ONLY after completion */}
                    {isCompleted && Array.isArray(video.quizzes) && video.quizzes.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-3">Quizzes</h4>
                        <div className="space-y-3">
                          {video.quizzes.map((q, qi) => (
                            <div key={qi} className="p-3 border rounded-lg bg-muted/20">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {q.difficulty}
                                </Badge>
                              </div>
                              <div className="font-medium text-sm mb-2">{q.question}</div>
                              <details className="text-sm">
                                <summary className="cursor-pointer text-primary hover:underline">
                                  Show answer
                                </summary>
                                <div className="mt-2 p-2 bg-background rounded border">
                                  {q.answer}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
