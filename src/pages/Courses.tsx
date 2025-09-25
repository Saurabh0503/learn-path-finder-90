console.log("🔥 Courses.tsx file loaded");

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";


const Courses = () => {
  console.log("🎬 Courses page mounted");
  
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCourses = async (forceRefresh = false) => {
    console.log("➡️ Loading all courses");
    setLoading(true);
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      console.log("📦 Courses loaded:", courses?.length || 0);
      setCourses(courses || []);
      
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
    loadCourses();
  }, []);

  // Navigate to individual course page (we'll create this route later)
  const handleViewCourse = (course: any) => {
    navigate(`/course/${course.id}`, {
      state: { course }
    });
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    const safeDifficulty = (difficulty || '').toLowerCase();
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
              <p className="text-muted-foreground">Loading courses...</p>
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
          <h1 className="text-4xl font-bold mb-2">All Courses</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Curated learning paths for various topics
          </p>
          <Badge variant="outline" className="text-sm">
            {courses.length} course{courses.length !== 1 ? "s" : ""} found
          </Badge>
        </div>

        {/* Videos Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">⚠️ No courses found</h3>
            <p className="text-muted-foreground mb-4">
              No courses available at the moment. Please add them to the courses table in Supabase.
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
