import type { Route } from "./+types/CompanyEdit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Editar empresa" }];
}

export default function CompanyEdit() {
  return null;
}
