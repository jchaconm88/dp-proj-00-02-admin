import { route, index } from "@react-router/dev/routes";

export default [
  index("routes/Dashboard.tsx"),
  route("login", "routes/Login.tsx"),
  route("accounts", "routes/Accounts.tsx"),
  route("companies", "routes/Companies.tsx"),
  route("plans", "routes/Plans.tsx"),
  route("subscriptions", "routes/Subscriptions.tsx"),
  route("billing/usage", "routes/BillingUsage.tsx"),
  route("onboarding", "routes/Onboarding.tsx")
];

