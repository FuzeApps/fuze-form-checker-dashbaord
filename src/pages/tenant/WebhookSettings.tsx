import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWebhook, upsertWebhook } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Webhook } from 'lucide-react';

export default function WebhookPage() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['webhook'], queryFn: getWebhook });

  const [form, setForm] = useState({ url: '', secret: '', enabled: true });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: upsertWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      url: form.url || config?.url || '',
      secret: form.secret,
      enabled: form.enabled,
    });
  };

  const isEnabled = form.enabled ?? config?.enabled ?? true;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Webhook</h1>
        <p className="text-muted-foreground">
          Receive real-time delivery notifications when analyses complete or fail.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            We'll POST a signed JSON payload to your endpoint on{' '}
            <code className="text-xs bg-muted px-1 rounded">analysis.completed</code> and{' '}
            <code className="text-xs bg-muted px-1 rounded">analysis.failed</code> events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <Input
                  type="url"
                  placeholder="https://your-server.com/webhooks/fuze"
                  defaultValue={config?.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Signing Secret</Label>
                <Input
                  type="password"
                  placeholder="Min 16 characters — used to sign payloads"
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  required={!config}
                />
                <p className="text-xs text-muted-foreground">
                  Verify: <code>X-Fuze-Signature: sha256=HMAC-SHA256(secret, body)</code>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() => setForm({ ...form, enabled: !isEnabled })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${isEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <Label>Enable webhook delivery</Label>
              </div>

              {saved && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  Webhook configuration saved successfully.
                </div>
              )}

              <Button type="submit" loading={mutation.isPending}>
                Save Configuration
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader><CardTitle>Webhook Payload Example</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto">
{`{
  "event": "analysis.completed",
  "analysisId": "cuid...",
  "tenantId": "cuid...",
  "externalUserId": "user_123",
  "exerciseType": "squat",
  "status": "completed",
  "resultUrl": "https://api.yourdomain.com/v1/sdk/analyses/.../result",
  "timestamp": "2026-05-16T14:00:00.000Z"
}`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
