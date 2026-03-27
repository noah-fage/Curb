"use client";

import { useState } from "react";

function EmailCard({ email }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState("idle");

  const handleCopy = async () => {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white text-left gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-center">
            D{email.day}
          </span>
          <span className="text-sm font-medium text-neutral-700 truncate">
            {email.label}
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-5 pb-5 bg-white border-t border-neutral-100">
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Subject
          </p>
          <p className="mt-1 text-sm text-neutral-800 font-medium">
            {email.subject}
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Body
          </p>
          <div className="mt-2 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {email.body}
          </div>

          <button
            onClick={handleCopy}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            {copyState === "copied" ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              <>
                <CopyIcon />
                Copy email
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function FollowUpEmails({ listingDescription, tone }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setEmails([]);

    try {
      const res = await fetch("/api/generate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingDescription, tone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unknown error");
      }

      const data = await res.json();
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-800">
            Follow-Up Emails
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Three emails for after the showing, ready to send.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading || !listingDescription}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            "Generate emails"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {emails.length > 0 && (
        <div className="flex flex-col gap-3">
          {emails.map((email) => (
            <EmailCard key={email.day} email={email} />
          ))}
        </div>
      )}
    </section>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}