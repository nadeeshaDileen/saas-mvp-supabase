"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCurrentProfile } from "@/hooks/queries/useProfile";
import { useUpdateProfile } from "@/hooks/mutations/useUpdateProfile";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function SettingsPage() {
  const { data: session } = useAuthSession();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    try {
      await updateProfile({ userId: session.user.id, input: { fullName, bio } });
      toast.success("Settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your store information and preferences
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Store Owner Profile</CardTitle>
          <CardDescription>Your public store owner information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Store Owner Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Store Description</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your store"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Business details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional store settings coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
