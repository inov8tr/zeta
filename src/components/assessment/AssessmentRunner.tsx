"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Hourglass, BookOpen, GraduationCap, Headphones, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SECTION_ORDER } from "@/lib/tests/adaptiveConfig";

interface AssessmentRunnerProps {
  testId: string;
  initialStatus: string;
  studentId: string;
}

type QuestionPayload = {
  testId: string;
  section: string;
  timeRemainingSeconds: number;
  level: string;
  question: {
    id: string;
    stem: string;
    options: string[];
    skillTags: string[];
    mediaUrl?: string | null;
    instructions?: string | null;
    optionOrder?: number[]; // maps displayed index -> original index
  };
  passage?: { title: string; body: string } | null;
};

type SubmitResponse = {
  correct: boolean;
  sectionCompleted?: boolean;
  allCompleted?: boolean;
  timeExpired?: boolean;
  finalized?: { weightedLevel: number | null; totalScore: number | null } | null;
};

const HEARTBEAT_INTERVAL_MS = 15_000;

const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  grammar: "Grammar",
  listening: "Listening",
  dialog: "Dialog",
};

const SECTION_ICONS: Record<string, LucideIcon> = {
  reading: BookOpen,
  grammar: GraduationCap,
  listening: Headphones,
  dialog: MessageCircle,
};

const inferMediaType = (url: string | null | undefined): "audio" | "image" | null => {
  if (!url) {
    return null;
  }
  const sanitized = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  const extension = sanitized.split(".").pop();
  if (!extension) {
    return null;
  }
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(extension)) {
    return "audio";
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "avif"].includes(extension)) {
    return "image";
  }
  return null;
};

const formatTimer = (seconds: number | null) => {
  if (seconds === null || Number.isNaN(seconds)) {
    return "--:--";
  }
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const AssessmentRunner = ({ testId, initialStatus }: AssessmentRunnerProps) => {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [sectionOrder] = useState(() => SECTION_ORDER.slice());
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [finalSummary, setFinalSummary] = useState<{ weightedLevel: number | null; totalScore: number | null } | null>(
    null
  );
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const lastHeartbeatRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartRef = useRef<number | null>(null);
  const sectionInitialTimeRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    const elapsed = now - lastHeartbeatRef.current;
    lastHeartbeatRef.current = now;
    try {
      const res = await fetch(`/api/tests/${testId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedMs: elapsed }),
      });
      if (!res.ok) {
        return;
      }
      const data: { timeRemainingSeconds: number; expired: boolean; summary?: { weightedLevel: number | null; totalScore: number | null } } =
        await res.json();
      setTimeRemaining(data.timeRemainingSeconds);
      if (sectionInitialTimeRef.current === null && data.timeRemainingSeconds !== undefined) {
        sectionInitialTimeRef.current = data.timeRemainingSeconds;
      }
      if (data.expired) {
        if (data.summary) {
          setFinalSummary(data.summary);
        }
        setStatus("completed");
        setMessage("Time is up. Your responses have been submitted for review.");
        stopTimer();
      }
    } catch (err) {
      console.error("heartbeat error", err);
    }
  }, [stopTimer, testId]);

  useEffect(() => {
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => {
      stopTimer();
    };
  }, [sendHeartbeat, stopTimer]);

  const fetchNextQuestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/next`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load next question");
      }
      const payload: QuestionPayload & { done?: boolean; sectionCompleted?: boolean; timeExpired?: boolean } =
        await res.json();

      if (payload.timeExpired) {
        setStatus("completed");
        setMessage("Time is up. Your test has been submitted.");
        stopTimer();
        return;
      }

      if (payload.done) {
        setQuestion(null);
        setStatus("completed");
        setMessage("You have answered all available questions. Waiting for results...");
        return;
      }

      if (payload.sectionCompleted) {
        setMessage("Section complete! Moving to the next section...");
        setCompletedSections((prev) => {
          const next = new Set(prev);
          next.add(payload.section);
          return next;
        });
        await fetchNextQuestion();
        return;
      }

      setQuestion(payload);
      setCurrentSection(payload.section);
      setTimeRemaining(payload.timeRemainingSeconds);
      sectionInitialTimeRef.current = payload.timeRemainingSeconds ?? null;
      setMessage(null);
      questionStartRef.current = Date.now();
      setSectionProgress((prev) => ({
        ...prev,
        [payload.section]: prev[payload.section] ?? 0,
      }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load next question");
    } finally {
      setLoading(false);
    }
  }, [stopTimer, testId]);

  const startTest = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unable to start test");
      }
      const payload: { status: string; timeLimitSeconds: number; elapsedMs: number } = await res.json();
      setStatus(payload.status);
      const remaining = payload.timeLimitSeconds * 1000 - payload.elapsedMs;
      const remainingSeconds = Math.max(0, Math.floor(remaining / 1000));
      setTimeRemaining(remainingSeconds);
      sectionInitialTimeRef.current = remainingSeconds;
      lastHeartbeatRef.current = Date.now();
      await fetchNextQuestion();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to start test");
      setLoading(false);
    }
  }, [fetchNextQuestion, testId]);

  useEffect(() => {
    startTest();
  }, [startTest]);

  const handleAnswer = useCallback(
    async (index: number) => {
      if (!question || submitting) {
        return;
      }
      setSubmitting(true);
      try {
        const now = Date.now();
        const timeSpent = questionStartRef.current ? now - questionStartRef.current : 0;
        const originalIndex = question.question.optionOrder && question.question.optionOrder.length
          ? question.question.optionOrder[index]
          : index;
        const res = await fetch(`/api/tests/${testId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.question.id,
            selectedIndex: originalIndex,
            timeSpentMs: timeSpent,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Unable to submit answer");
        }
        const data: SubmitResponse = await res.json();
        if (data.finalized) {
          setFinalSummary(data.finalized);
        }
        if (data.timeExpired || data.allCompleted) {
          setStatus("completed");
          setMessage("Thanks! Your test is now complete.");
          stopTimer();
          setQuestion(null);
          return;
        }
        if (data.sectionCompleted && question?.section) {
          setCompletedSections((prev) => {
            const next = new Set(prev);
            next.add(question.section);
            return next;
          });
        }
        if (question?.section) {
          setSectionProgress((prev) => ({
            ...prev,
            [question.section]: (prev[question.section] ?? 0) + 1,
          }));
        }
        await fetchNextQuestion();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to submit answer");
      } finally {
        setSubmitting(false);
      }
    },
    [fetchNextQuestion, question, stopTimer, submitting, testId]
  );

  const progressLabel = useMemo(() => {
    if (!currentSection) {
      return null;
    }
    const index = sectionOrder.findIndex((section) => section === currentSection);
    if (index === -1) {
      return null;
    }
    return `${index + 1} of ${sectionOrder.length}`;
  }, [currentSection, sectionOrder]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm text-neutral-muted">Preparing your adaptive assessment…</p>
      </main>
    );
  }

  if (status === "completed") {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Assessment submitted</h1>
        <p className="text-sm text-neutral-muted">
          {message ?? "Great work! Your teacher will review the results and follow up with placement details."}
        </p>
        {finalSummary ? (
          <div className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Preliminary score</h2>
            <p className="mt-2 text-sm text-neutral-muted">
              Your teacher will review the full details and follow up with personalized feedback.
            </p>
            <dl className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-brand-primary/70">Overall score</dt>
                <dd className="font-medium text-brand-primary-dark">{finalSummary.totalScore ?? "Pending review"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        <div className="mx-auto max-w-xl rounded-3xl border border-brand-primary/10 bg-brand-primary/5 p-6 text-left text-sm text-brand-primary-dark">
          <p className="font-semibold uppercase tracking-[0.25em] text-brand-primary/70">What happens next</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-brand-primary-dark/80">
            <li>Your teacher reviews your responses to customize upcoming lessons.</li>
            <li>You&apos;ll receive feedback and placement updates inside the student dashboard.</li>
            <li>Use the resources tab to stay warm while we prepare your next assessment.</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/student"
            className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary hover:text-white"
          >
            Back to student portal
          </Link>
        </div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <p className="text-sm text-neutral-muted">No question available right now. Please contact your teacher.</p>
        <Link
          href="/student"
          className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary hover:text-white"
        >
          Back to student portal
        </Link>
      </main>
    );
  }

  const { section, question: q, passage } = question;
  const instructions = q.instructions ?? null;

  const sectionTitle = SECTION_LABELS[section] ?? "Assessment";
  const initialSeconds = sectionInitialTimeRef.current ?? timeRemaining ?? 0;
  const progressPercent =
    timeRemaining !== null && initialSeconds > 0 ? Math.max(0, Math.min(100, (timeRemaining / initialSeconds) * 100)) : 0;
  const mediaType = inferMediaType(q.mediaUrl);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-lightest via-white to-brand-primary/10">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="relative overflow-hidden rounded-3xl border border-brand-primary/20 bg-white px-6 py-8 shadow-sm">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" aria-hidden />
          <div className="absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-brand-primary/5 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-brand-primary/70">Zeta adaptive assessment</p>
              <h1 className="mt-2 text-3xl font-semibold text-brand-primary-dark">{sectionTitle}</h1>
              {progressLabel ? (
                <p className="mt-1 text-sm text-neutral-muted">Section {progressLabel}</p>
              ) : (
                <p className="mt-1 text-sm text-neutral-muted">Adaptive section tailored to your level</p>
              )}
            </div>
            <div className="flex flex-col gap-3 text-brand-primary-dark">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-lg text-white shadow">
                <Hourglass className="h-5 w-5" />
              </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-brand-primary/70">Time remaining</p>
                  <p className="text-2xl font-semibold text-brand-primary-dark">{formatTimer(timeRemaining)}</p>
                </div>
              </div>
              <div className="h-2 w-56 overflow-hidden rounded-full bg-brand-primary/10">
                <div
                  className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sectionOrder.map((sectionKey) => {
            const label = SECTION_LABELS[sectionKey] ?? sectionKey;
            const Icon = SECTION_ICONS[sectionKey] ?? BookOpen;
            const status = completedSections.has(sectionKey)
              ? "completed"
              : currentSection === sectionKey
                ? "current"
                : "upcoming";
            const statusClasses =
              status === "completed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status === "current"
                  ? "border-brand-primary/40 bg-brand-primary/5 text-brand-primary-dark"
                  : "border-neutral-200 bg-white text-neutral-600";
            const statusLabel =
              status === "completed" ? "Completed" : status === "current" ? "In progress" : "Upcoming";
            const count = sectionProgress[sectionKey] ?? 0;
            return (
              <article
                key={sectionKey}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${statusClasses}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">{statusLabel}</p>
                  <p className="text-sm font-semibold text-neutral-800">{label}</p>
                  <p className="text-[11px] text-neutral-500">Answered {count}</p>
                </div>
              </article>
            );
          })}
        </section>

      {message ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4 text-sm text-brand-primary-dark">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className={passage ? "grid gap-6 lg:grid-cols-2" : "grid gap-6 sm:grid-cols-[minmax(0,1fr)]"}>
        {passage ? (
          <article className="rounded-3xl border border-brand-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur lg:sticky lg:top-6 lg:h-fit">
            <h2 className="text-lg font-semibold text-brand-primary-dark">{passage.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
              {passage.body.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>
        ) : null}

        <article className="rounded-3xl border border-brand-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-primary/60">Question</p>
              <h2 className="text-lg font-semibold text-brand-primary-dark">
                {sectionTitle} question {(sectionProgress[section] ?? 0) + 1}
              </h2>
            </div>
            <p className="text-xs text-neutral-500">Select the best answer.</p>
          </div>
          {instructions ? (
            <p className="mt-4 text-sm font-medium text-neutral-muted">{instructions}</p>
          ) : null}
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-neutral-900">{q.stem}</p>
          {mediaType === "audio" ? (
            <div className="mt-4">
              <audio controls preload="metadata" className="w-full">
                <source src={q.mediaUrl ?? undefined} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : null}
          {mediaType === "image" && q.mediaUrl ? (
            <div className="mt-5 flex justify-center">
              <div className="relative h-64 w-full">
                <Image
                  src={q.mediaUrl}
                  alt="Question illustration"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="rounded-2xl border border-brand-primary/10 object-contain"
                  unoptimized
                  priority={false}
                />
              </div>
            </div>
          ) : null}
          <ol className="mt-6 space-y-3">
            {q.options.map((option, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleAnswer(idx)}
                  disabled={submitting}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-brand-primary/20 bg-white px-4 py-3 text-left text-sm font-medium text-brand-primary-dark shadow-sm transition hover:border-brand-primary hover:bg-brand-primary/10 disabled:cursor-not-allowed"
                >
                  <span className="mt-[2px] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-left leading-relaxed text-neutral-900">{option}</span>
                </button>
              </li>
            ))}
          </ol>
        </article>
      </div>

        <div className="flex flex-wrap gap-3 text-xs text-neutral-muted">
          <span>Question ID: {q.id}</span>
        </div>
      </div>
    </main>
  );
};

export default AssessmentRunner;
