import { useStatsOverview, useStatsCharts } from "@/hooks/use-campus-intel";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp,
  Loader2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, ScatterChart, Scatter
} from "recharts";
import { motion } from "framer-motion";

// Custom Colors for Charts
const COLORS = ["hsl(221, 83%, 53%)", "hsl(199, 89%, 48%)", "hsl(162, 94%, 30%)", "hsl(43, 96%, 64%)", "hsl(262, 83%, 58%)"];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStatsOverview();
  const { data: charts, isLoading: chartsLoading } = useStatsCharts();

  const isLoading = statsLoading || chartsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Dashboard Overview</h1>
              <p className="text-muted-foreground mt-1">Real-time insights into campus event engagement.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                Last updated: Just now
              </span>
            </div>
          </header>

          {/* Stats Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <motion.div variants={item}>
              <StatCard 
                title="Total Events" 
                value={stats?.totalEvents || 0} 
                icon={Calendar} 
                description="Events analyzed this semester"
                trend="up"
                trendValue="12%"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                title="Avg Attendance" 
                value={Math.round(stats?.avgAttendance || 0)} 
                icon={Users} 
                description="Attendees per event"
                trend="up"
                trendValue="5.3%"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                title="Top Domain" 
                value={stats?.topDomain || "N/A"} 
                icon={Award} 
                description="Highest engagement category"
                className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                title="Top Speaker Type" 
                value={stats?.topSpeakerType || "N/A"} 
                icon={TrendingUp} 
                description="Most popular speaker category"
              />
            </motion.div>
          </motion.div>

          {/* Main Charts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Bar Chart - Attendance by Domain */}
            <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold font-display">Attendance by Domain</h3>
                  <p className="text-sm text-muted-foreground">Average attendee count per academic domain</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.attendanceByDomain}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))" 
                      radius={[6, 6, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart - Attendance by Speaker */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
               <div className="mb-6">
                  <h3 className="text-lg font-bold font-display">Speaker Impact</h3>
                  <p className="text-sm text-muted-foreground">Distribution by speaker type</p>
                </div>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.attendanceBySpeaker}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts?.attendanceBySpeaker?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut Chart effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-foreground">100%</span>
                    <span className="text-xs text-muted-foreground">Distribution</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Secondary Charts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
             {/* Scatter Plot - Interactivity Correlation */}
             <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="mb-6">
                <h3 className="text-lg font-bold font-display">Interactivity vs. Attendance</h3>
                <p className="text-sm text-muted-foreground">Correlation analysis (Level 0-3)</p>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      domain={[0, 1]}
                      tickCount={3}
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'Interactivity Level', position: 'insideBottom', offset: -5, style: { fontSize: '10px', fill: 'hsl(var(--muted-foreground))' } }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="y"
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Scatter 
                      name="Events" 
                      data={charts?.interactivityCorrelation} 
                      fill="hsl(var(--accent))"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Friction Impact Bar Chart */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="mb-6">
                <h3 className="text-lg font-bold font-display">Friction Analysis</h3>
                <p className="text-sm text-muted-foreground">Negative impact factors on attendance</p>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.frictionImpact} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--destructive))" 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
