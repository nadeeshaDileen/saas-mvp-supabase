"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMyOrganizations } from "@/hooks/queries/useOrganizations";
import type { MemberRole, UserOrganization } from "@/types/organization";

interface OrganizationContextType {
  organizations: UserOrganization[];
  selectedOrganization: UserOrganization | null;
  userRole: MemberRole | null;
  isOwner: boolean;
  selectOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: organizations = [], isLoading, error, refetch } = useMyOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const selectedOrganization = useMemo(() => {
    if (!organizations.length) return null;
    if (selectedOrgId) {
      return organizations.find((o) => o.id === selectedOrgId) ?? null;
    }
    return organizations.find((o) => o.isOwner) ?? organizations[0] ?? null;
  }, [organizations, selectedOrgId]);

  const userRole = selectedOrganization?.userRole ?? null;
  const isOwner = selectedOrganization?.isOwner ?? false;

  const selectOrganization = useCallback((orgId: string) => {
    setSelectedOrgId(orgId);
  }, []);

  const refreshOrganizations = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Auto-select default org
  React.useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      const defaultOrg = organizations.find((o) => o.isOwner) ?? organizations[0];
      setSelectedOrgId(defaultOrg.id);
    }
  }, [organizations, selectedOrgId]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        selectedOrganization,
        userRole,
        isOwner,
        selectOrganization,
        refreshOrganizations,
        isLoading,
        error: error?.message ?? null,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext(): OrganizationContextType {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganizationContext must be used within OrganizationProvider");
  return ctx;
}

export function useSelectedOrganization() {
  return useOrganizationContext().selectedOrganization;
}

export function useUserRole() {
  return useOrganizationContext().userRole;
}

export function useIsOwner() {
  return useOrganizationContext().isOwner;
}

export function useHasRole(requiredRole: MemberRole): boolean {
  const { userRole } = useOrganizationContext();
  if (!userRole) return false;
  const hierarchy: Record<MemberRole, number> = { owner: 3, admin: 2, member: 1 };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}
