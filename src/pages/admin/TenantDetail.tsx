import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetTenant, adminUpdateTenant, adminUpsertQuota, adminCreateTenantUser } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Save, UserPlus } from 'lucide-react';
import type { QuotaPolicy } from '@/types/api';

export default function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [quotaForm, setQuotaForm] = useState<Partial<QuotaPolicy>>({});

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => adminGetTenant(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminUpdateTenant(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tenant', id] }); setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const quotaMutation = useMutation({
    mutationFn: (data: QuotaPolicy) => adminUpsertQuota(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  });

  const addUserMutation = useMutation({
    mutationFn: (data: typeof userForm) => adminCreateTenantUser(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tenant', id] }); setShowAddUser(false); },
  });

  if (isLoading || !tenant) return <p className="text-muted-foreground p-6">Loading...</p>;

  const quota = (tenant as typeof tenant & { quotaPolicies: QuotaPolicy[] }).quotaPolicies?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/tenants">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" />Tenants</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <div className="flex gap-2 mt-1">
            <Badge className={tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{tenant.status}</Badge>
            <Badge className="bg-blue-100 text-blue-700">{tenant.plan}</Badge>
          </div>
        </div>
      </div>

      {/* Status / Plan controls */}
      <Card>
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                defaultValue={tenant.status}
                onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <select
                defaultValue={tenant.plan}
                onChange={(e) => updateMutation.mutate({ plan: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {['sandbox', 'startup', 'growth', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {saved && <p className="text-sm text-green-600 mt-2">Saved.</p>}
        </CardContent>
      </Card>

      {/* Quota policy */}
      <Card>
        <CardHeader>
          <CardTitle>Quota &amp; Rollout</CardTitle>
        </CardHeader>
        <CardContent>
          {!quota && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
              <strong>No quota policy set.</strong> This tenant cannot upload videos until you save one.
              Set <strong>Rollout&nbsp;%</strong> to <strong>100</strong> to allow all users through.
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              quotaMutation.mutate({ ...quota, ...quotaForm, allowedExercises: quota?.allowedExercises ?? [] } as QuotaPolicy);
            }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { key: 'maxAnalysesPerDay',        label: 'Max Analyses / Day',       hint: 'Total across all users',          default: quota?.maxAnalysesPerDay        ?? 100 },
              { key: 'maxAnalysesPerUserPerDay',  label: 'Max Analyses / User / Day', hint: 'Per externalUserId per day',     default: quota?.maxAnalysesPerUserPerDay  ?? 10  },
              { key: 'maxVideoDurationSeconds',   label: 'Max Video Duration (s)',    hint: '30–300 s',                       default: quota?.maxVideoDurationSeconds   ?? 60  },
              { key: 'rolloutPercentage',         label: 'Rollout %',                hint: '100 = all users; < 100 = staged', default: quota?.rolloutPercentage         ?? 100 },
            ].map(({ key, label, hint, default: def }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  defaultValue={def}
                  onChange={(e) => setQuotaForm({ ...quotaForm, [key]: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" loading={quotaMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {quota ? 'Update Quota' : 'Save Quota (Required)'}
              </Button>
              {quotaMutation.isSuccess && (
                <span className="text-sm text-green-600 dark:text-green-400">Saved ✓</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {showAddUser && (
            <form
              onSubmit={(e) => { e.preventDefault(); addUserMutation.mutate(userForm); }}
              className="grid grid-cols-2 gap-3 mb-4 p-4 bg-muted rounded-lg"
            >
              <div className="space-y-1"><Label>Name</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Password</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required /></div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" size="sm" loading={addUserMutation.isPending}>Create User</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              </div>
            </form>
          )}
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left p-2 text-muted-foreground font-medium">Name</th><th className="text-left p-2 text-muted-foreground font-medium">Email</th><th className="text-left p-2 text-muted-foreground font-medium">Role</th></tr></thead>
            <tbody>
              {((tenant as typeof tenant & { users: Array<{ id: string; name: string; email: string; role: string }> }).users ?? []).map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2 text-muted-foreground">{u.email}</td>
                  <td className="p-2"><Badge className="bg-secondary text-secondary-foreground">{u.role}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
