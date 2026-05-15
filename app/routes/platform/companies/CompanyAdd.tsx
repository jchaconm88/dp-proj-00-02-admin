import type { Route } from "./+types/CompanyAdd";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Agregar empresa" }];
}

export default function CompanyAdd() {
  return null;
}
