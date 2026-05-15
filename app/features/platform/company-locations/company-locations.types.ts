export type CompanyLocationRecord = {
  id: string;
  companyId: string;
  accountId?: string;
  name: string;
  description: string;
  ubigeo: string;
  city: string;
  country: string;
  district: string;
  address: string;
  active: boolean;
};

export type CompanyLocationInput = Omit<CompanyLocationRecord, "id" | "accountId">;
