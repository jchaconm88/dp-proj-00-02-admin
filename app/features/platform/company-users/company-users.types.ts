export type CompanyUserRecord = {
  id: string;
  companyId: string;
  accountId?: string;
  userId: string;
  user?: string;
  usersDocId?: string;
  userEmail?: string;
  userDisplayName?: string;
  webRoleIds: string[];
  webRoleNames?: string[];
  status: "active" | "inactive";
  platform?: string[];
};
