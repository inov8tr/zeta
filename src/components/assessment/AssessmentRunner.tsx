"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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
  const lastHeartbeatRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartRef = useRef<number | null>(null);

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
        await fetchNextQuestion();
        return;
      }

      setQuestion(payload);
      setCurrentSection(payload.section);
      setTimeRemaining(payload.timeRemainingSeconds);
      setMessage(null);
      questionStartRef.current = Date.now();
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
      setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)));
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
            <h2 className="text-lg font-semibold text-brand-primary-dark">Summary (preliminary)</h2>
            <dl className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-brand-primary/70">Weighted level</dt>
                <dd className="font-medium text-brand-primary-dark">{finalSummary.weightedLevel ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-brand-primary/70">Overall score</dt>
                <dd className="font-medium text-brand-primary-dark">{finalSummary.totalScore ?? "Pending review"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
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

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2 border-b border-brand-primary/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-primary/70">Entrance assessment</p>
          <h1 className="text-2xl font-semibold text-brand-primary-dark">
            {section === "reading"
              ? "Reading comprehension"
              : section === "grammar"
              ? "Grammar"
              : section === "listening"
              ? "Listening"
              : "Dialog"}
          </h1>
          {progressLabel ? (
            <p className="text-xs text-neutral-muted">Section {progressLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-4 text-xs text-brand-primary-dark">
          <div className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold uppercase">
            {question.level}
          </div>
          <div className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold uppercase">
            {timeRemaining !== null ? `${timeRemaining}s left` : "Timer"}
          </div>
        </div>
      </header>

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
          <article className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:h-fit">
            <h2 className="text-lg font-semibold text-brand-primary-dark">{passage.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
              {passage.body.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>
        ) : null}

        <article className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Question</h2>
          <p className="mt-4 text-sm text-neutral-800">{q.stem}</p>
          {q.mediaUrl ? (
            <div className="mt-4">
              <audio controls preload="metadata" className="w-full">
                <source src={q.mediaUrl} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : null}
          <ul className="mt-6 space-y-3">
            {q.options.map((option, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleAnswer(idx)}
                  disabled={submitting}
                  className="w-full rounded-2xl border border-brand-primary/10 bg-brand-primary/5 px-4 py-3 text-left text-sm font-medium text-brand-primary-dark transition hover:border-brand-primary hover:bg-brand-primary/10 disabled:cursor-not-allowed"
                >
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 font-semibold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-neutral-muted">
        <span>Skill focus: {q.skillTags.length ? q.skillTags.join(", ") : "general"}</span>
        <span>Question ID: {q.id}</span>
      </div>
    </main>
  );
};

export default AssessmentRunner;
