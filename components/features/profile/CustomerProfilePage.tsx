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
import type { ShippingAddress } from "@/types/user";

export function CustomerProfilePage() {
  const { data: session } = useAuthSession();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setLine1(profile.shippingAddress?.line1 ?? "");
      setLine2(profile.shippingAddress?.line2 ?? "");
      setCity(profile.shippingAddress?.city ?? "");
      setState(profile.shippingAddress?.state ?? "");
      setPostalCode(profile.shippingAddress?.postalCode ?? "");
      setCountry(profile.shippingAddress?.country ?? "US");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    const shippingAddress: ShippingAddress | null = line1 && city && state && postalCode && country
      ? {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        }
      : null;

    try {
      await updateProfile({
        userId: session.user.id,
        input: {
          fullName,
          phone,
          shippingAddress,
        },
      });
      toast.success("Profile updated successfully");
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and shipping address
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your name and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used for order notifications and delivery contact
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>
              This address will be used for all your orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="line1">Address Line 1 *</Label>
                <Input
                  id="line1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apt 4B (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="US"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} size="lg" className="w-full sm:w-auto">
          {isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
