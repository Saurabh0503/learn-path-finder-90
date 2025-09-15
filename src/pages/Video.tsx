import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Star, MessageCircle, BookOpen } from "lucide-react";
import { VideoData } from "@/services/videoService";

const Video = () => {
  const { videoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});

  // Get video data from location state
  const video = location.state?.video as VideoData;
  const summary = location.state?.summary;
  const quiz = location.state?.quiz;

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

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
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

            {/* Video Metadata */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{video.title}</CardTitle>
                    <p className="text-muted-foreground mb-3">{video.channel}</p>
                    <div className="flex items-center gap-3">
                      <Badge className={getDifficultyColor(video.difficulty)}>
                        {video.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-4 w-4 mr-1 text-warning fill-warning" />
                        Rank #{video.rank}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Summary Section */}
            {summary && (
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Video Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Quiz Section */}
            {quiz && quiz.length > 0 && (
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Knowledge Check</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test your understanding with these questions
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {quiz.map((question, questionIndex) => (
                    <div key={questionIndex} className="space-y-3">
                      <h4 className="font-medium">
                        {questionIndex + 1}. {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                            className={`w-full text-left p-3 rounded-lg border transition-smooth ${
                              selectedAnswers[questionIndex] === optionIndex
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <span className="inline-flex items-center">
                              <span className="w-6 h-6 rounded-full border border-current mr-3 flex items-center justify-center text-xs">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mark Complete */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce">
                  Mark as Completed
                </Button>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Star className="h-5 w-5 mr-2" />
                  Ratings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Rate this video to help improve recommendations
                </p>
                <div className="flex justify-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-6 w-6 text-muted-foreground hover:text-warning cursor-pointer transition-smooth"
                    />
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  Submit Rating
                </Button>
              </CardContent>
            </Card>

            {/* Comments / Community */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments / Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Join the discussion with other learners
                </p>
                <Button variant="outline" className="w-full mb-2">
                  View Comments
                </Button>
                <Button variant="outline" className="w-full">
                  Add Comment
                </Button>
              </CardContent>
            </Card>

            {/* Related Videos */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Related Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Continue your learning journey with related content
                </p>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer">
                      <div className="w-12 h-8 bg-muted rounded flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          Related video title {item}
                        </p>
                        <p className="text-xs text-muted-foreground">Channel Name</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Related
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;