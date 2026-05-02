"use client";

import { InventoryTable } from "@/components/features/dashboard/inventory/InventoryTable";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory</h1>
      <InventoryTable />
    </div>
  );
}
