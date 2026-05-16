import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiKeys, createApiKey, revokeApiKey } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Plus, Copy, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import type { ApiKeyCreated } from '@/types/api';

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'public' as 'public' | 'secret',
    environment: 'live' as 'test' | 'live',
  });
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: getApiKeys,
  });

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      setNewKey(data);
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage authentication keys for your mobile apps.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* New key reveal modal */}
      {newKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Save your API key — it will not be shown again
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-green-300 bg-white p-3 font-mono text-sm">
              <span className="flex-1 break-all">{newKey.rawKey}</span>
              <button
                onClick={() => copyKey(newKey.rawKey)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-700">Copied to clipboard!</p>}
            <Button variant="outline" size="sm" onClick={() => setNewKey(null)}>
              I've saved it
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="iOS Production Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'public' | 'secret' })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="public">Public (SDK)</option>
                  <option value="secret">Secret (Server)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <select
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value as 'test' | 'live' })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="live">Live</option>
                  <option value="test">Test</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" loading={createMutation.isPending}>
                  Generate Key
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : keys.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No API keys yet.</TableCell></TableRow>
              ) : (
                keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted rounded px-1">{k.keyPrefix}…</code></TableCell>
                    <TableCell><Badge className={k.type === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>{k.type}</Badge></TableCell>
                    <TableCell><Badge className={k.environment === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{k.environment}</Badge></TableCell>
                    <TableCell><Badge className={k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{k.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(k.createdAt)}</TableCell>
                    <TableCell>
                      {k.status === 'active' && (
                        <button
                          onClick={() => { if (confirm('Revoke this API key? This cannot be undone.')) revokeMutation.mutate(k.id); }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
