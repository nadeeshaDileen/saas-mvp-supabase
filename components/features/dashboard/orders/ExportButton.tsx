"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderFilters } from "@/types/store";
import { toast } from "sonner";

interface ExportButtonProps {
  filters: OrderFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.customerEmail) params.set("customerEmail", filters.customerEmail);

      const res = await fetch(`/api/orders/export?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isLoading}
      aria-label="Export orders as CSV"
    >
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
