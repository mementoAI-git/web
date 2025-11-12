import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import {
  AcceptInvitePage,
  BeneficiaryPage,
  ChatLandingPage,
  ChatPage,
  CheckMailPage,
  ConfirmEmailPage,
  DashboardLayout,
  ExploreCategoryPage,
  ExplorePage,
  ForgetPasswordPage,
  HomePage,
  LoginPage,
  MiscPage,
  NicknamePage,
  OnboardLayout,
  OnboardPage,
  OverviewPage,
  PostPage,
  RecentConversationPage,
  RegisterPage,
  ReplyPage,
  SetPasswordPage,
  SuggestedConversationPage,
  VerifyEmailPage,
  StoriesPage,
  StoriesDetailsPage
} from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: null,
    children: [
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
        element: <DashboardLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "overview", index: true, element: <OverviewPage /> },
          { path: "explore", element: <ExplorePage /> },
          { path: "explore/categories", element: <ExplorePage /> },
          { path: "explore/categories/:id", element: <ExploreCategoryPage /> },
          { path: "chat", element: <ChatLandingPage /> },
          { path: "chat/conversations", element: <RecentConversationPage /> },
          { path: "chat/suggested-conversations", element: <SuggestedConversationPage /> },
          { path: "chat/reply/:id", element: <ReplyPage /> },
          { path: "chat/:id", element: <ChatPage /> },
          { path: "stories", element: <StoriesPage /> },
          { path: "stories/:id", element: <StoriesDetailsPage /> },
        ],
      },
    ],
  },
]);

