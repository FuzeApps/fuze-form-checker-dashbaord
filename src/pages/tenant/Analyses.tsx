import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAnalyses } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { statusColor, formatDate, scoreColor } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnalysisStatus } from '@/types/api';

const STATUS_OPTIONS: Array<{ value: AnalysisStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued', label: 'Queued' },
];

export default function AnalysesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AnalysisStatus | ''>('');
  const [exerciseFilter, setExerciseFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['analyses', { page, status, exerciseType: exerciseFilter || undefined }],
    queryFn: () =>
      getAnalyses({ page, limit: 20, status: status || undefined, exerciseType: exerciseFilter || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analyses</h1>
        <p className="text-muted-foreground">Browse all form analysis sessions.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Sessions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Exercise type..."
                  value={exerciseFilter}
                  onChange={(e) => { setExerciseFilter(e.target.value); setPage(1); }}
                  className="pl-8 w-40"
                />
              </div>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as AnalysisStatus | ''); setPage(1); }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No analyses found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((a) => (
                  <TableRow key={a.id} onClick={() => navigate(`/analyses/${a.id}`)}>
                    <TableCell className="font-mono text-xs">{a.externalUserId}</TableCell>
                    <TableCell className="capitalize">{a.exerciseType}</TableCell>
                    <TableCell>{a.app?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {a.analysisResult ? (
                        <span className={`font-semibold ${scoreColor(a.analysisResult.overallScore)}`}>
                          {a.analysisResult.overallScore}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{a.analysisResult?.repCount ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.meta.total)} of {data.meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page === data.meta.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
