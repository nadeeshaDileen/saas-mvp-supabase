import type { MemberRole, PlanType } from "./database";

export type { MemberRole, PlanType };

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanType;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
}

export interface UserOrganization extends Organization {
  userRole: MemberRole;
  isOwner: boolean;
}
