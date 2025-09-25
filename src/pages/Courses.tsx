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
import { markVideoCompleted, getCoursesByTopicAndGoal, getAllCourses } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

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
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getCachedVideos, setCachedVideos, clearCache } = useVideoCache();
  
  const topic = searchParams.get("topic");
  const goal = searchParams.get("goal");
  
  // Generate a courseId based on topic and goal for progress tracking
  const courseId = topic && goal ? `${safeLowerCase(topic).replace(/\s+/g, '-')}-${safeLowerCase(goal)}` : null;

  const loadCourses = async (forceRefresh = false) => {
    console.log("➡️ loadCourses called with topic:", topic, "goal:", goal, "forceRefresh:", forceRefresh);
    setLoading(true);
    try {
      let fetchedCourses = [];
      
      if (topic && goal) {
        // Fetch courses filtered by topic and goal
        fetchedCourses = await getCoursesByTopicAndGoal(topic, goal);
        console.log("📦 Courses returned from Supabase for topic/goal:", { topic, goal, courses: fetchedCourses });
      } else {
        // Fallback: get all courses
        fetchedCourses = await getAllCourses();
        console.log("📦 All courses returned from Supabase:", fetchedCourses);
      }
      
      setCourses(fetchedCourses);
      
      // Show fallback message if no courses found
      if (fetchedCourses.length === 0 && topic && goal) {
        toast({
          title: "⚠️ No curated courses found",
          description: `No courses found for ${topic} ${goal}. Please add them to the courses table in Supabase.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      toast({
        title: "Error Loading Courses",
        description: "Failed to fetch courses. Please try again.",
        variant: "destructive",
      });
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleRefresh = () => {
    loadCourses(true);
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered with topic:", topic, "goal:", goal);
    loadCourses();
  }, [topic, goal]);

  // Navigate to individual course page (we'll create this route later)
  const handleViewCourse = (course: any) => {
    navigate(`/course/${course.id}`, {
      state: { course }
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
            {courses.length} course{courses.length !== 1 ? "s" : ""} found
          </Badge>
        </div>

        {/* Videos Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">⚠️ No curated courses found</h3>
            <p className="text-muted-foreground mb-4">
              {topic && goal 
                ? `No courses found for ${topic} ${goal}. Please add them to the courses table in Supabase.`
                : "No courses available at the moment."
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later or try different search criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              return (
                <Card
                  key={course.id}
                  className="border-0 shadow-card hover:shadow-elevation transition-smooth group overflow-hidden cursor-pointer"
                  onClick={() => handleViewCourse(course)}
                >
                  <div className="relative">
                    <img
                      src={course.thumbnail || '/api/placeholder/300/200'}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <Button size="sm" className="bg-background/90 text-foreground hover:bg-background">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Course
                      </Button>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className={getDifficultyColor(course.level)}>
                        {course.level || 'Course'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-smooth">
                      {course.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {course.instructor || 'AI Instructor'}
                      </span>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{course.duration_hours ? `${course.duration_hours}h` : 'Self-paced'}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <Button className="w-full bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Start Course
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
      </div>
    </div>
  );
};

export default Courses;
