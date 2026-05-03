export type CompanyUserRecord = {
  id: string;
  companyId: string;
  accountId?: string;
  userId: string;
  user?: string;
  usersDocId?: string;
  userEmail?: string;
  userDisplayName?: string;
  roleIds: string[];
  roleNames?: string[];
  status: "active" | "inactive";
};
