import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { LoginPage } from "@/pages/LoginPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { MailsPage } from "@/pages/MailsPage";
import { DonationsPage } from "@/pages/DonationsPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { VideosPage } from "@/pages/VideosPage";
import {
  AnnualReportsPage,
  CareerGuidesPage,
  MentorResourcesPage,
} from "@/pages/ResourcePages";
import { CourseSignupsPage } from "@/pages/CourseSignupsPage";
import { TeamPage } from "@/pages/TeamPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoutes() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <AdminShell />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/admin-portal">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoutes />}>
              <Route index element={<OverviewPage />} />
              <Route path="mails" element={<MailsPage />} />
              <Route path="donations" element={<DonationsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="career-guides" element={<CareerGuidesPage />} />
              <Route path="annual-reports" element={<AnnualReportsPage />} />
              <Route path="mentor-resources" element={<MentorResourcesPage />} />
              <Route path="course-signups" element={<CourseSignupsPage />} />
              <Route path="team" element={<TeamPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
