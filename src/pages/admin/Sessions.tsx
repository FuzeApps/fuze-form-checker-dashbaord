import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminGetFailedJobs, adminRetryJob, adminGetSessions, adminGetApps } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminFailedJobsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-failed-jobs', page],
    queryFn: () => adminGetFailedJobs({ page, limit: 20 }),
  });

  const retryMutation = useMutation({
    mutationFn: adminRetryJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-failed-jobs'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Failed Jobs</h1>
        <p className="text-muted-foreground">Review and retry failed analysis jobs.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analysis ID</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Failure Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-green-600">No failed jobs. All clear!</TableCell></TableRow>
              ) : (
                data?.data.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <button onClick={() => navigate(`/admin/analyses/${job.id}`)} className="font-mono text-xs text-primary hover:underline">
                        {job.id.slice(-12)}
                      </button>
                    </TableCell>
                    <TableCell className="capitalize">{job.exerciseType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {job.failureReason ?? 'Unknown error'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={retryMutation.isPending}
                        onClick={() => retryMutation.mutate(job.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.meta.pages > 1 && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" disabled={page === data.meta.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

export function AdminSessionsPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', page],
    queryFn: () => adminGetSessions({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analysis Sessions</h1>
        <p className="text-muted-foreground">Cross-tenant session browser.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.map((s) => (
                <TableRow key={s.id} onClick={() => navigate(`/admin/analyses/${s.id}`)}>
                  <TableCell className="font-mono text-xs">{s.id.slice(-12)}</TableCell>
                  <TableCell className="capitalize">{s.exerciseType}</TableCell>
                  <TableCell>
                    <Badge className={s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.analysisResult?.overallScore ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(s.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {data && data.meta.pages > 1 && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" disabled={page === data.meta.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

export function AdminAppsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-apps'],
    queryFn: () => adminGetApps(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Apps</h1>
        <p className="text-muted-foreground">All registered mobile apps across tenants.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell className="capitalize">{app.platform.replace('_', ' ')}</TableCell>
                  <TableCell>{app.tenant?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={app.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{app.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
