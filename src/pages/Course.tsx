import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Users, Play } from "lucide-react";
import { getVideosForCourse } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

// Helper to sanitize YouTube ID
function extractVideoId(idOrUrl: string | undefined) {
  if (!idOrUrl) return "";
  const match = idOrUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : idOrUrl;
}

const Course = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get course data from location state
  const course = location.state?.course;

  useEffect(() => {
    if (!courseId) return;

    const loadCourseVideos = async () => {
      setLoading(true);
      try {
        console.log("🎯 Loading videos for course:", courseId);
        const courseVideos = await getVideosForCourse(courseId);
        console.log("📦 Videos returned for course:", courseId, courseVideos);
        setVideos(courseVideos);
      } catch (error) {
        console.error("Error loading course videos:", error);
        toast({
          title: "Error Loading Videos",
          description: "Failed to load course videos. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourseVideos();
  }, [courseId]);

  const handleWatchVideo = (video: any) => {
    const cleanId = extractVideoId(video.id);
    navigate(`/video/${cleanId}`, {
      state: {
        video,
        courseId: courseId,
        summary: video.summary,
        quiz: video.quiz,
      },
    });
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-background/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Course Info */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <img
              src={course.thumbnail || '/api/placeholder/400/300'}
              alt={course.title}
              className="w-64 h-48 object-cover rounded-lg shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">
                {course.description}
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline">
                  {course.level || 'Course'}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {course.instructor || 'AI Instructor'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {course.duration_hours ? `${course.duration_hours} hours` : 'Self-paced'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Course Videos</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading course videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">⚠️ No videos found for this course</h3>
              <p className="text-muted-foreground">
                Please add mappings in course_videos table to link videos to this course.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, index) => (
                <Card
                  key={video.id}
                  className="border-0 shadow-card hover:shadow-elevation transition-smooth group overflow-hidden cursor-pointer"
                  onClick={() => handleWatchVideo(video)}
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <Button size="sm" className="bg-background/90 text-foreground hover:bg-background">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-smooth">
                      {video.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {video.channel}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Course;
