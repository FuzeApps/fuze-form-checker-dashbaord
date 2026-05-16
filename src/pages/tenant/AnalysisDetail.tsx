import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnalysis, getAnalysisArtifacts, getAnalysisTimeline } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar, ScoreRing } from '@/components/ui/progress';
import {
  statusColor,
  severityColor,
  scoreColor,
  formatDate,
  formatTimestamp,
} from '@/lib/utils';
import {
  ChevronLeft,
  Download,
  Code,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play,
  X,
  Maximize2,
  Eye,
  ScanLine,
} from 'lucide-react';
import type { TimelineEventItem, IssueDetail } from '@/types/api';

const CATEGORY_LABELS: Record<string, string> = {
  stability: 'Stability',
  bracingAndCore: 'Bracing & Core',
  rangeOfMotion: 'Range of Motion',
  posture: 'Posture',
  movementQuality: 'Movement Quality',
};

const STAGE_LABELS: Record<string, string> = {
  downloading:        'Downloading video…',
  pose_estimation:    'Analysing pose…',
  scoring:            'Scoring movement…',
  vision_analysis:    'Visual AI review…',
  ai_feedback:        'Generating feedback…',
  writing_artifacts:  'Saving results…',
  persisting:         'Finalising…',
  completed:          'Done',
  failed:             'Failed',
};

// ─── IssueRow sub-component ───────────────────────────────────────────────────

function IssueRow({
  issue,
  onSeek,
  isVision = false,
}: {
  issue: IssueDetail;
  onSeek: (ts: number) => void;
  isVision?: boolean;
}) {
  return (
    <div className={[
      'flex items-start gap-3 rounded-lg border p-3',
      isVision ? 'border-purple-200 bg-purple-50/40 dark:border-purple-800/40 dark:bg-purple-950/10' : '',
    ].join(' ')}>
      <div className="flex flex-col items-start gap-1">
        <Badge className={severityColor[issue.severity]}>{issue.severity}</Badge>
        {isVision ? (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
            <Eye className="h-2.5 w-2.5" />
            visual
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <ScanLine className="h-2.5 w-2.5" />
            pose
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium capitalize">
          {issue.type.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{issue.message}</p>
        {issue.timestamps && issue.timestamps.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {issue.timestamps.slice(0, 5).map((ts, ti) => (
              <button
                key={ti}
                onClick={() => onSeek(ts)}
                className="text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded px-1.5 py-0.5 transition-colors"
              >
                {formatTimestamp(ts)}
              </button>
            ))}
          </div>
        )}
        {isVision && (
          <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-1.5 italic">
            Detected via visual frame analysis — no specific timestamp
          </p>
        )}
      </div>
      <span className="text-xs text-red-500 font-medium whitespace-nowrap">
        {issue.scoreImpact} pts
      </span>
    </div>
  );
}

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const activeEventRef = useRef<HTMLButtonElement>(null);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysis(id!),
    enabled: !!id,
  });

  const { data: artifacts } = useQuery({
    queryKey: ['analysis-artifacts', id],
    queryFn: () => getAnalysisArtifacts(id!),
    enabled: !!id && session?.status === 'completed',
  });

  const { data: timeline } = useQuery({
    queryKey: ['analysis-timeline', id],
    queryFn: () => getAnalysisTimeline(id!),
    enabled: !!id && session?.status === 'completed',
  });

  const visibleEvents = timeline?.events.filter(
    (e) => !(e.type === 'end' && e.message === 'Recording ended.')
  ) ?? [];

  // Index of the last event whose timestamp <= currentTime
  const activeEventIndex = (() => {
    let idx = -1;
    for (let i = 0; i < visibleEvents.length; i++) {
      if (visibleEvents[i].timestamp <= currentTime) idx = i;
      else break;
    }
    return idx;
  })();

  // Auto-scroll the modal timeline panel when active event changes
  useEffect(() => {
    if (!videoModalOpen) return;
    if (activeEventRef.current && timelineContainerRef.current) {
      activeEventRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeEventIndex, videoModalOpen]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVideoModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const seekTo = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
    setVideoModalOpen(true);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading analysis...
      </div>
    );
  }

  if (!session) {
    return <div className="text-center py-16 text-muted-foreground">Analysis not found.</div>;
  }

  const result = session.analysisResult;

  return (
    <>
      {/* ── Video Modal with side timeline ───────────────────────────────── */}
      {videoModalOpen && artifacts?.video && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVideoModalOpen(false);
          }}
        >
          <div className="relative flex w-full max-w-6xl gap-0 rounded-2xl overflow-hidden shadow-2xl bg-[#0f0f0f]">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            <div className="flex-1 min-w-0 flex flex-col">
              <video
                ref={videoRef}
                src={artifacts.video}
                controls
                autoPlay
                className="w-full bg-black"
                style={{ maxHeight: '80vh' }}
                playsInline
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {visibleEvents.length > 0 && (
              <div className="w-72 flex-shrink-0 flex flex-col border-l border-white/10">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Timeline
                  </span>
                  {currentTime > 0 && (
                    <span className="text-xs font-mono text-white/40">
                      {formatTimestamp(currentTime)}
                    </span>
                  )}
                </div>
                <div
                  ref={timelineContainerRef}
                  className="flex-1 overflow-y-auto py-2 scroll-smooth"
                  style={{ maxHeight: 'calc(80vh - 44px)' }}
                >
                  {visibleEvents.map((event: TimelineEventItem, i) => {
                    const isActive = i === activeEventIndex;
                    const isPast = i < activeEventIndex;
                    return (
                      <button
                        key={i}
                        ref={isActive ? activeEventRef : null}
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = event.timestamp;
                            videoRef.current.play();
                          }
                        }}
                        className={[
                          'w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-all duration-300',
                          isActive
                            ? 'bg-white/10 border-l-2 border-primary'
                            : isPast
                            ? 'opacity-40 hover:opacity-70 hover:bg-white/5'
                            : 'hover:bg-white/5',
                        ].join(' ')}
                      >
                        <span className="flex-shrink-0 mt-1.5">
                          {isActive ? (
                            <span className="h-2 w-2 rounded-full bg-primary block animate-pulse" />
                          ) : (
                            <span
                              className={[
                                'h-1.5 w-1.5 rounded-full block mt-0.5',
                                isPast ? 'bg-white/20' : 'bg-white/30',
                              ].join(' ')}
                            />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={[
                                'text-xs font-mono',
                                isActive ? 'text-primary font-semibold' : 'text-white/40',
                              ].join(' ')}
                            >
                              {formatTimestamp(event.timestamp)}
                            </span>
                            {event.severity && event.severity !== 'info' && (
                              <span
                                className={[
                                  'text-[10px] px-1 py-0 rounded font-medium uppercase tracking-wide',
                                  event.severity === 'high'
                                    ? 'bg-red-500/20 text-red-400'
                                    : event.severity === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-blue-500/20 text-blue-400',
                                ].join(' ')}
                              >
                                {event.severity}
                              </span>
                            )}
                          </div>
                          <p
                            className={[
                              'text-xs leading-snug',
                              isActive ? 'text-white font-medium' : 'text-white/50',
                            ].join(' ')}
                          >
                            {event.message}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/analyses">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Analyses
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold capitalize">{session.exerciseType}</h1>
              <Badge className={statusColor[session.status]}>{session.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              User: <span className="font-mono">{session.externalUserId}</span> ·{' '}
              {formatDate(session.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowArtifacts(!showArtifacts)}>
              <Download className="h-4 w-4 mr-1" />
              Artifacts
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRawJson(!showRawJson)}>
              <Code className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>

        {session.status === 'processing' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {session.stage
                      ? (STAGE_LABELS[session.stage] ?? session.stage.replace(/_/g, ' '))
                      : 'Processing...'}
                  </span>
                  <span className="text-muted-foreground">{session.progress}%</span>
                </div>
                <ProgressBar value={session.progress} />
                <p className="text-xs text-muted-foreground">
                  Analysis is in progress. Refresh in a few seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {session.status === 'failed' && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {session.failureReason ?? 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            {result.repCount === 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                <span className="mt-0.5 text-base">⚠️</span>
                <div>
                  <p className="font-semibold">No reps detected</p>
                  <p className="mt-0.5 text-yellow-700 dark:text-yellow-400">
                    The rep counter couldn't find a complete movement cycle — this usually means the athlete wasn't fully
                    in frame, the camera angle didn't capture the full range of motion, or the video was very short.
                    The score is based on static pose frames only and may not reflect actual performance.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <ScoreRing score={result.overallScore} size={120} />
                    <div className="flex-1 space-y-1">
                      <p className={`text-lg font-bold ${scoreColor(result.overallScore)}`}>
                        {result.scoreLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">{result.exerciseName}</p>
                      <p className="text-sm">
                        <span className="font-medium">{result.repCount}</span>{' '}
                        <span className="text-muted-foreground">reps completed</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {Object.entries(result.categories).map(([key, value]) => (
                      <ProgressBar
                        key={key}
                        value={value}
                        label={CATEGORY_LABELS[key] ?? key}
                        barClassName={
                          value >= 80
                            ? 'bg-green-500'
                            : value >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Video thumbnail — click to open modal */}
              <Card>
                <CardHeader>
                  <CardTitle>Video</CardTitle>
                </CardHeader>
                <CardContent>
                  {artifacts?.video ? (
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="group relative w-full rounded-lg bg-black aspect-video overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {/* Paused preview when modal is closed */}
                      {!videoModalOpen && (
                        <video
                          ref={videoRef}
                          src={artifacts.video}
                          className="w-full h-full object-contain opacity-70 group-hover:opacity-50 transition-opacity"
                          preload="metadata"
                          onTimeUpdate={handleTimeUpdate}
                        />
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                          <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                        </div>
                        <span className="text-white/80 text-xs font-medium">Click to play</span>
                      </div>
                      {/* Expand hint */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/40 rounded p-1">
                          <Maximize2 className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center h-48 rounded-lg bg-muted text-muted-foreground text-sm">
                      Video not available
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Signed URL expires in ~15 minutes. Refresh the page to renew.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Coaching Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{result.summary}</p>
                {(result.recommendations as string[]).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {(result.recommendations as string[]).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Issues */}
            {(result.issues as IssueDetail[]).length > 0 && (() => {
              const poseIssues   = (result.issues as IssueDetail[]).filter(i => i.detectedBy !== 'vision');
              const visionIssues = (result.issues as IssueDetail[]).filter(i => i.detectedBy === 'vision');
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Detected Issues
                      </span>
                      <div className="flex items-center gap-2">
                        {poseIssues.length > 0 && (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <ScanLine className="h-3 w-3" />
                            {poseIssues.length} pose
                          </span>
                        )}
                        {visionIssues.length > 0 && (
                          <span className="flex items-center gap-1 text-xs font-normal text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-0.5 rounded-full">
                            <Eye className="h-3 w-3" />
                            {visionIssues.length} visual
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Pose-detected issues */}
                    {poseIssues.map((issue, i) => (
                      <IssueRow key={i} issue={issue} onSeek={seekTo} />
                    ))}

                    {/* Visual analysis issues — separated with a divider */}
                    {visionIssues.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/40" />
                          <span className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 px-1">
                            <Eye className="h-3 w-3" />
                            Visual AI Analysis
                          </span>
                          <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800/40" />
                        </div>
                        {visionIssues.map((issue, i) => (
                          <IssueRow key={`v${i}`} issue={issue} onSeek={seekTo} isVision />
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Timeline — highlights & auto-scrolls as video plays */}
            {visibleEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Timeline</span>
                    {currentTime > 0 && (
                      <span className="text-xs font-mono text-muted-foreground font-normal">
                        {formatTimestamp(currentTime)}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-1 max-h-80 overflow-y-auto pr-1 scroll-smooth"
                  >
                    {visibleEvents.map((event: TimelineEventItem, i) => {
                      const isActive = i === activeEventIndex;
                      const isPast = i < activeEventIndex;
                      return (
                        <button
                          key={i}
                          ref={isActive ? activeEventRef : null}
                          onClick={() => seekTo(event.timestamp)}
                          className={[
                            'w-full flex items-start gap-3 rounded-lg px-2 py-2 text-left transition-all duration-300',
                            isActive
                              ? 'bg-primary/10 border border-primary/20 shadow-sm'
                              : isPast
                              ? 'opacity-50 hover:opacity-80 hover:bg-muted/40'
                              : 'hover:bg-muted/50',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'w-12 flex-shrink-0 text-xs font-mono pt-0.5',
                              isActive ? 'text-primary font-semibold' : 'text-muted-foreground',
                            ].join(' ')}
                          >
                            {formatTimestamp(event.timestamp)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {event.severity && event.severity !== 'info' ? (
                                <Badge className={severityColor[event.severity]}>
                                  {event.severity}
                                </Badge>
                              ) : (
                                <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="text-xs text-muted-foreground capitalize">
                                {event.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p
                              className={[
                                'text-sm mt-0.5',
                                isActive ? 'font-medium' : '',
                              ].join(' ')}
                            >
                              {event.message}
                            </p>
                          </div>
                          {isActive && (
                            <span className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Artifact links */}
            {showArtifacts && artifacts && (
              <Card>
                <CardHeader>
                  <CardTitle>Artifacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Video', url: artifacts.video },
                    { label: 'Timeline JSON', url: artifacts.timeline },
                    { label: 'Overlay JSON', url: artifacts.overlay },
                    { label: 'Landmarks JSON', url: artifacts.landmarks },
                  ].map(({ label, url }) =>
                    url ? (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        {label}
                      </a>
                    ) : (
                      <p key={label} className="text-sm text-muted-foreground">
                        {label}: not available
                      </p>
                    )
                  )}
                  <p className="text-xs text-muted-foreground">URLs expire in ~15 minutes.</p>
                </CardContent>
              </Card>
            )}

            {/* Raw JSON */}
            {showRawJson && (
              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto max-h-96 bg-muted rounded-md p-4">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
