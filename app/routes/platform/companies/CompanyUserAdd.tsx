import type { Route } from "./+types/CompanyUserAdd";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Agregar usuario" }];
}

export default function CompanyUserAdd() {
  return null;
}
