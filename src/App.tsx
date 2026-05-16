import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Tenant pages
import LoginPage from '@/pages/tenant/Login';
import OverviewPage from '@/pages/tenant/Overview';
import AnalysesPage from '@/pages/tenant/Analyses';
import AnalysisDetailPage from '@/pages/tenant/AnalysisDetail';
import ApiKeysPage from '@/pages/tenant/ApiKeys';
import WebhookPage from '@/pages/tenant/WebhookSettings';
import UsagePage from '@/pages/tenant/Usage';
import AuditLogsPage from '@/pages/tenant/AuditLogs';
import TestUploadPage from '@/pages/tenant/TestUpload';

// Admin pages
import AdminTenantsPage from '@/pages/admin/Tenants';
import AdminTenantDetailPage from '@/pages/admin/TenantDetail';
import {
  AdminFailedJobsPage,
  AdminSessionsPage,
  AdminAppsPage,
} from '@/pages/admin/Sessions';
import {
  AdminWebhookEventsPage,
  AdminDlqPage,
  AdminUsagePage,
  AdminAuditLogsPage,
} from '@/pages/admin/AdminMisc';
import AdminExerciseConfigsPage from '@/pages/admin/ExerciseConfigs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              {/* Tenant */}
              <Route path="/" element={<OverviewPage />} />
              <Route path="/analyses" element={<AnalysesPage />} />
              <Route path="/analyses/:id" element={<AnalysisDetailPage />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/webhook" element={<WebhookPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/test" element={<TestUploadPage />} />
              {/* Admin */}
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
              <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
              <Route path="/admin/apps" element={<AdminAppsPage />} />
              <Route path="/admin/analyses" element={<AdminSessionsPage />} />
              <Route path="/admin/usage" element={<AdminUsagePage />} />
              <Route path="/admin/failed-jobs" element={<AdminFailedJobsPage />} />
              <Route path="/admin/webhook-events" element={<AdminWebhookEventsPage />} />
              <Route path="/admin/dlq" element={<AdminDlqPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/exercise-configs" element={<AdminExerciseConfigsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
