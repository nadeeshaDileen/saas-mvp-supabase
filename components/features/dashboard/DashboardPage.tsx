"use client";

import { useCurrentProfile } from "@/hooks/queries/useProfile";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function DashboardPage() {
  const { data: profile, isLoading } = useCurrentProfile();
  const { selectedOrganization, organizations } = useOrganizationContext();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{profile?.fullName ? `, ${profile.fullName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          {selectedOrganization?.name ?? "No organization selected"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{organizations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">
              {selectedOrganization?.plan ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">
              {selectedOrganization?.userRole ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
