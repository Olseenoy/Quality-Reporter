import { useGetIncident, useUpdateIncident, useGetLookups, useGetCurrentUser, getGetIncidentQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, User, AlertTriangle, FileText, Settings, Link as LinkIcon, Building2, Factory, Box } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FISHBONE_CATEGORIES = ["People", "Process", "Equipment", "Materials", "Environment", "Measurement"];

export function IncidentDetail() {
  const { id } = useParams();
  const numericId = Number(id);
  const { data: incident, isLoading } = useGetIncident(numericId, { query: { enabled: !!numericId, queryKey: getGetIncidentQueryKey(numericId) } });
  const { data: lookups } = useGetLookups();
  const { data: user } = useGetCurrentUser();
  const updateMutation = useUpdateIncident();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>("");
  const [immediateAction, setImmediateAction] = useState<string>("");
  const [rootCauseCategory, setRootCauseCategory] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (incident) {
      setStatus(incident.status);
      setImmediateAction(incident.immediateAction || "");
      setRootCauseCategory(incident.rootCauseCategory || "");
    }
  }, [incident]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading incident details...</div>;
  if (!incident) return <div className="p-8 text-center text-destructive">Incident not found.</div>;

  const canEdit = user?.role === 'admin' || user?.role === 'supervisor';

  const handleSave = () => {
    updateMutation.mutate(
      { 
        id: numericId, 
        data: { 
          status: status as any, 
          immediateAction, 
          rootCauseCategory: rootCauseCategory || null 
        } 
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetIncidentQueryKey(numericId), data);
          setIsEditing(false);
          toast({ title: "Incident updated successfully" });
        },
        onError: (err) => {
          toast({ title: "Update failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-incident-code">{incident.incidentCode}</h1>
            <Badge variant={incident.severity === 'Critical' ? 'destructive' : incident.severity === 'High' ? 'default' : 'secondary'} className="text-sm px-2 py-0.5">
              {incident.severity}
            </Badge>
            <Badge variant={incident.status === 'Closed' ? 'outline' : incident.status === 'In Progress' ? 'secondary' : 'default'} className="text-sm px-2 py-0.5">
              {incident.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Reported on {new Date(incident.occurredAt).toLocaleString()}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit">Update Incident</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{incident.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                Actions & Root Cause
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Immediate Action Taken</label>
                {isEditing ? (
                  <Textarea 
                    value={immediateAction} 
                    onChange={(e) => setImmediateAction(e.target.value)} 
                    className="min-h-[100px]"
                    data-testid="input-immediate-action"
                  />
                ) : (
                  <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap border">
                    {incident.immediateAction || "None specified"}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Root Cause Category (Fishbone)</label>
                {isEditing ? (
                  <Select value={rootCauseCategory} onValueChange={setRootCauseCategory}>
                    <SelectTrigger data-testid="select-root-cause">
                      <SelectValue placeholder="Select root cause category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified yet</SelectItem>
                      {FISHBONE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm font-medium">
                    {incident.rootCauseCategory ? (
                      <Badge variant="outline" className="bg-muted/50">{incident.rootCauseCategory}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Pending investigation</span>
                    )}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="space-y-2 pt-2 border-t mt-4">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups?.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3"/> Dept</div>
                <div className="font-medium text-right">{incident.department}</div>
                
                <div className="col-span-2"><Separator /></div>

                <div className="text-muted-foreground flex items-center gap-1"><Factory className="h-3 w-3"/> Line</div>
                <div className="font-medium text-right">{incident.line}</div>

                <div className="col-span-2"><Separator /></div>
                
                <div className="text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3"/> Product</div>
                <div className="font-medium text-right">{incident.productType}</div>

                <div className="col-span-2"><Separator /></div>

                <div className="text-muted-foreground flex items-center gap-1"><Settings className="h-3 w-3"/> Category</div>
                <div className="font-medium text-right">{incident.category}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Reported By</span>
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4" />
                  {incident.reportedByName}
                </div>
              </div>
              
              {incident.attachmentUrl && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Attachment</span>
                  <a href={incident.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline" data-testid="link-attachment">
                    <LinkIcon className="h-4 w-4" />
                    View Attachment
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
