import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "store_owner") {
    redirect("/");
  }

  return (
    <OrganizationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </OrganizationProvider>
  );
}
