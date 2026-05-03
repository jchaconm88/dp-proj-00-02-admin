export type CompanyRecord = {
  id: string;
  name: string;
  status: "active" | "inactive";
  accountId?: string;
  code?: string;
  taxId?: string;
};
