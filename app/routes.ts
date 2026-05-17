import { route, index, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/Login.tsx"),
  route("registro", "routes/Registro.tsx"),
  route("onboarding", "routes/OnboardingLayout.tsx", [
    index("routes/Onboarding.tsx"),
  ]),
  layout("routes/Dashboard.tsx", [
    index("routes/DashboardHome.tsx"),
    route("billing/usage", "routes/BillingUsage.tsx"),
    route("users", "routes/system/UsersPage.tsx"),
    route("roles", "routes/system/RolesPage.tsx"),
    route("roles/:id", "routes/system/RolesDetail.tsx"),
    route("sequences", "routes/system/sequences/SequencesPage.tsx", [
      route("add", "routes/system/sequences/SequenceAdd.tsx"),
      route("edit/:id", "routes/system/sequences/SequenceEdit.tsx"),
    ]),
    route("counters", "routes/system/counters/CountersPage.tsx", [
      route("add", "routes/system/counters/CounterAdd.tsx"),
      route("edit/:id", "routes/system/counters/CounterEdit.tsx"),
    ]),
    route("platform/users", "routes/platform/users/UsersPage.tsx", [
      route("add", "routes/platform/users/UserAdd.tsx"),
      route("edit/:id", "routes/platform/users/UserEdit.tsx"),
    ]),
    route("company-roles", "routes/platform/company-roles/CompanyRolesPage.tsx"),
    route("company-roles/:id", "routes/platform/company-roles/CompanyRolesDetail.tsx"),
    route("accounts", "routes/platform/accounts/AccountsRedirect.tsx"),
    route("account", "routes/system/account/AccountPage.tsx"),
    route("platform/companies", "routes/platform/companies/CompaniesPage.tsx", [
      route("add", "routes/platform/companies/CompanyAdd.tsx"),
      route("edit/:id", "routes/platform/companies/CompanyEdit.tsx"),
    ]),
    route("platform/companies/:id/company-users", "routes/platform/companies/CompanyUsersPage.tsx", [
      route("add", "routes/platform/companies/CompanyUserAdd.tsx"),
      route("edit/:companyUserDocId", "routes/platform/companies/CompanyUserEdit.tsx"),
    ]),
    route("platform/companies/:id/company-locations", "routes/platform/companies/CompanyLocationsPage.tsx", [
      route("add", "routes/platform/companies/CompanyLocationAdd.tsx"),
      route("edit/:locationId", "routes/platform/companies/CompanyLocationEdit.tsx"),
    ]),
    route("plans", "routes/system/plans/PlansPage.tsx"),
    route("plans/add", "routes/system/plans/PlansPage.tsx", { id: "routes/system/plans/PlansPage/add" }),
    route("plans/edit/:id", "routes/system/plans/PlansPage.tsx", { id: "routes/system/plans/PlansPage/edit" }),
    route("subscriptions", "routes/system/subscriptions/SubscriptionsPage.tsx"),
    route("subscriptions/add", "routes/system/subscriptions/SubscriptionsPage.tsx", {
      id: "routes/system/subscriptions/SubscriptionsPage/add",
    }),
    route("subscriptions/edit/:id", "routes/system/subscriptions/SubscriptionsPage.tsx", {
      id: "routes/system/subscriptions/SubscriptionsPage/edit",
    }),
    route("company-users", "routes/platform/company-users/CompanyUsersPage.tsx"),
    route("dashboard-metrics", "routes/dashboard-config/DashboardMetricsPage.tsx"),
    route("dashboard-config", "routes/dashboard-config/DashboardConfigPage.tsx"),
    route("dashboard-overrides", "routes/dashboard-config/DashboardOverridesPage.tsx"),
  ]),
];
