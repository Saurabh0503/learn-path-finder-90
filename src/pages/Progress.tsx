import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { BarChart3, TrendingUp, BookOpen, Clock, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { getOverallProgressStats, getEnrolledCoursesWithProgress } from "@/services/progressService";
import { useToast } from "@/components/ui/use-toast";

interface ProgressStats {
  enrolledCourses: number;
  completedVideos: number;
  totalLearningHours: number;
  learningStreak: number;
}

interface CourseWithProgress {
  course_id: string;
  enrolled_at: string;
  courses: {
    id: string;
    title: string;
    description: string;
  };
  progress: {
    percent: number;
    completedCount: number;
    totalVideos: number;
  };
}

const Progress = () => {
  const [stats, setStats] = useState<ProgressStats>({
    enrolledCourses: 0,
    completedVideos: 0,
    totalLearningHours: 0,
    learningStreak: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        const [statsData, coursesData] = await Promise.all([
          getOverallProgressStats(),
          getEnrolledCoursesWithProgress()
        ]);
        
        setStats(statsData);
        setEnrolledCourses(coursesData);
      } catch (error) {
        console.error('Error loading progress data:', error);
        toast({
          title: "Error",
          description: "Failed to load progress data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-8 w-1/2"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-lg p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
              ))}
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
          <h1 className="text-4xl font-bold mb-2">Progress Tracking</h1>
          <p className="text-lg text-muted-foreground">
            Monitor your learning journey and achievements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                Enrolled Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">{stats.enrolledCourses}</div>
              <p className="text-sm text-muted-foreground">
                {stats.enrolledCourses === 0 ? "Enroll in your first course" : "Active courses"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="h-5 w-5 mr-2 text-success" />
                Videos Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success mb-2">{stats.completedVideos}</div>
              <p className="text-sm text-muted-foreground">
                {stats.completedVideos === 0 ? "Complete your first video" : "Videos watched"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-warning" />
                Learning Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning mb-2">{stats.totalLearningHours}h</div>
              <p className="text-sm text-muted-foreground">
                {stats.totalLearningHours === 0 ? "Start watching to track time" : "Estimated hours"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-accent" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">{stats.learningStreak} days</div>
              <p className="text-sm text-muted-foreground">
                {stats.learningStreak === 0 ? "Learn daily to build streak" : "Active days this month"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses Progress */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Courses Enrolled</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start by enrolling in a course to track your learning progress. Visit the Courses page to browse available content.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {enrolledCourses.map((course) => (
                  <div key={course.course_id} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{course.courses.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.courses.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enrolled on {new Date(course.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {course.progress.percent}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {course.progress.completedCount} / {course.progress.totalVideos} videos
                        </div>
                      </div>
                    </div>
                    <ProgressBar 
                      value={course.progress.percent} 
                      className="h-3"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;