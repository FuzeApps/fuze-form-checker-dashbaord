import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminGetTenants, adminCreateTenant } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminTenantsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', plan: 'sandbox' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants', page],
    queryFn: () => adminGetTenants({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      setShowCreate(false);
      setForm({ name: '', plan: 'sandbox' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all B2B customers on the platform.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          New Tenant
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create Tenant</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
              className="flex gap-4 items-end"
            >
              <div className="space-y-2 flex-1">
                <Label>Company Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="sandbox">Sandbox</option>
                  <option value="startup">Startup</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Button type="submit" loading={createMutation.isPending}>Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Apps</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : (
                data?.data.map((t) => (
                  <TableRow key={t.id} onClick={() => window.location.href = `/admin/tenants/${t.id}`}>
                    <TableCell className="font-medium">
                      <Link to={`/admin/tenants/${t.id}`} className="hover:underline">{t.name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{t.plan}</TableCell>
                    <TableCell>{t._count?.apps ?? '—'}</TableCell>
                    <TableCell>{t._count?.analysisSessions?.toLocaleString() ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {data.meta.pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page === data.meta.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
