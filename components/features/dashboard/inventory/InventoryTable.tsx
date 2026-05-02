"use client";

import { useState, useRef } from "react";
import { useInventory, useUpdateStock } from "@/lib/hooks/useInventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= 5) return <Badge variant="warning">Low stock</Badge>;
  return null;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="bg-muted h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}

export function InventoryTable() {
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const { data: rows = [], isLoading } = useInventory(sort);
  const { mutateAsync: updateStock } = useUpdateStock();

  // Track pending edits per variant id
  const pendingRef = useRef<Record<string, number>>({});

  async function commitStock(variantId: string, rawValue: string) {
    const stock = parseInt(rawValue, 10);
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock must be a non-negative integer");
      return;
    }
    // Skip if unchanged
    const current = rows.find((r) => r.id === variantId)?.stock;
    if (stock === current) return;

    try {
      await updateStock({ variantId, stock });
      toast.success("Stock updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stock");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{rows.length} variants</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
          aria-label={`Sort by stock ${sort === "asc" ? "descending" : "ascending"}`}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Stock: {sort === "asc" ? "Low → High" : "High → Low"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Size</th>
              <th className="px-4 py-3 text-left font-medium">Color</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.productName}</td>
                    <td className="px-4 py-3">{row.size}</td>
                    <td className="px-4 py-3">{row.color}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        defaultValue={row.stock}
                        key={`${row.id}-${row.stock}`}
                        className="border-input bg-background w-20 rounded border px-2 py-1 text-right text-sm"
                        aria-label={`Stock for ${row.productName} ${row.size} ${row.color}`}
                        onChange={(e) => {
                          pendingRef.current[row.id] = parseInt(e.target.value, 10);
                        }}
                        onBlur={(e) => commitStock(row.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={row.stock} />
                    </td>
                  </tr>
                ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No inventory found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
