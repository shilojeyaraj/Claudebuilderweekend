"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_USER_INTERESTS,
  USER_INTERESTS_STORAGE_KEY,
  sanitizeUserInterests,
} from "@/lib/interests";
import { UserInterests } from "@/lib/types";

type InterestsContextValue = {
  userInterests: UserInterests;
  hasInterests: boolean;
  setCustomText: (text: string) => void;
  toggleTopic: (topic: string) => void;
  clearInterests: () => void;
};

const InterestsContext = createContext<InterestsContextValue | null>(null);

const listeners = new Set<() => void>();
let cachedSnapshot: UserInterests = DEFAULT_USER_INTERESTS;
let cachedRawSnapshot: string | null = null;

function getServerSnapshot(): UserInterests {
  return DEFAULT_USER_INTERESTS;
}

function readInterestsSnapshot(): UserInterests {
  if (typeof window === "undefined") return DEFAULT_USER_INTERESTS;

  try {
    const raw = window.localStorage.getItem(USER_INTERESTS_STORAGE_KEY);
    if (!raw) {
      cachedRawSnapshot = null;
      cachedSnapshot = DEFAULT_USER_INTERESTS;
      return cachedSnapshot;
    }

    if (raw === cachedRawSnapshot) {
      return cachedSnapshot;
    }

    cachedRawSnapshot = raw;
    cachedSnapshot = sanitizeUserInterests(JSON.parse(raw));
    return cachedSnapshot;
  } catch {
    cachedRawSnapshot = null;
    cachedSnapshot = DEFAULT_USER_INTERESTS;
    return cachedSnapshot;
  }
}

function writeInterestsSnapshot(next: UserInterests) {
  if (typeof window === "undefined") return;

  const sanitized = sanitizeUserInterests(next);
  const serialized = JSON.stringify(sanitized);
  cachedRawSnapshot = serialized;
  cachedSnapshot = sanitized;
  window.localStorage.setItem(USER_INTERESTS_STORAGE_KEY, serialized);
  listeners.forEach((listener) => listener());
}

function subscribeToInterestStore(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === USER_INTERESTS_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function InterestsProvider({ children }: { children: ReactNode }) {
  const userInterests = useSyncExternalStore(
    subscribeToInterestStore,
    readInterestsSnapshot,
    getServerSnapshot
  );

  const setCustomText = useCallback((text: string) => {
    writeInterestsSnapshot({
      ...readInterestsSnapshot(),
      customText: text,
    });
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    const current = readInterestsSnapshot();
    const topics = current.topics.includes(topic)
      ? current.topics.filter((item) => item !== topic)
      : [...current.topics, topic];

    writeInterestsSnapshot({
      ...current,
      topics,
    });
  }, []);

  const clearInterests = useCallback(() => {
    writeInterestsSnapshot(DEFAULT_USER_INTERESTS);
  }, []);

  const value = useMemo(
    () => ({
      userInterests,
      hasInterests:
        userInterests.topics.length > 0 || userInterests.customText.trim().length > 0,
      setCustomText,
      toggleTopic,
      clearInterests,
    }),
    [clearInterests, setCustomText, toggleTopic, userInterests]
  );

  return (
    <InterestsContext.Provider value={value}>
      {children}
    </InterestsContext.Provider>
  );
}

export function useInterests() {
  const ctx = useContext(InterestsContext);
  if (!ctx) {
    throw new Error("useInterests must be used within InterestsProvider");
  }
  return ctx;
}
