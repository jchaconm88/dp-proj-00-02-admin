import { redirect } from "react-router";
import type { Route } from "./+types/AccountsRedirect";

export function meta() {
  return [{ title: "Cuenta" }];
}

export async function clientLoader({}: Route.ClientLoaderArgs) {
  throw redirect("/account");
}

export default function AccountsRedirect() {
  return null;
}

