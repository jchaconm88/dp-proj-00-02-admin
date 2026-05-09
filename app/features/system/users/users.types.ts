export type UserRecord = {
  id: string;
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
  status: "active" | "inactive";
  adminRoleIds: string[];
  adminRoleNames: string[];
  platform: string[];
};

