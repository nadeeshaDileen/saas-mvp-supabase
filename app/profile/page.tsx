"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { CustomerProfilePage } from "@/components/features/profile/CustomerProfilePage";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isLoading } = useAuthSession();

  useEffect(() => {
    if (!isLoading && !session?.isAuthenticated) {
      router.replace("/auth/login?redirectTo=/profile");
    }
  }, [session, isLoading, router]);

  if (isLoading || !session?.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <CustomerProfilePage />
    </main>
  );
}
