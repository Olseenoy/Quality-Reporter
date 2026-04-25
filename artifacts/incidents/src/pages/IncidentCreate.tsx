import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useGetLookups, useCreateIncident, Department, IncidentCategory, Severity, useGetCurrentUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, AlertCircle } from "lucide-react";

const FISHBONE_CATEGORIES = ["People", "Process", "Equipment", "Materials", "Environment", "Measurement"];

const schema = z.object({
  department: z.nativeEnum(Department),
  line: z.string().min(1, "Line is required"),
  productType: z.string().min(1, "Product Type is required"),
  category: z.nativeEnum(IncidentCategory),
  severity: z.nativeEnum(Severity),
  description: z.string().min(5, "Description must be at least 5 characters"),
  immediateAction: z.string().min(1, "Immediate action is required"),
  attachmentUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rootCauseCategory: z.string().optional(),
});

export function IncidentCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: lookups, isLoading: lookupsLoading } = useGetLookups();
  const { data: user } = useGetCurrentUser();
  const createMutation = useCreateIncident();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      department: Department.Production,
      line: "",
      productType: "",
      category: IncidentCategory.Others,
      severity: Severity.Low,
      description: "",
      immediateAction: "",
      attachmentUrl: "",
      rootCauseCategory: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createMutation.mutate(
      { data: { ...data, attachmentUrl: data.attachmentUrl || null, rootCauseCategory: data.rootCauseCategory || null } },
      {
        onSuccess: (incident) => {
          toast({ title: "Incident logged successfully", description: `Code: ${incident.incidentCode}` });
          setLocation(`/incidents/${incident.id}`);
        },
        onError: (err) => {
          toast({ title: "Failed to log incident", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (lookupsLoading) return <div className="p-8 text-center">Loading form...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Quality Incident</h1>
        <p className="text-muted-foreground">Log a new issue from the production floor.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-4 rounded-md flex items-center gap-3 border border-blue-200 dark:border-blue-900">
        <AlertCircle className="h-5 w-5" />
        <div className="text-sm">
          <strong>Critical Severity Note:</strong> If this incident requires line stoppage, please select "Critical" severity and contact your supervisor immediately.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location & Product</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lookups?.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line / Equipment ID</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-line">
                          <SelectValue placeholder="Select line" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lookups?.lines.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product Type / SKU</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lookups?.productTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lookups?.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-severity" className={
                            field.value === 'Critical' ? 'border-destructive text-destructive' : ''
                          }>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lookups?.severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what happened, what was observed, and any relevant details..." 
                        className="min-h-[120px] resize-y" 
                        {...field} 
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="immediateAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immediate Action Taken</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What steps were taken immediately to contain the issue? (e.g. Line stopped, product quarantined)" 
                        className="min-h-[80px] resize-y" 
                        {...field} 
                        data-testid="input-immediate-action"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="rootCauseCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Root Cause Guess (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-root-cause">
                          <SelectValue placeholder="Select fishbone category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Leave blank</SelectItem>
                        {FISHBONE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachmentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo / Document URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-attachment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Reporting as: <span className="font-medium text-foreground">{user?.fullName}</span>
                </div>
                
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setLocation('/incidents')}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-incident" className="min-w-[120px]">
                    {createMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </form>
      </Form>
    </div>
  );
}
