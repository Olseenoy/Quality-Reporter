import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  useListIncidents,
  useGetLookups,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function IncidentsList({ mineOnly = false }: { mineOnly?: boolean }) {
  const searchString = useSearch();
  const initial = new URLSearchParams(searchString);
  const [search, setSearch] = useState(initial.get("search") ?? "");
  const [department, setDepartment] = useState<string>(initial.get("department") ?? "all");
  const [severity, setSeverity] = useState<string>(initial.get("severity") ?? "all");
  const [status, setStatus] = useState<string>(initial.get("status") ?? "all");
  const [startDate, setStartDate] = useState<string>(initial.get("startDate") ?? "");
  const [endDate, setEndDate] = useState<string>(initial.get("endDate") ?? "");

  useEffect(() => {
    const next = new URLSearchParams(searchString);
    setSearch(next.get("search") ?? "");
    setDepartment(next.get("department") ?? "all");
    setSeverity(next.get("severity") ?? "all");
    setStatus(next.get("status") ?? "all");
    setStartDate(next.get("startDate") ?? "");
    setEndDate(next.get("endDate") ?? "");
  }, [searchString]);

  const { data: lookups } = useGetLookups();
  const { data: currentUser } = useGetCurrentUser();

  const params: any = {};
  if (search) params.search = search;
  if (department && department !== "all") params.department = department;
  if (severity && severity !== "all") params.severity = severity;
  if (status && status !== "all") params.status = status;
  if (startDate) params.startDate = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) params.endDate = new Date(`${endDate}T23:59:59.999Z`);
  if (mineOnly && currentUser?.id) params.reportedById = currentUser.id;

  const { data: incidents, isLoading } = useListIncidents(params, {
    query: { enabled: !mineOnly || !!currentUser?.id },
  });

  const title = mineOnly ? "My Incidents" : "Incidents";
  const subtitle = mineOnly
    ? "Quality incidents you have reported."
    : "Manage and track all quality incidents.";
  const emptyMsg = mineOnly
    ? "You haven't reported any incidents yet."
    : "No incidents found matching criteria.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const qs = new URLSearchParams();
              if (search) qs.set("search", search);
              if (department !== "all") qs.set("department", department);
              if (severity !== "all") qs.set("severity", severity);
              if (status !== "all") qs.set("status", status);
              if (startDate) qs.set("startDate", new Date(`${startDate}T00:00:00.000Z`).toISOString());
              if (endDate) qs.set("endDate", new Date(`${endDate}T23:59:59.999Z`).toISOString());
              if (mineOnly && currentUser?.id) qs.set("reportedById", String(currentUser.id));
              const query = qs.toString();
              window.location.href = `/api/incidents/export.csv${query ? `?${query}` : ""}`;
            }}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button asChild>
            <Link href="/incidents/new" data-testid="link-new-incident">Report Incident</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-muted/20">
          <div className="relative sm:col-span-2 lg:col-span-4">
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
            <SelectTrigger className="w-full lg:col-span-2" data-testid="select-filter-dept">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {lookups?.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-full lg:col-span-2" data-testid="select-filter-sev">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {lookups?.severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full lg:col-span-2" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {lookups?.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 lg:col-span-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1"
              data-testid="input-filter-start-date"
            />
          </div>

          <div className="flex items-center gap-2 lg:col-span-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1"
              data-testid="input-filter-end-date"
            />
          </div>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="lg:col-span-2 justify-self-start"
              data-testid="button-clear-dates"
            >
              Clear dates
            </Button>
          )}
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
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{emptyMsg}</td></tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/incidents/${incident.id}`} className="text-primary group-hover:underline block whitespace-nowrap" data-testid={`link-incident-${incident.id}`}>
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
