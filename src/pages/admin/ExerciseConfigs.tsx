import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetExerciseConfigs,
  adminGenerateExerciseConfig,
  adminRegenerateExerciseConfig,
  adminUpdateExerciseConfig,
  adminDeleteExerciseConfig,
} from '@/api';
import type { ExerciseConfigRecord } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  Brain,
  Plus,
  RefreshCw,
  CheckCircle,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-700',
  deprecated: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  deprecated: 'Deprecated',
};

export default function AdminExerciseConfigsPage() {
  const qc = useQueryClient();
  const [generateInput, setGenerateInput] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ExerciseConfigRecord | null>(null);
  const [editingJson, setEditingJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin-exercise-configs'],
    queryFn: adminGetExerciseConfigs,
  });

  const generateMutation = useMutation({
    mutationFn: (exerciseType: string) => adminGenerateExerciseConfig(exerciseType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exercise-configs'] });
      setGenerateInput('');
      setShowGenerate(false);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (exerciseType: string) => adminRegenerateExerciseConfig(exerciseType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-exercise-configs'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (exerciseType: string) =>
      adminUpdateExerciseConfig(exerciseType, { status: 'approved' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exercise-configs'] });
      if (selectedConfig) {
        setSelectedConfig((prev) => prev ? { ...prev, status: 'approved' } : prev);
      }
    },
  });

  const saveJsonMutation = useMutation({
    mutationFn: ({ exerciseType, config }: { exerciseType: string; config: object }) =>
      adminUpdateExerciseConfig(exerciseType, { config }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-exercise-configs'] });
      setSelectedConfig(updated);
      setEditingJson('');
      setJsonError('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteExerciseConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exercise-configs'] });
      setSelectedConfig(null);
    },
  });

  function openConfig(cfg: ExerciseConfigRecord) {
    setSelectedConfig(cfg);
    setEditingJson(JSON.stringify(cfg.config, null, 2));
    setJsonError('');
  }

  function handleSaveJson() {
    try {
      const parsed = JSON.parse(editingJson) as object;
      setJsonError('');
      saveJsonMutation.mutate({ exerciseType: selectedConfig!.exerciseType, config: parsed });
    } catch {
      setJsonError('Invalid JSON — please fix syntax errors before saving.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Exercise Configs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated analysis configurations for each exercise type. Review and approve before use.
          </p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Config
        </Button>
      </div>

      {/* Generate new config panel */}
      {showGenerate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Config via AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. barbell_bench_press, hip_thrust, bulgarian_split_squat"
                value={generateInput}
                onChange={(e) => setGenerateInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateMutation.mutate(generateInput.trim())}
              />
              <Button
                onClick={() => generateMutation.mutate(generateInput.trim())}
                disabled={!generateInput.trim() || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {generateMutation.isPending ? 'Generating…' : 'Generate'}
              </Button>
              <Button variant="outline" onClick={() => setShowGenerate(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Uses GPT-4o-mini to create rep detection + issue detection rules. Review and approve the result.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config list */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <td colSpan={4} className="text-center py-10 text-muted-foreground text-sm px-4">
                      Loading…
                    </td>
                  </TableRow>
                ) : !configs?.length ? (
                  <TableRow>
                    <td colSpan={4} className="text-center py-10 text-muted-foreground text-sm px-4">
                      No configs yet. Generate one above.
                    </td>
                  </TableRow>
                ) : (
                  configs.map((cfg) => (
                    <TableRow
                      key={cfg.id}
                      className={`cursor-pointer hover:bg-muted/40 ${selectedConfig?.id === cfg.id ? 'bg-muted/60' : ''}`}
                      onClick={() => openConfig(cfg)}
                    >
                      <TableCell>
                        <div className="font-medium">{cfg.displayName}</div>
                        <div className="text-xs text-muted-foreground">{cfg.exerciseType}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize text-muted-foreground">{cfg.generatedBy}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[cfg.status] ?? ''}>
                          {STATUS_LABELS[cfg.status] ?? cfg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          {cfg.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => approveMutation.mutate(cfg.exerciseType)}
                              disabled={approveMutation.isPending}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => regenerateMutation.mutate(cfg.exerciseType)}
                            disabled={regenerateMutation.isPending && regenerateMutation.variables === cfg.exerciseType}
                            title="Regenerate via AI"
                          >
                            <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending && regenerateMutation.variables === cfg.exerciseType ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteMutation.mutate(cfg.exerciseType)}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Config detail panel */}
        {selectedConfig ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedConfig.displayName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      v{selectedConfig.version} · {selectedConfig.generatedBy} · Updated {formatDate(selectedConfig.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[selectedConfig.status] ?? ''}>
                      {STATUS_LABELS[selectedConfig.status] ?? selectedConfig.status}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedConfig(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rep detection summary */}
                <RepDetectionSummary config={selectedConfig.config} />

                {/* Issues summary */}
                <IssuesSummary config={selectedConfig.config} />

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {selectedConfig.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(selectedConfig.exerciseType)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Approve Config
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateMutation.mutate(selectedConfig.exerciseType)}
                    disabled={regenerateMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                    Regenerate via AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* JSON editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Raw Config JSON</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="w-full h-64 font-mono text-xs rounded-md border border-input bg-muted/30 p-3 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  value={editingJson}
                  onChange={(e) => { setEditingJson(e.target.value); setJsonError(''); }}
                  spellCheck={false}
                />
                {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
                <Button
                  size="sm"
                  onClick={handleSaveJson}
                  disabled={saveJsonMutation.isPending}
                >
                  {saveJsonMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Select a config to inspect and edit it
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RepDetectionSummary({ config }: { config: Record<string, unknown> }) {
  const rd = config.repDetection as Record<string, unknown> | undefined;
  if (!rd) return null;

  return (
    <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Rep Detection</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Angle</span>
          <p className="font-mono font-medium text-xs">{String(rd.primaryAngle ?? '—')}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Descent ↓</span>
          <p className="font-medium text-xs">&lt; {String(rd.descentThreshold ?? '—')}°</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Ascent ↑</span>
          <p className="font-medium text-xs">&gt; {String(rd.ascentThreshold ?? '—')}°</p>
        </div>
      </div>
    </div>
  );
}

function IssuesSummary({ config }: { config: Record<string, unknown> }) {
  const issues = config.issues as Array<Record<string, unknown>> | undefined;
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!issues?.length) return null;

  const severityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Detected Issues ({issues.length})
      </p>
      <div className="space-y-1.5">
        {issues.map((issue) => {
          const key = String(issue.type ?? '');
          const isOpen = expanded === key;
          const condition = issue.condition as Record<string, unknown> | undefined;

          return (
            <div
              key={key}
              className="rounded-md border bg-muted/20 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(isOpen ? null : key)}
              >
                <div className="flex items-center gap-2">
                  <Badge className={`${severityColors[String(issue.severity ?? 'low')]} text-xs py-0 px-1.5`}>
                    {String(issue.severity ?? 'low')}
                  </Badge>
                  <span className="text-sm font-mono">{key}</span>
                </div>
                {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t bg-white/50">
                  <p className="text-xs text-muted-foreground pt-2">{String(issue.message ?? '')}</p>
                  {condition && (
                    <div className="rounded bg-muted/40 p-2 font-mono text-xs">
                      {condition.type === 'angle_asymmetry'
                        ? `|${String(condition.leftAngle)} − ${String(condition.rightAngle)}| > ${String(condition.threshold)}°`
                        : `${String(condition.angle)} ${String(condition.operator)} ${String(condition.threshold)}°`}
                      {condition.phase != null && condition.phase !== 'any' && (
                        <span className="ml-2 text-purple-600">[{String(condition.phase)}]</span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Category: <strong>{String(issue.category ?? '')}</strong></span>
                    <span>Impact: <strong className="text-red-500">{String(issue.scoreImpact ?? '')}</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
