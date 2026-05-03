export type UserRecord = {
  id: string;
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
  status: "active" | "inactive";
  roleIds: string[];
  roleNames: string[];
};

