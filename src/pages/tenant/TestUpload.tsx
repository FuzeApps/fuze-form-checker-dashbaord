import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createTestUploadSession, confirmTestUpload, getAnalysis } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  FlaskConical,
  Video,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const POPULAR_EXERCISES = [
  'Squat', 'Deadlift', 'Bench Press', 'Pull-up', 'Lunge',
  'Overhead Press', 'Bicep Curl', 'Romanian Deadlift', 'Hip Thrust', 'Push-up',
  'Lateral Raise', 'Tricep Dip', 'Bent-over Row', 'Leg Press', 'Plank',
];

type Step = 'configure' | 'uploading' | 'processing' | 'done' | 'error';

interface AnalysisResult {
  id: string;
  overallScore: number;
  scoreLabel: string;
  summary: string;
  repCount: number;
}

export default function TestUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<Step>('configure');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState('');
  const [externalUserId, setExternalUserId] = useState('test-user-001');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setError('Video must be under 200 MB.');
      return;
    }
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('video/')) {
      setError(null);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  }, []);

  const reset = () => {
    if (pollTimer) clearInterval(pollTimer);
    setStep('configure');
    setFile(null);
    setPreviewUrl(null);
    setExerciseType('');
    setUploadProgress(0);
    setAnalysisProgress(0);
    setAnalysisStage('');
    setAnalysisId(null);
    setResult(null);
    setError(null);
  };

  const startPoll = (id: string) => {
    const timer = setInterval(async () => {
      try {
        const session = await getAnalysis(id);
        setAnalysisProgress(session.progress ?? 0);
        setAnalysisStage(session.stage ?? '');

        if (session.status === 'completed') {
          clearInterval(timer);
          setAnalysisProgress(100);
          setResult({
            id: session.id,
            overallScore: session.analysisResult?.overallScore ?? 0,
            scoreLabel: session.analysisResult?.scoreLabel ?? '',
            summary: (session.analysisResult as { summary?: string })?.summary ?? '',
            repCount: session.analysisResult?.repCount ?? 0,
          });
          setStep('done');
        } else if (session.status === 'failed') {
          clearInterval(timer);
          setError(session.failureReason ?? 'Analysis failed.');
          setStep('error');
        }
      } catch {
        // network blip — keep polling
      }
    }, 3000);
    setPollTimer(timer);
  };

  const handleRun = async () => {
    if (!file) return;
    setError(null);

    try {
      // Step 1: Create upload session
      setStep('uploading');
      setUploadProgress(5);
      const session = await createTestUploadSession({ exerciseType, externalUserId });
      setAnalysisId(session.analysisId);
      setUploadProgress(15);

      // Step 2: Upload directly to S3 presigned URL
      await axios.put(session.uploadUrl, file, {
        headers: { 'Content-Type': file.type || 'video/mp4' },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded ?? 0) / (e.total ?? 1)) * 80) + 15;
          setUploadProgress(Math.min(pct, 95));
        },
      });
      setUploadProgress(100);

      // Step 3: Confirm upload → triggers SQS → worker picks up
      await confirmTestUpload(session.analysisId);

      // Step 4: Poll for results
      setStep('processing');
      startPoll(session.analysisId);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Something went wrong.';
      setError(msg);
      setStep('error');
    }
  };

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FlaskConical className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Test Analysis</h1>
          <p className="text-muted-foreground">Upload a video and run a real pose analysis end-to-end.</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {(['configure', 'uploading', 'processing', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
              step === s ? 'bg-primary text-primary-foreground' :
              ['done', 'processing', 'uploading'].indexOf(step) > ['done', 'processing', 'uploading'].indexOf(s) ||
              (step === 'done' && s !== 'done')
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
            )}>
              {i + 1}
            </div>
            <span className={cn(
              'capitalize hidden sm:inline',
              step === s ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {s === 'configure' ? 'Configure' : s === 'uploading' ? 'Upload' : s === 'processing' ? 'Analyse' : 'Results'}
            </span>
            {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ─── Configure step ─────────────────────────────────────── */}
      {step === 'configure' && (
        <div className="space-y-5">
          {/* Exercise name input */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Exercise Name</CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> AI-powered
                </span>
              </div>
              <CardDescription>
                Type any exercise — our AI generates the detection config automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                placeholder="e.g. Bicep Curl, Hip Thrust, Bulgarian Split Squat…"
                className="text-base"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Popular</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_EXERCISES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setExerciseType(ex)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                        exerciseType.toLowerCase() === ex.toLowerCase()
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test User ID</CardTitle>
              <CardDescription>Simulates an end-user identifier from your mobile app.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={externalUserId}
                onChange={(e) => setExternalUserId(e.target.value)}
                placeholder="test-user-001"
              />
            </CardContent>
          </Card>

          {/* Video drop zone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Video File</CardTitle>
              <CardDescription>MP4 or MOV recommended. Max 200 MB. Camera angle should show the full body.</CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-10 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <Video className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Drop a video here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">MP4, MOV, AVI — up to 200 MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <video
                    ref={videoPreviewRef}
                    src={previewUrl!}
                    controls
                    className="w-full rounded-lg bg-black aspect-video"
                    playsInline
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => { setFile(null); setPreviewUrl(null); }}
                      className="text-muted-foreground hover:text-destructive text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!file || !exerciseType.trim()}
            onClick={handleRun}
          >
            <Play className="h-4 w-4 mr-2" />
            {exerciseType.trim() ? `Analyse ${exerciseType}` : 'Run Analysis'}
          </Button>
        </div>
      )}

      {/* ─── Uploading step ─────────────────────────────────────── */}
      {step === 'uploading' && (
        <Card>
          <CardContent className="pt-8 pb-8 space-y-5 text-center">
            <Upload className="h-10 w-10 text-primary mx-auto animate-bounce" />
            <div>
              <p className="font-semibold text-lg">Uploading video…</p>
              <p className="text-sm text-muted-foreground mt-1">Sending directly to S3. Do not close this tab.</p>
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Processing step ────────────────────────────────────── */}
      {step === 'processing' && (
        <Card>
          <CardContent className="pt-8 pb-8 space-y-5 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
            <div>
              <p className="font-semibold text-lg">Analysing{exerciseType ? ` ${exerciseType}` : ' pose'}…</p>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {analysisStage ? analysisStage.replace(/_/g, ' ') : 'Worker is processing the video with MediaPipe'}
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{analysisProgress}%</span>
              </div>
              <ProgressBar value={analysisProgress} />
            </div>
            <p className="text-xs text-muted-foreground">
              Polling every 3 seconds ·{' '}
              {analysisId && (
                <span className="font-mono">{analysisId.slice(-12)}</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Done step ──────────────────────────────────────────── */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-lg text-green-800">Analysis Complete!</p>
                  <p className="text-sm text-green-700 mt-0.5">{result.summary || 'Your form has been analysed.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-muted-foreground">Overall Score</p>
                <p className={`text-3xl font-bold mt-1 ${scoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-muted-foreground">Label</p>
                <p className="text-sm font-semibold mt-2">{result.scoreLabel || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-muted-foreground">Reps</p>
                <p className="text-3xl font-bold mt-1">{result.repCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => navigate(`/analyses/${result.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Analysis
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Test Again
            </Button>
          </div>
        </div>
      )}

      {/* ─── Error step ─────────────────────────────────────────── */}
      {step === 'error' && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex gap-3">
              <XCircle className="h-8 w-8 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
