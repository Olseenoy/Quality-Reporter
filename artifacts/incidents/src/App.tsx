import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { IncidentsList } from "@/pages/IncidentsList";
import { IncidentDetail } from "@/pages/IncidentDetail";
import { IncidentCreate } from "@/pages/IncidentCreate";
import { useGetCurrentUser } from "@workspace/api-client-react";

const queryClient = new QueryClient();

// AuthGuard component to protect routes
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  }, [isLoading, isError, user, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isError || !user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes */}
      <Route path="/">
        <AuthGuard>
          <Shell>
            <Dashboard />
          </Shell>
        </AuthGuard>
      </Route>
      <Route path="/incidents">
        <AuthGuard>
          <Shell>
            <IncidentsList />
          </Shell>
        </AuthGuard>
      </Route>
      <Route path="/my-incidents">
        <AuthGuard>
          <Shell>
            <IncidentsList mineOnly />
          </Shell>
        </AuthGuard>
      </Route>
      <Route path="/assigned-to-me">
        <AuthGuard>
          <Shell>
            <IncidentsList assignedToMe />
          </Shell>
        </AuthGuard>
      </Route>
      <Route path="/incidents/new">
        <AuthGuard>
          <Shell>
            <IncidentCreate />
          </Shell>
        </AuthGuard>
      </Route>
      <Route path="/incidents/:id">
        <AuthGuard>
          <Shell>
            <IncidentDetail />
          </Shell>
        </AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
