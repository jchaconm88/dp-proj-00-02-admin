/** Usuario de la app Web (colección `users` en Firestore Web; doc id = authUid). */
export type WebAppUserRecord = {
  id: string;
  authUid: string;
  email: string;
  displayName: string;
  accountId?: string;
  status: "active" | "inactive" | "invited" | string;
};

export type WebAppUserCreateInput = {
  email: string;
  displayName: string;
  status: "active" | "inactive" | "invited" | string;
  password?: string;
};

export type WebAppUserCreateResult = {
  ok: boolean;
  id: string;
  authUid: string;
  generatedPassword: string;
};
