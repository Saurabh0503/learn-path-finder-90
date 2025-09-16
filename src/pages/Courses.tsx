import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Star, Loader2 } from "lucide-react";
import { fetchVideos, VideoData } from "@/services/videoService";
import { toast } from "@/hooks/use-toast";

// 🔑 helper to sanitize YouTube ID
function extractVideoId(idOrUrl: string | undefined) {
  if (!idOrUrl) return "";
  const match = idOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : idOrUrl;
}

const Courses = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const topic = searchParams.get("topic");
  const goal = searchParams.get("goal");
  
  // Generate a courseId based on topic and goal for progress tracking
  const courseId = topic && goal ? `${topic.toLowerCase().replace(/\s+/g, '-')}-${goal.toLowerCase()}` : null;

  useEffect(() => {
    const loadVideos = async () => {
      if (!topic || !goal) {
        navigate("/");
        return;
      }

      setLoading(true);
      try {
        const response = await fetchVideos({ topic, goal });
        setVideos(response.videos);
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
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              ← Back to Home
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {topic} Courses
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {goal?.charAt(0).toUpperCase() + goal?.slice(1)} level learning path
          </p>
          <Badge variant="outline" className="text-sm">
            {videos.length} course{videos.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try searching for a different topic or adjust your learning level.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
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
                    <Button
                      size="sm"
                      className="bg-background/90 text-foreground hover:bg-background"
                      onClick={() => handleWatchVideo(video)}
                    >
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

                  <Button
                    onClick={() => handleWatchVideo(video)}
                    className="w-full bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
