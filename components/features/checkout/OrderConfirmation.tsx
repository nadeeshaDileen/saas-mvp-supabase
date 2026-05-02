import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderConfirmationProps {
  paymentIntentId?: string;
}

export function OrderConfirmation({ paymentIntentId }: OrderConfirmationProps) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="flex flex-col items-center gap-4 p-8">
        <CheckCircle className="h-14 w-14 text-green-500" />

        <div>
          <h2 className="text-xl font-bold">Order confirmed!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thanks for your purchase. We&apos;ll send you an update when it ships.
          </p>
        </div>

        {paymentIntentId && (
          <p className="font-mono text-xs text-muted-foreground">
            Ref: {paymentIntentId}
          </p>
        )}

        <div className="flex w-full flex-col gap-2 pt-2">
          <Button asChild className="w-full">
            <Link href="/orders">View my orders</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
