import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAnalyses, getUsage } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusColor, formatDate, scoreColor } from '@/lib/utils';
import { Activity, CheckCircle, XCircle, BarChart2, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function OverviewPage() {
  const { data: analyses } = useQuery({
    queryKey: ['analyses', { limit: 5 }],
    queryFn: () => getAnalyses({ limit: 5 }),
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: getUsage,
  });

  const failedCount = analyses?.data?.filter((a) => a.status === 'failed').length ?? 0;
  const totalCount = analyses?.meta?.total ?? 0;

  const avgScore =
    analyses?.data
      ?.filter((a) => a.analysisResult?.overallScore != null)
      .reduce((sum, a, _, arr) => sum + (a.analysisResult?.overallScore ?? 0) / arr.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Monitor your app's form analysis activity.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Analyses"
          value={totalCount.toLocaleString()}
          icon={<Activity className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Completed"
          value={usage?.monthly.totalEvents.toLocaleString() ?? '—'}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title="Failed"
          value={failedCount.toLocaleString()}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
        />
        <StatCard
          title="Avg Score"
          value={avgScore > 0 ? `${Math.round(avgScore)}/100` : '—'}
          icon={<TrendingUp className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      {/* Daily chart */}
      {usage && usage.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Daily Analyses (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usage.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  formatter={(v: number) => [v, 'Analyses']}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent analyses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Analyses</CardTitle>
          <Link to="/analyses" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Exercise</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {analyses?.data?.map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono text-xs">{a.externalUserId}</td>
                  <td className="px-6 py-3 capitalize">{a.exerciseType}</td>
                  <td className="px-6 py-3">
                    <Badge className={statusColor[a.status]}>{a.status}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    {a.analysisResult ? (
                      <span className={scoreColor(a.analysisResult.overallScore)}>
                        {a.analysisResult.overallScore}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
              {!analyses?.data?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No analyses yet. Integrate the SDK to start receiving data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
