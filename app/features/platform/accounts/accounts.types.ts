export type AccountStatus = "active" | "inactive";

export type AccountRecord = {
  id: string;
  name: string;
  status: AccountStatus;
  website?: string;
  industry?: string;
  location?: string;
};
