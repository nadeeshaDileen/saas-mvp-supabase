"use client";

import { useState } from "react";
import { OrdersTable } from "@/components/features/dashboard/orders/OrdersTable";
import { ExportButton } from "@/components/features/dashboard/orders/ExportButton";
import type { OrderFilters } from "@/types/store";

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <ExportButton filters={filters} />
      </div>
      <OrdersTable onFiltersChange={setFilters} />
    </div>
  );
}
