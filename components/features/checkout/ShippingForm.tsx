"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingAddress } from "@/types/user";

interface ShippingFormProps {
  initialData?: {
    fullName?: string;
    phone?: string;
    shippingAddress?: ShippingAddress | null;
  };
  onSubmit: (data: {
    fullName: string;
    phone: string;
    shippingAddress: ShippingAddress;
  }) => void;
  isSubmitting?: boolean;
}

export function ShippingForm({ initialData, onSubmit, isSubmitting }: ShippingFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [line1, setLine1] = useState(initialData?.shippingAddress?.line1 ?? "");
  const [line2, setLine2] = useState(initialData?.shippingAddress?.line2 ?? "");
  const [city, setCity] = useState(initialData?.shippingAddress?.city ?? "");
  const [state, setState] = useState(initialData?.shippingAddress?.state ?? "");
  const [postalCode, setPostalCode] = useState(initialData?.shippingAddress?.postalCode ?? "");
  const [country, setCountry] = useState(initialData?.shippingAddress?.country ?? "US");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!line1.trim()) newErrors.line1 = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      shippingAddress: {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="line1">Address Line 1 *</Label>
          <Input
            id="line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="123 Main Street"
            className={errors.line1 ? "border-destructive" : ""}
          />
          {errors.line1 && <p className="mt-1 text-xs text-destructive">{errors.line1}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="line2">Address Line 2</Label>
          <Input
            id="line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apt 4B (optional)"
          />
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="New York"
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="NY"
            className={errors.state ? "border-destructive" : ""}
          />
          {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="10001"
            className={errors.postalCode ? "border-destructive" : ""}
          />
          {errors.postalCode && (
            <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US"
            className={errors.country ? "border-destructive" : ""}
          />
          {errors.country && (
            <p className="mt-1 text-xs text-destructive">{errors.country}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? "Saving..." : "Continue to Payment"}
      </Button>
    </form>
  );
}
