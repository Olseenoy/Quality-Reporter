import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, List, PlusCircle, LogOut } from "lucide-react";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const logoutParams = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logoutParams.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/login");
      },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/incidents", label: "Incidents", icon: List },
    { href: "/incidents/new", label: "New Incident", icon: PlusCircle },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card shadow-sm hidden md:block">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold">Quality System</span>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
          <div className="md:hidden">
            <span className="text-lg font-bold">Quality System</span>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" data-testid="text-username">{user.fullName}</span>
              <Badge variant="outline" className="capitalize" data-testid="badge-role">{user.role}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
