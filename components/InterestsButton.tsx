"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { TOPIC_TAGS } from "@/lib/bills";
import { useInterests } from "@/components/InterestsProvider";

export function InterestsButton({
  variant = "header",
  onOpen,
}: {
  variant?: "header" | "sidebar";
  onOpen?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { userInterests, hasInterests, toggleTopic, setCustomText, clearInterests } = useInterests();

  const buttonClassName =
    variant === "sidebar"
      ? "ui-nav-link w-full text-left"
      : "ui-btn-secondary whitespace-nowrap";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          onOpen?.();
        }}
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        My Interests
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <button
            type="button"
            aria-label="Close interests panel"
            className="absolute inset-x-0 bottom-0 top-20 sm:top-24 pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-3 top-20 sm:right-4 sm:top-24 w-[min(44rem,calc(100vw-1.5rem))] sm:w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto ui-card ui-card-pad space-y-5 shadow-2xl pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-label="My interests"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="ui-section-title">My Interests</h2>
                <p className="ui-legal mt-1">
                  Pick the topics you care about and add a few keywords. The bill list will bring those items to the top.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ui-btn-secondary px-3"
                aria-label="Close interests"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Categories</p>
              <div className="flex flex-wrap gap-2">
                {TOPIC_TAGS.map((topic) => {
                  const isActive = userInterests.topics.includes(topic);

                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-on-accent)]"
                          : "border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="interest-notes" className="text-sm font-semibold block">
                Keywords or issues you care about
              </label>
              <textarea
                id="interest-notes"
                value={userInterests.customText}
                onChange={(event) => setCustomText(event.target.value)}
                rows={3}
                placeholder="Examples: veterans benefits, public transit, disability supports, housing affordability"
                className="ui-input min-h-24 resize-y"
              />
              <p className="ui-legal">
                Use a few words or short phrases. Matching bills will rise within your preferred categories.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="ui-legal">
                {hasInterests ? "Your priorities are saved on this device." : "No interests saved yet."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearInterests}
                  className="ui-btn-secondary"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ui-btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
