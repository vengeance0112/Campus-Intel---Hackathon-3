import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Predictor from "@/pages/Predictor";
import Analytics from "@/pages/Analytics";
import Models from "@/pages/Models";
import Insights from "@/pages/Insights";
import Pipeline from "@/pages/Pipeline";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CustomCursor } from "@/components/CustomCursor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/predictor" component={Predictor} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/models" component={Models} />
      <Route path="/insights" component={Insights} />
      <Route path="/pipeline" component={Pipeline} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <CustomCursor />
          <Router />
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
