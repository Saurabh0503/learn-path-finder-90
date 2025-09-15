import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BookOpen, Clock } from "lucide-react";

const Progress = () => {
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

        {/* Placeholder Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Stats Cards */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Courses Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <p className="text-sm text-muted-foreground">
                Complete your first course to see progress
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-success" />
                Learning Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success mb-2">0h</div>
              <p className="text-sm text-muted-foreground">
                Start watching videos to track time
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-warning" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning mb-2">0 days</div>
              <p className="text-sm text-muted-foreground">
                Learn daily to build your streak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Progress Area */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Progress tracking will appear here
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Learning to See Progress</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Once you begin taking courses and watching videos, you'll see detailed analytics about your learning journey, including completion rates, time spent, and skill development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;