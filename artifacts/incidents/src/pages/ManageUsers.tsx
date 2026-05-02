import { useState } from "react";
import { useGetUsers, useGetCurrentUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ManageUsers() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: users, refetch } = useGetUsers();
  const { toast } = useToast();
  const [loading, setLoading] = useState<number | null>(null);

  if (currentUser?.role !== "admin") {
    return <div className="p-6">Access denied. Admins only.</div>;
  }

  const changeRole = async (userId: number, newRole: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast({ title: "Role updated successfully" });
      refetch();
    } catch {
      toast({ title: "Error updating role", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{user.fullName}</span>
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent>
              {currentUser.id !== user.id && (
                <div className="flex gap-2 flex-wrap">
                  {user.role !== "operator" && (
                    <Button size="sm" variant="outline" disabled={loading === user.id}
                      onClick={() => changeRole(user.id, "operator")}>
                      Set as Operator
                    </Button>
                  )}
                  {user.role !== "supervisor" && (
                    <Button size="sm" variant="outline" disabled={loading === user.id}
                      onClick={() => changeRole(user.id, "supervisor")}>
                      Set as Supervisor
                    </Button>
                  )}
                  {user.role !== "admin" && (
                    <Button size="sm" variant="outline" disabled={loading === user.id}
                      onClick={() => changeRole(user.id, "admin")}>
                      Set as Admin
                    </Button>
                  )}
                </div>
              )}
              {currentUser.id === user.id && (
                <p className="text-xs text-muted-foreground">This is you</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
