import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import {
  AcceptInvitePage,
  BeneficiaryPage,
  CheckMailPage,
  ConfirmEmailPage,
  DashboardLayout,
  ForgetPasswordPage,
  HomePage,
  LoginPage,
  MiscPage,
  NicknamePage,
  OnboardLayout,
  OnboardPage,
  OverviewPage,
  PostPage,
  RegisterPage,
  SetPasswordPage,
  VerifyEmailPage,
} from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forget-password", element: <ForgetPasswordPage /> },
      { path: "check-mail", element: <CheckMailPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "confirm-email", element: <ConfirmEmailPage /> },
      { path: "set-password", element: <SetPasswordPage /> },
      { path: "accept-invite/:id", element: <AcceptInvitePage /> },
      { path: "post/:id", element: <PostPage /> },
      {
        path: "onboard",
        element: <OnboardLayout />,
        children: [
          { index: true, element: <OnboardPage /> },
          { path: "nickname", element: <NicknamePage /> },
          { path: "misc", element: <MiscPage /> },
          { path: "beneficiary", element: <BeneficiaryPage /> },
        ],
      },
      {
        path: "overview",
        element: <DashboardLayout />,
        children: [{ index: true, element: <OverviewPage /> }],
      },
    ],
  },
]);

