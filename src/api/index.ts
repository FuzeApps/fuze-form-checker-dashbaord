import { apiClient } from './client';
import type {
  LoginResponse,
  TenantUser,
  AnalysisSession,
  AnalysisSessionDetail,
  ArtifactUrls,
  TimelineEventItem,
  ApiKey,
  ApiKeyCreated,
  WebhookConfig,
  UsageSummary,
  AuditLog,
  PaginatedResponse,
  Tenant,
  App,
  WebhookEvent,
  DlqMessage,
  QuotaPolicy,
  ExerciseConfigRecord,
} from '@/types/api';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  apiClient.post<LoginResponse>('/v1/dashboard/auth/login', { email, password }).then((r) => r.data);

export const getMe = () =>
  apiClient.get<TenantUser>('/v1/dashboard/auth/me').then((r) => r.data);

// ─── Analyses (Tenant) ────────────────────────────────────────────────────────
export const getAnalyses = (params?: Record<string, unknown>) =>
  apiClient
    .get<PaginatedResponse<AnalysisSession>>('/v1/dashboard/analyses', { params })
    .then((r) => r.data);

export const getAnalysis = (id: string) =>
  apiClient.get<AnalysisSessionDetail>(`/v1/dashboard/analyses/${id}`).then((r) => r.data);

export const getAnalysisTimeline = (id: string, params?: { start?: number; end?: number }) =>
  apiClient
    .get<{ analysisId: string; duration: number; events: TimelineEventItem[] }>(
      `/v1/dashboard/analyses/${id}/timeline`,
      { params }
    )
    .then((r) => r.data);

export const getAnalysisArtifacts = (id: string) =>
  apiClient.get<ArtifactUrls>(`/v1/dashboard/analyses/${id}/artifacts`).then((r) => r.data);

// ─── API Keys ────────────────────────────────────────────────────────────────
export const getApiKeys = () =>
  apiClient.get<{ keys: ApiKey[] }>('/v1/dashboard/api-keys').then((r) => r.data.keys);

export const createApiKey = (data: {
  name: string;
  type: 'public' | 'secret';
  environment: 'test' | 'live';
  appId?: string;
}) => apiClient.post<ApiKeyCreated>('/v1/dashboard/api-keys', data).then((r) => r.data);

export const revokeApiKey = (id: string) =>
  apiClient.delete(`/v1/dashboard/api-keys/${id}`).then((r) => r.data);

// ─── Webhook ──────────────────────────────────────────────────────────────────
export const getWebhook = () =>
  apiClient.get<WebhookConfig | null>('/v1/dashboard/webhook').then((r) => r.data);

export const upsertWebhook = (data: { url: string; secret: string; enabled: boolean }) =>
  apiClient.put<WebhookConfig>('/v1/dashboard/webhook', data).then((r) => r.data);

// ─── Usage ────────────────────────────────────────────────────────────────────
export const getUsage = () =>
  apiClient.get<UsageSummary>('/v1/dashboard/usage').then((r) => r.data);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const getAuditLogs = (params?: { page?: number; limit?: number }) =>
  apiClient
    .get<PaginatedResponse<AuditLog>>('/v1/dashboard/audit-logs', { params })
    .then((r) => r.data);

// ─── Admin: Tenants ───────────────────────────────────────────────────────────
export const adminGetTenants = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Tenant>>('/v1/admin/tenants', { params }).then((r) => r.data);

export const adminCreateTenant = (data: { name: string; plan: string }) =>
  apiClient.post<Tenant>('/v1/admin/tenants', data).then((r) => r.data);

export const adminGetTenant = (id: string) =>
  apiClient.get<Tenant & { apps: App[]; quotaPolicies: QuotaPolicy[] }>(`/v1/admin/tenants/${id}`).then((r) => r.data);

export const adminUpdateTenant = (id: string, data: Record<string, unknown>) =>
  apiClient.patch<Tenant>(`/v1/admin/tenants/${id}`, data).then((r) => r.data);

export const adminCreateTenantUser = (
  tenantId: string,
  data: { name: string; email: string; password: string; role: string }
) => apiClient.post(`/v1/admin/tenants/${tenantId}/users`, data).then((r) => r.data);

export const adminUpsertQuota = (tenantId: string, data: QuotaPolicy) =>
  apiClient.put(`/v1/admin/tenants/${tenantId}/quota`, data).then((r) => r.data);

// ─── Admin: Apps ──────────────────────────────────────────────────────────────
export const adminGetApps = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<App & { tenant: { name: string } }>>('/v1/admin/apps', { params }).then((r) => r.data);

// ─── Admin: Sessions ──────────────────────────────────────────────────────────
export const adminGetSessions = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<AnalysisSession>>('/v1/admin/analysis-sessions', { params }).then((r) => r.data);

export const adminGetSession = (id: string) =>
  apiClient.get<AnalysisSessionDetail>(`/v1/admin/analysis-sessions/${id}`).then((r) => r.data);

export const adminGetFailedJobs = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<AnalysisSession>>('/v1/admin/failed-jobs', { params }).then((r) => r.data);

export const adminRetryJob = (id: string) =>
  apiClient.post(`/v1/admin/analysis-sessions/${id}/retry`).then((r) => r.data);

// ─── Admin: Usage ─────────────────────────────────────────────────────────────
export const adminGetUsage = () =>
  apiClient.get('/v1/admin/usage').then((r) => r.data);

// ─── Admin: Webhook Events ────────────────────────────────────────────────────
export const adminGetWebhookEvents = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<WebhookEvent>>('/v1/admin/webhook-events', { params }).then((r) => r.data);

// ─── Admin: DLQ ───────────────────────────────────────────────────────────────
export const adminGetDlq = () =>
  apiClient.get<{ messages: DlqMessage[] }>('/v1/admin/dlq').then((r) => r.data);

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────
export const adminGetAuditLogs = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<AuditLog>>('/v1/admin/audit-logs', { params }).then((r) => r.data);

// ─── Admin: Exercise Configs ──────────────────────────────────────────────────
export const adminGetExerciseConfigs = () =>
  apiClient.get<{ configs: ExerciseConfigRecord[] }>('/v1/admin/exercise-configs').then((r) => r.data.configs);

export const adminGetExerciseConfig = (exerciseType: string) =>
  apiClient.get<ExerciseConfigRecord>(`/v1/admin/exercise-configs/${exerciseType}`).then((r) => r.data);

export const adminGenerateExerciseConfig = (exerciseType: string) =>
  apiClient.post<ExerciseConfigRecord>('/v1/admin/exercise-configs', { exerciseType }).then((r) => r.data);

export const adminRegenerateExerciseConfig = (exerciseType: string) =>
  apiClient.post<ExerciseConfigRecord>(`/v1/admin/exercise-configs/${exerciseType}/regenerate`).then((r) => r.data);

export const adminUpdateExerciseConfig = (exerciseType: string, data: { config?: object; status?: string }) =>
  apiClient.patch<ExerciseConfigRecord>(`/v1/admin/exercise-configs/${exerciseType}`, data).then((r) => r.data);

export const adminDeleteExerciseConfig = (exerciseType: string) =>
  apiClient.delete(`/v1/admin/exercise-configs/${exerciseType}`).then((r) => r.data);

// ─── Test Upload ──────────────────────────────────────────────────────────────
export const createTestUploadSession = (data: {
  exerciseType: string;
  externalUserId: string;
  appId?: string;
}) =>
  apiClient
    .post<{ analysisId: string; uploadUrl: string; objectKey: string; expiresIn: number }>(
      '/v1/dashboard/test-upload',
      data
    )
    .then((r) => r.data);

export const confirmTestUpload = (analysisId: string) =>
  apiClient
    .post<{ analysisId: string; status: string }>(`/v1/dashboard/test-upload/${analysisId}/confirm`)
    .then((r) => r.data);

export const pollAnalysisStatus = (analysisId: string) =>
  apiClient
    .get<{ analysisId: string; status: string; progress: number; stage: string | null }>(
      `/v1/sdk/analyses/${analysisId}/status`
    )
    .then((r) => r.data);
