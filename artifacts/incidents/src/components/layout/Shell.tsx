import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCurrentUser,
  useLogout,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  List,
  PlusCircle,
  LogOut,
  Menu,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: List },
  { href: "/my-incidents", label: "My Incidents", icon: UserIcon },
  { href: "/incidents/new", label: "New Incident", icon: PlusCircle },
] as const;

function isActiveRoute(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  if (href === "/incidents") {
    return currentPath === "/incidents" || /^\/incidents\/\d+$/.test(currentPath);
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavLinks({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = isActiveRoute(location, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const logoutParams = useLogout();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logoutParams.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/login");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r bg-card shadow-sm md:flex lg:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold">Quality System</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks location={location} />
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col md:ml-60 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-card px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="h-16 flex-row items-center border-b px-6">
                  <SheetTitle className="text-base">Quality System</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavLinks
                    location={location}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-base font-semibold md:hidden truncate">
              Quality System
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span
                className="text-sm font-medium truncate max-w-[140px] lg:max-w-none"
                data-testid="text-username"
              >
                {user.fullName}
              </span>
              <Badge
                variant="outline"
                className="capitalize"
                data-testid="badge-role"
              >
                {user.role}
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="capitalize sm:hidden"
              data-testid="badge-role-mobile"
            >
              {user.role}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
