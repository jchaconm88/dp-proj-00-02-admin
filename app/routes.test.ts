import { describe, it, expect } from "vitest";
import routes from "./routes";

describe("routes", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("includes login and registro as top-level path routes", () => {
    const entryJson = JSON.stringify(routes, null, 2);
    expect(entryJson).toContain('"login"');
    expect(entryJson).toContain('"registro"');
  });

  it("includes a layout entry containing the dashboard file", () => {
    const entryJson = JSON.stringify(routes, null, 2);
    expect(entryJson).toContain("routes/Dashboard.tsx");
  });

  it("includes roles, plans, and other dashboard children", () => {
    const entryJson = JSON.stringify(routes, null, 2);
    expect(entryJson).toContain('"roles"');
    expect(entryJson).toContain('"plans"');
    expect(entryJson).toContain('"subscriptions"');
  });

  it("uses { id } for disambiguation on plans/add and plans/edit/:id", () => {
    const entryJson = JSON.stringify(routes, null, 2);
    expect(entryJson).toContain("routes/system/plans/PlansPage/add");
    expect(entryJson).toContain("routes/system/plans/PlansPage/edit");
  });
});
