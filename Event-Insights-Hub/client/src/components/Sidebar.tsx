import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  BarChart3, 
  Database, 
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Predictor", href: "/predictor", icon: BrainCircuit },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Model Registry", href: "/models", icon: Database },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 h-screen bg-card border-r border-border fixed left-0 top-0 hidden md:flex flex-col z-50 shadow-lg">
      <div className="p-6 border-b border-border/50 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2 text-primary-foreground shadow-lg shadow-primary/25">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-foreground">CampusIntel</h1>
            <p className="text-xs text-muted-foreground font-medium">Event Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Active Model</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">Linear Reg v2.1</span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">R²: 0.75</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-6 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center gap-1 p-2 cursor-pointer">
              <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
