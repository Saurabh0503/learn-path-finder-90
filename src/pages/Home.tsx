import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Users, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Home = () => {
  const [searchTopic, setSearchTopic] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const navigate = useNavigate();

  const learningLevels = [
    { id: "beginner", label: "Beginner", description: "Start from scratch", icon: "🌱" },
    { id: "intermediate", label: "Intermediate", description: "Build on basics", icon: "🚀" },
    { id: "advanced", label: "Advanced", description: "Master complex topics", icon: "⚡" },
  ];

  const handleStartLearning = () => {
    if (!searchTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic you'd like to learn about.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedLevel) {
      toast({
        title: "Level Required", 
        description: "Please select your learning level.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Learning Path Created!",
      description: `Starting ${selectedLevel} level learning for: ${searchTopic}`,
    });
    
    navigate("/learning-path");
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-primary-foreground md:text-6xl">
              Learn Anything, 
              <br />
              <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                Anytime
              </span>
            </h1>
            <p className="mb-12 text-xl text-primary-foreground/90 md:text-2xl">
              Discover personalized learning paths tailored to your goals and skill level
            </p>

            {/* Search Section */}
            <div className="mx-auto max-w-2xl">
              <Card className="border-0 bg-background/95 p-6 shadow-elevation backdrop-blur">
                <CardContent className="p-0">
                  <div className="mb-6">
                    <label htmlFor="search" className="mb-2 block text-left text-sm font-medium">
                      What would you like to learn today?
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="e.g., JavaScript, Machine Learning, Photography..."
                        value={searchTopic}
                        onChange={(e) => setSearchTopic(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="mb-3 block text-left text-sm font-medium">
                      Choose your learning level
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {learningLevels.map((level) => (
                        <Card
                          key={level.id}
                          className={`cursor-pointer border-2 transition-smooth hover:shadow-card ${
                            selectedLevel === level.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedLevel(level.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="mb-2 text-2xl">{level.icon}</div>
                            <h3 className="mb-1 font-semibold">{level.label}</h3>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleStartLearning}
                    size="lg"
                    className="w-full bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Start Learning Journey
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose LearnHub?</h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Experience personalized learning like never before
            </p>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-0 shadow-card hover:shadow-elevation transition-smooth">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Personalized Paths</h3>
                  <p className="text-muted-foreground">
                    Custom learning journeys based on your skill level and goals
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card hover:shadow-elevation transition-smooth">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                      <Users className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Expert Content</h3>
                  <p className="text-muted-foreground">
                    Learn from industry experts and proven methodologies
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card hover:shadow-elevation transition-smooth">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                      <Award className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Track Progress</h3>
                  <p className="text-muted-foreground">
                    Monitor your learning journey with detailed analytics
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;