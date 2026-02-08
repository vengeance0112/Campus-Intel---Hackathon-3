import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { usePredictAttendance } from "@/hooks/use-campus-intel";
import { useQueryClient } from "@tanstack/react-query";
import { api, type PredictionRequest } from "@shared/routes";
import { cn } from "@/lib/utils";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  RefreshCcw,
  ArrowRight,
  BrainCircuit
} from "lucide-react";

// Schema for the form based on API input
const formSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  eventType: z.string().min(1, "Event type is required"),
  speakerType: z.string().min(1, "Speaker type is required"),
  durationHours: z.coerce.number().min(0.5).max(5.0),
  dayType: z.string().min(1, "Day type is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  promotionDays: z.coerce.number().min(0).max(30),
  certificateFlag: z.boolean().default(false),
  interactivityLevel: z.coerce.number().min(0).max(1),
  frictions: z.object({
    promotion: z.number().min(1).max(5),
    fatigue: z.number().min(1).max(5),
    format: z.number().min(1).max(5),
    social: z.number().min(1).max(5),
    schedule: z.number().min(1).max(5),
    relevance: z.number().min(1).max(5),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Predictor() {
  const [prediction, setPrediction] = useState<any>(null);
  const { mutate: predict, isPending } = usePredictAttendance();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "Tech",
      eventType: "Workshop",
      speakerType: "Industry",
      durationHours: 2,
      dayType: "Weekday",
      timeSlot: "Afternoon",
      promotionDays: 7,
      certificateFlag: true,
      interactivityLevel: 0.5,
      frictions: {
        promotion: 1,
        fatigue: 1,
        format: 1,
        social: 1,
        schedule: 1,
        relevance: 1,
      },
    },
  });

  function onSubmit(values: FormValues) {
    predict(values, {
      onSuccess: (data) => {
        setPrediction(data);
        // Immediately increment total events count in frontend
        const currentStats = queryClient.getQueryData<any>(["/api/stats/overview"]);
        if (currentStats) {
          queryClient.setQueryData(["/api/stats/overview"], {
            ...currentStats,
            totalEvents: currentStats.totalEvents + 1,
          });
        }
      },
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
              <Sparkles className="text-accent h-8 w-8" />
              AI Attendance Predictor
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Configure event parameters to forecast attendance using our trained Machine Learning models.
              Adjust variables to see real-time impact on engagement.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Input Form */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Event Parameters</CardTitle>
                  <CardDescription>Enter details about your planned event.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="domain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Domain</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select domain" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Tech">Tech</SelectItem>
                                  <SelectItem value="Law">Law</SelectItem>
                                  <SelectItem value="Design">Design</SelectItem>
                                  <SelectItem value="Music">Music</SelectItem>
                                  <SelectItem value="Business">Business</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="eventType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Workshop">Workshop</SelectItem>
                                  <SelectItem value="Guest_Lecture">Guest Lecture</SelectItem>
                                  <SelectItem value="Career_Talk">Career Talk</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="speakerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Speaker Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select speaker" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Industry">Industry</SelectItem>
                                  <SelectItem value="Faculty">Faculty</SelectItem>
                                  <SelectItem value="Alumni">Alumni</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dayType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Weekday">Weekday</SelectItem>
                                  <SelectItem value="Weekend">Weekend</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="timeSlot"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Slot</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Morning">Morning</SelectItem>
                                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                                  <SelectItem value="Evening">Evening</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                         <FormField
                          control={form.control}
                          name="certificateFlag"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Certificate Offered?
                                </FormLabel>
                                <FormDescription>
                                  Does this event provide a certificate of completion?
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="interactivityLevel"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-2">
                                <FormLabel>Interactivity Level (0.0 - 1.0)</FormLabel>
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  Level {field.value.toFixed(2)}
                                </span>
                              </div>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="py-4"
                                />
                              </FormControl>
                              <FormDescription>
                                Higher interactivity typically correlates with better attendance.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="promotionDays"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-2">
                                <FormLabel>Promotion Period (0 - 30 Days)</FormLabel>
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {field.value} Days
                                </span>
                              </div>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={30}
                                  step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="py-4"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="durationHours"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-2">
                                <FormLabel>Duration (0.5 - 5.0 Hours)</FormLabel>
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {field.value} Hours
                                </span>
                              </div>
                              <FormControl>
                                <Slider
                                  min={0.5}
                                  max={5}
                                  step={0.5}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="py-4"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Student Engagement Frictions
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Rate each friction from 1 (Low) to 5 (High).
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(['promotion', 'fatigue', 'format', 'social', 'schedule', 'relevance'] as const).map((friction) => (
                            <FormField
                              key={friction}
                              control={form.control}
                              name={`frictions.${friction}`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center">
                                    <FormLabel className="capitalize">{friction} Friction</FormLabel>
                                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">
                                      {field.value}
                                    </span>
                                  </div>
                                  <FormControl>
                                    <Slider
                                      min={1}
                                      max={5}
                                      step={1}
                                      defaultValue={[field.value]}
                                      onValueChange={(vals) => field.onChange(vals[0])}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full text-base font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            Predict Attendance <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Prediction Result */}
            <div className="lg:col-span-5 space-y-6">
              {prediction ? (
                <div className="space-y-6 animate-in-fade">
                  {/* Main Result Card */}
                  <Card className="border-border shadow-lg bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary-foreground/90">
                        <Gauge className="h-5 w-5" /> Predicted Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-6">
                        <span className="text-7xl font-bold font-display tracking-tighter">
                          {prediction.predictedAttendance}
                        </span>
                        <span className="text-lg font-medium opacity-80 mt-2">Expected Attendees</span>
                        
                        <div className="mt-6 flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
                          <span className="text-sm font-medium">Confidence Interval: </span>
                          <span className="text-sm font-bold">
                            {prediction.confidenceInterval[0]} - {prediction.confidenceInterval[1]}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar for Confidence */}
                      <div className="px-4 mb-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-wider opacity-70 mb-1">
                          <span>Lower Bound</span>
                          <span>Upper Bound</span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                            style={{ 
                              width: `${Math.min(100, (prediction.predictedAttendance / 200) * 100)}%` 
                            }} 
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                        <span className="text-sm font-medium opacity-80">Category</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-primary shadow-sm"
                        )}>
                          {prediction.category}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intelligent Recommendations Panel */}
                  <Card className="border-border shadow-md overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider font-bold">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Intelligent Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {prediction.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex gap-3 text-sm items-start group">
                            <div className="mt-0.5 bg-primary/10 p-1 rounded group-hover:bg-primary/20 transition-colors">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-muted-foreground leading-snug">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Factors Card */}
                  <Card className="border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base">Contributing Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {prediction.contributingFactors.map((factor: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{factor.factor}</span>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-bold px-1.5 py-0.5 rounded",
                                factor.impact === "Positive" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                              )}>
                                {factor.impact}
                              </span>
                              <span className="font-mono text-xs">{factor.weight.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Empty State / Placeholder
                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/10 text-center min-h-[400px]">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <BrainCircuit className="h-12 w-12 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Ready to Predict</h3>
                  <p className="text-muted-foreground max-w-xs mt-2 text-sm">
                    Fill out the form on the left and click "Predict Attendance" to generate forecasts and actionable insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
