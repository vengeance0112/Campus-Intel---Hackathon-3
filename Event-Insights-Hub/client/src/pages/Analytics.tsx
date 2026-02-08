import { Sidebar, MobileNav } from "@/components/Sidebar";
import { useStatsCharts } from "@/hooks/use-campus-intel";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";

export default function Analytics() {
  const { data: charts, isLoading } = useStatsCharts();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Advanced Analytics</h1>
            <p className="text-muted-foreground mt-1">Deep dive into friction points and correlation analysis.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Radar Chart - Friction Analysis */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Friction Analysis Radar</CardTitle>
                <CardDescription>
                  Comparing various friction types that negatively impact attendance.
                  <br />
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                    Lower values are better
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={charts?.frictionImpact}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Friction Level"
                        dataKey="value"
                        stroke="hsl(var(--destructive))"
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Scatter Plot - Detailed Interactivity Analysis */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Interactivity ROI</CardTitle>
                <CardDescription>
                  Analyzing the return on investment for high-interactivity events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Interactivity Level" 
                        unit="" 
                        domain={[0, 1]}
                        label={{ value: 'Interactivity Score (0-1)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Attendance" 
                        unit="" 
                        label={{ value: 'Attendance Count', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <ZAxis type="number" range={[100, 500]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Events" data={charts?.interactivityCorrelation} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border/50 flex gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Insight:</strong> There is a strong positive correlation between interactivity and attendance. 
                    Events with interactivity level &gt; 7 show a 40% increase in average attendance compared to lecture-only formats.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
