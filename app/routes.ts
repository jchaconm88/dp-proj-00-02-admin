import { route, index } from "@react-router/dev/routes";

export default [
  route("login", "routes/Login.tsx"),
  route("registro", "routes/Registro.tsx"),
  route("onboarding", "routes/OnboardingLayout.tsx", [
    index("routes/Onboarding.tsx"),
  ]),
  route("", "routes/Dashboard.tsx", [
    index("routes/DashboardHome.tsx"),
    route("billing/usage", "routes/BillingUsage.tsx"),
    route("users", "routes/system/UsersPage.tsx"),
    route("roles", "routes/system/RolesPage.tsx"),
    route("roles/:id", "routes/system/RolesDetail.tsx"),
    route("sequences", "routes/system/sequences/SequencesPage.tsx", [
      route("add", "routes/system/sequences/SequenceAdd.tsx"),
      route("edit/:id", "routes/system/sequences/SequenceEdit.tsx"),
    ]),
    route("web-users", "routes/platform/web-users/WebUsersPage.tsx"),
    route("company-roles", "routes/platform/company-roles/CompanyRolesPage.tsx"),
    route("company-roles/:id", "routes/platform/company-roles/CompanyRolesDetail.tsx"),
    route("accounts", "routes/platform/accounts/AccountsRedirect.tsx"),
    route("account", "routes/system/account/AccountPage.tsx"),
    route("companies", "routes/platform/companies/CompaniesPage.tsx"),
    route("companies/add", "routes/platform/companies/CompaniesPage.tsx", {
      id: "routes/platform/companies/CompaniesPage/add",
    }),
    route("companies/edit/:id", "routes/platform/companies/CompaniesPage.tsx", {
      id: "routes/platform/companies/CompaniesPage/edit",
    }),
    route("companies/:id/company-users", "routes/platform/companies/CompanyUsersPage.tsx", [
      route("add", "routes/platform/companies/CompanyUserAdd.tsx"),
      route("edit/:companyUserDocId", "routes/platform/companies/CompanyUserEdit.tsx"),
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
