import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, BookOpen, Award, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { getOverallProgressStats } from "@/services/progressService";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedVideos: 0,
    totalLearningHours: 0,
    learningStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch progress stats
        const progressStats = await getOverallProgressStats();
        setStats(progressStats);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your learning profile and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">
                  {profile?.full_name || user?.email || "Anonymous User"}
                </h3>
                <p className="text-muted-foreground mb-4">Learning Enthusiast</p>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Learning Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Stats */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Learning Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-primary/5">
                    <div className="text-2xl font-bold text-primary">{stats.enrolledCourses}</div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-primary/5">
                    <div className="text-2xl font-bold text-success">{stats.totalLearningHours}h</div>
                    <div className="text-sm text-muted-foreground">Watch Time</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-primary/5">
                    <div className="text-2xl font-bold text-warning">{stats.completedVideos}</div>
                    <div className="text-sm text-muted-foreground">Videos</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-primary/5">
                    <div className="text-2xl font-bold text-primary">{stats.learningStreak}</div>
                    <div className="text-sm text-muted-foreground">Streak Days</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Achievements & Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">
                    Complete courses and reach milestones to earn badges and achievements
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information Placeholder */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Profile information will appear here</CardTitle>
              </CardHeader>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Add your learning goals, interests, and preferences to get personalized course recommendations and track your progress effectively.
                  </p>
                  <Button className="bg-gradient-primary shadow-button hover:shadow-lg hover:scale-[1.02] transition-bounce">
                    Set Up Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;