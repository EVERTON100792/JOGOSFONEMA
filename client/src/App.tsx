import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import PhonemeGame from "@/pages/phoneme-game";
import AudioManager from "@/pages/audio-manager";
import TeacherLogin from "@/pages/teacher-login";
import StudentLogin from "@/pages/student-login";
import TeacherDashboard from "@/pages/teacher-dashboard";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { user, isLoading, isTeacher, isStudent } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/teacher-login" component={TeacherLogin} />
      <Route path="/student-login" component={StudentLogin} />
      
      {/* Teacher routes */}
      {isTeacher && <Route path="/dashboard" component={TeacherDashboard} />}
      {isTeacher && <Route path="/audio-manager" component={AudioManager} />}
      
      {/* Game routes */}
      <Route path="/" component={PhonemeGame} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
