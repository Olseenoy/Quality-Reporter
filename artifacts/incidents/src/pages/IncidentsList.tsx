import { useState } from "react";
import { Link } from "wouter";
import { useListIncidents, useGetLookups } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function IncidentsList() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: lookups } = useGetLookups();
  
  const params: any = {};
  if (search) params.search = search;
  if (department && department !== "all") params.department = department;
  if (severity && severity !== "all") params.severity = severity;
  if (status && status !== "all") params.status = status;

  const { data: incidents, isLoading } = useListIncidents(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and track all quality incidents.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const qs = new URLSearchParams();
              if (search) qs.set("search", search);
              if (department !== "all") qs.set("department", department);
              if (severity !== "all") qs.set("severity", severity);
              if (status !== "all") qs.set("status", status);
              const query = qs.toString();
              window.location.href = `/api/incidents/export.csv${query ? `?${query}` : ""}`;
            }}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/incidents/new" data-testid="link-new-incident">Report Incident</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code, description..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-dept">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {lookups?.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-sev">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {lookups?.severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {lookups?.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Line</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reporter</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading incidents...</td></tr>
              ) : !incidents || incidents.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No incidents found matching criteria.</td></tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/incidents/${incident.id}`} className="text-primary group-hover:underline block" data-testid={`link-incident-${incident.id}`}>
                        {incident.incidentCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(incident.occurredAt).toLocaleDateString()} {new Date(incident.occurredAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{incident.department}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{incident.line}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{incident.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={incident.severity === 'Critical' ? 'destructive' : incident.severity === 'High' ? 'default' : incident.severity === 'Medium' ? 'secondary' : 'outline'}>
                        {incident.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={incident.status === 'Closed' ? 'outline' : incident.status === 'In Progress' ? 'secondary' : 'default'} className="bg-opacity-50">
                        {incident.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{incident.reportedByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
