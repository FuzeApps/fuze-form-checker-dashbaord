// ─── Enums / Literals ────────────────────────────────────────────────────────
export type TenantStatus = 'active' | 'suspended';
export type TenantPlan = 'sandbox' | 'startup' | 'growth' | 'enterprise';
export type AppPlatform = 'ios' | 'android' | 'flutter' | 'react_native' | 'web';
export type AppStatus = 'active' | 'disabled';
export type TenantUserRole = 'owner' | 'admin' | 'viewer';
export type ApiKeyType = 'public' | 'secret';
export type ApiKeyEnvironment = 'test' | 'live';
export type ApiKeyStatus = 'active' | 'revoked';
export type AnalysisStatus = 'pending' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
export type IssueSeverity = 'info' | 'low' | 'medium' | 'high';
export type WebhookEventStatus = 'pending' | 'delivered' | 'failed';

// ─── Domain Models ────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  createdAt: string;
  updatedAt: string;
  _count?: { analysisSessions: number; apps: number; users: number };
}

export interface App {
  id: string;
  tenantId: string;
  name: string;
  platform: AppPlatform;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: TenantUserRole;
  tenantPlan: TenantPlan;
  tenantStatus: TenantStatus;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  type: ApiKeyType;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  appId: string | null;
  app?: { name: string } | null;
}

export interface ApiKeyCreated extends ApiKey {
  rawKey: string;
  warning: string;
}

export interface CategoryScores {
  stability: number;
  bracingAndCore: number;
  rangeOfMotion: number;
  posture: number;
  movementQuality: number;
}

export interface IssueDetail {
  category: string;
  type: string;
  severity: IssueSeverity;
  scoreImpact: number;
  message: string;
  repNumbers?: number[];
  timestamps?: number[];
  detectedBy?: 'pose' | 'vision';
  description?: string;
  correction?: string;
  visibleEvidence?: string;
}

export interface AnalysisSession {
  id: string;
  externalUserId: string;
  exerciseType: string;
  status: AnalysisStatus;
  progress: number;
  stage: string | null;
  createdAt: string;
  completedAt: string | null;
  appId: string;
  failureReason?: string | null;
  app?: { name: string; platform: AppPlatform } | null;
  analysisResult?: {
    overallScore: number;
    repCount: number;
    scoreLabel: string;
  } | null;
}

export interface AnalysisSessionDetail extends AnalysisSession {
  tenant?: Tenant;
  analysisResult: {
    id: string;
    overallScore: number;
    scoreLabel: string;
    exerciseName: string;
    repCount: number;
    categories: CategoryScores;
    summary: string;
    issues: IssueDetail[];
    recommendations: string[];
    keyStrengths?: string[];
    nextSessionFocus?: string;
    timelineObjectKey: string | null;
    landmarksObjectKey: string | null;
    overlayObjectKey: string | null;
  } | null;
  timelineEvents: TimelineEventItem[];
}

export interface TimelineEventItem {
  id?: string;
  timestamp: number;
  frame: number;
  type: string;
  issueType?: string;
  severity?: IssueSeverity;
  message: string;
  bodyRegions?: Array<{ part: string; x: number; y: number; intensity: number }>;
  repNumber?: number;
}

export interface ArtifactUrls {
  analysisId: string;
  video: string | null;
  timeline: string | null;
  overlay: string | null;
  landmarks: string | null;
  expiresIn: number;
}

export interface WebhookConfig {
  id: string;
  url: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  tenantId: string;
  analysisSessionId: string;
  eventType: string;
  status: WebhookEventStatus;
  responseStatus: number | null;
  retryCount: number;
  createdAt: string;
  deliveredAt: string | null;
  tenant?: { name: string };
}

export interface UsageSummary {
  monthly: { totalEvents: number; billableUnits: number };
  daily: Array<{ day: string; count: number }>;
  byApp: Array<{ appId: string; count: number; billableUnits: number }>;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: { name: string; email: string } | null;
  tenant?: { name: string };
}

export interface DlqMessage {
  messageId: string;
  body: Record<string, unknown> | null;
  attributes: Record<string, string>;
  receivedAt: string;
}

// ─── Paginated response ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: TenantUser;
}

export interface QuotaPolicy {
  id: string;
  tenantId: string;
  appId: string | null;
  maxAnalysesPerDay: number;
  maxAnalysesPerUserPerDay: number;
  maxVideoDurationSeconds: number;
  allowedExercises: string[];
  rolloutPercentage: number;
}

// ─── Exercise Config ──────────────────────────────────────────────────────────
export type ExerciseConfigStatus = 'pending_review' | 'approved' | 'deprecated';

export interface ExerciseConfigRecord {
  id: string;
  exerciseType: string;
  displayName: string;
  config: Record<string, unknown>;
  status: ExerciseConfigStatus;
  generatedBy: string;
  modelVersion: string | null;
  reviewedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
