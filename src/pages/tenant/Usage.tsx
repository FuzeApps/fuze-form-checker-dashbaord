import { useQuery } from '@tanstack/react-query';
import { getUsage } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function UsagePage() {
  const { data, isLoading } = useQuery({ queryKey: ['usage'], queryFn: getUsage });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="text-muted-foreground">Track your API consumption and billing units.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Analyses This Month</p>
            <p className="text-3xl font-bold mt-1">{data?.monthly.totalEvents.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Billable Units This Month</p>
            <p className="text-3xl font-bold mt-1">{data?.monthly.billableUnits.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {data && data.daily.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Analyses (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v: string) => new Date(v).toLocaleDateString()} formatter={(v: number) => [v, 'Analyses']} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data && data.byApp.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Usage by App (This Month)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byApp}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="appId" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, 'Analyses']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
