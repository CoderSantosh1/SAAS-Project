"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDraft } from "../actions";
import type { EditorDocument } from "../types";

const AUTOSAVE_MS = 1500;
// Server actions accept 1 MB by default.
const MAX_DOCUMENT_BYTES = 900_000;

export type SaveState = "saved" | "unsaved" | "saving" | "error" | "conflict" | "signed-out";

export function useAutosave(websiteId: string, initialRevision: number, document: EditorDocument) {
  const [savedDocument, setSavedDocument] = useState(document);
  const [phase, setPhase] = useState<"idle" | "saving" | "error" | "conflict" | "signed-out">("idle");
  const [errorMessage, setErrorMessage] = useState<string>();

  const revision = useRef(initialRevision);
  const latest = useRef(document);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const stopped = useRef(false);

  const isDirty = document !== savedDocument;

  useEffect(() => {
    latest.current = document;
  }, [document]);

  const runSave = useCallback(async (): Promise<boolean> => {
    if (stopped.current) return false;

    // Saves run one at a time, because each depends on the previous revision.
    while (inFlight.current) await inFlight.current;

    const snapshot = latest.current;
    if (JSON.stringify(snapshot).length > MAX_DOCUMENT_BYTES) {
      setPhase("error");
      setErrorMessage("This website has too much content to save. Remove some text or sections.");
      return false;
    }

    const attempt = (async () => {
      setPhase("saving");
      try {
        const result = await saveDraft(websiteId, revision.current, snapshot);
        if (result.status === "saved") {
          revision.current = result.revision;
          setSavedDocument(snapshot);
          setPhase("idle");
          setErrorMessage(undefined);
          return true;
        }
        if (result.status === "error") {
          setPhase("error");
          setErrorMessage(result.message);
          return false;
        }
        // Retrying cannot fix these, and would risk overwriting newer work.
        stopped.current = true;
        setPhase(result.status);
        return false;
      } catch {
        setPhase("error");
        setErrorMessage("We could not reach the server.");
        return false;
      }
    })();

    inFlight.current = attempt;
    const saved = await attempt;
    inFlight.current = null;
    return saved;
  }, [websiteId]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => void runSave(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [document, isDirty, runSave]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const state: SaveState =
    phase === "conflict" || phase === "signed-out" || phase === "saving" || phase === "error"
      ? phase
      : isDirty
        ? "unsaved"
        : "saved";

  return { state, errorMessage, save: runSave };
}
