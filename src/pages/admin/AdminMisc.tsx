import { useQuery } from '@tanstack/react-query';
import { adminGetWebhookEvents, adminGetDlq, adminGetAuditLogs, adminGetUsage } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Inbox, Mail, BarChart2, ClipboardList } from 'lucide-react';

export function AdminWebhookEventsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-webhook-events'], queryFn: () => adminGetWebhookEvents() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webhook Events</h1>
        <p className="text-muted-foreground">Delivery log for all tenant webhook events.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell><code className="text-xs bg-muted rounded px-1">{ev.eventType}</code></TableCell>
                  <TableCell>{ev.tenant?.name ?? ev.tenantId.slice(-8)}</TableCell>
                  <TableCell>
                    <Badge className={ev.status === 'delivered' ? 'bg-green-100 text-green-700' : ev.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                      {ev.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ev.responseStatus ?? '—'}</TableCell>
                  <TableCell>{ev.retryCount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(ev.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDlqPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dlq'], queryFn: adminGetDlq });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dead Letter Queue</h1>
        <p className="text-muted-foreground">Messages that failed all SQS retry attempts.</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data?.messages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-green-600">
            <Inbox className="h-8 w-8 mx-auto mb-2" />
            DLQ is empty — no failed messages.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.messages.map((msg) => (
            <Card key={msg.messageId}>
              <CardHeader>
                <CardTitle className="text-sm font-mono">{msg.messageId}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-40">
                  {JSON.stringify(msg.body, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminUsagePage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-usage'], queryFn: adminGetUsage });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Usage</h1>
        <p className="text-muted-foreground">Usage statistics across all tenants.</p>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Sessions', value: (data as { totalSessions: number })?.totalSessions },
            { label: 'Completed', value: (data as { completedSessions: number })?.completedSessions },
            { label: 'Failed', value: (data as { failedSessions: number })?.failedSessions },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold mt-1">{(value as number)?.toLocaleString() ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminAuditLogsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-audit-logs'], queryFn: () => adminGetAuditLogs() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Platform-wide audit trail.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell><code className="text-xs bg-muted rounded px-1">{log.action}</code></TableCell>
                  <TableCell>{log.tenant?.name ?? log.tenantId.slice(-8)}</TableCell>
                  <TableCell>{log.actor?.email ?? 'System'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.entityType} #{log.entityId.slice(-8)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
