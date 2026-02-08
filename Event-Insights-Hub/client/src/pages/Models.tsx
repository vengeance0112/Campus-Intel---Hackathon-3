import { Sidebar, MobileNav } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from "recharts";

const modelData = [
  { name: "Linear Regression", rmse: 14.759347, mae: 12.217783, r2: 0.758341, status: "Active", version: "v2.0", date: "Feb 08, 2026" },
  { name: "Support Vector Regression", rmse: 15.416107, mae: 12.684375, r2: 0.736356, status: "Staging", version: "v1.8", date: "Feb 07, 2026" },
  { name: "Random Forest", rmse: 18.240840, mae: 14.763517, r2: 0.630888, status: "Archived", version: "v1.5", date: "Feb 05, 2026" },
];

export default function Models() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Model Registry</h1>
            <p className="text-muted-foreground mt-1">Status and performance metrics of trained prediction models.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Model Performance Comparison (R² Score)
                </CardTitle>
                <CardDescription>Higher R² score indicates better model performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis domain={[0, 1]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="r2" name="R² Score">
                        {modelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Error Metrics (RMSE)</CardTitle>
                <CardDescription>Root Mean Square Error across models.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      />
                      <Bar dataKey="rmse" name="RMSE" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>
                Detailed comparison of model performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Model Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RMSE</TableHead>
                    <TableHead>MAE</TableHead>
                    <TableHead>R² Score</TableHead>
                    <TableHead className="text-right">Training Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelData.map((model) => (
                    <TableRow key={model.name} className={model.status === 'Active' ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {model.name}
                          {model.status === 'Active' && (
                            <Badge variant="default" className="bg-primary hover:bg-primary/90">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-xs">
                          {model.status === 'Active' ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" /> Production
                            </span>
                          ) : (
                            <Badge variant={model.status === 'Staging' ? 'secondary' : 'outline'}>
                              {model.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{model.rmse.toFixed(6)}</TableCell>
                      <TableCell>{model.mae.toFixed(6)}</TableCell>
                      <TableCell className="font-bold">{model.r2.toFixed(6)}</TableCell>
                      <TableCell className="text-right">{model.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
