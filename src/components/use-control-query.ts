"use client";

import { useEffect, useMemo, useState } from "react";
import type { ControlDataset } from "@/lib/control-center";

export type ControlRequest = <T>(action: string, input?: Record<string, unknown>, signal?: AbortSignal) => Promise<T>;
type ReadAction = "capabilities" | "list" | "overview" | "members" | "audit" | "records";
type Options = { after?: string | null; revision?: number | string; dataset?: ControlDataset; enabled?: boolean };

// Reads only: user-triggered writes and exports must never be retried here.
export function useControlQuery<T>(request: ControlRequest, action: ReadAction, { after = null, revision = 0, dataset, enabled = true }: Options = {}) {
  const [attempt, setAttempt] = useState(0);
  const query = useMemo(() => ({ request, action, after, revision, dataset, enabled, attempt }), [request, action, after, revision, dataset, enabled, attempt]);
  const [result, setResult] = useState<{ query: typeof query; data: T | null; error: string } | null>(null);
  useEffect(() => {
    if (!query.enabled) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => {
      if (!active) return;
      setResult({ query, data: null, error: "انتهت مهلة تحميل البيانات. يمكنك إعادة المحاولة." });
      controller.abort();
    }, 15000);
    const input = ["capabilities", "overview"].includes(query.action) ? {} : { limit: 20, after: query.after, ...(query.dataset ? { dataset: query.dataset } : {}) };
    void query.request<T>(query.action, input, controller.signal)
      .then(data => {
        if (!active || controller.signal.aborted) return;
        setResult({ query, data: data ?? null, error: data == null ? "استجابة الخادم غير مكتملة. أعد المحاولة." : "" });
      })
      .catch(error => {
        if (!active || controller.signal.aborted) return;
        setResult({ query, data: null, error: error instanceof Error && error.name !== "TypeError" ? error.message : "تعذر الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة." });
      })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [query]);
  const current = enabled && result?.query === query ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? "", loading: enabled && !current, retry: () => setAttempt(n => n + 1) };
}
