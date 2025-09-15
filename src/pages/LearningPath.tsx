import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, CheckCircle } from "lucide-react";

const LearningPath = () => {
  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">Your Learning Path</h1>
          <p className="text-xl text-muted-foreground">
            Videos and interactive content will be shown here
          </p>
        </div>

        {/* Learning Progress */}
        <Card className="mb-8 border-0 bg-gradient-primary shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-primary-foreground">
              <div>
                <h3 className="text-xl font-semibold">JavaScript Fundamentals</h3>
                <p className="text-primary-foreground/80">Beginner Level</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">3/12</div>
                <p className="text-sm text-primary-foreground/80">Lessons Complete</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-primary-foreground/20">
              <div className="h-full w-1/4 rounded-full bg-primary-foreground"></div>
            </div>
          </CardContent>
        </Card>

        {/* Video Placeholder Section */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    Current Lesson
                  </CardTitle>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-4">
                  <div className="text-center">
                    <PlayCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Video Player</h3>
                    <p className="text-muted-foreground">
                      Interactive video content will be displayed here
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      15:30
                    </div>
                    <Badge variant="outline">Beginner</Badge>
                  </div>
                  <Button>Continue Learning</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Outline */}
          <div>
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Course Outline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { title: "Introduction to JavaScript", duration: "12 min", completed: true },
                    { title: "Variables and Data Types", duration: "18 min", completed: true },
                    { title: "Functions and Scope", duration: "22 min", completed: true },
                    { title: "Control Flow", duration: "15 min", completed: false, current: true },
                    { title: "Objects and Arrays", duration: "25 min", completed: false },
                    { title: "DOM Manipulation", duration: "20 min", completed: false },
                  ].map((lesson, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-smooth cursor-pointer hover:bg-accent ${
                        lesson.current ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.completed ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <div className={`h-5 w-5 rounded-full border-2 ${
                            lesson.current ? "border-primary" : "border-muted-foreground/30"
                          }`} />
                        )}
                        <div>
                          <p className={`font-medium ${lesson.current ? "text-primary" : ""}`}>
                            {lesson.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;