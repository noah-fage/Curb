'use client';

import { useState } from 'react';
import { FollowUpEmails } from '@/components/FollowUpEmails';

const TABS = [
  { id: 'listing', label: 'Listing' },
  { id: 'emails', label: 'Follow-up emails' },
  { id: 'captions', label: 'Social captions' },
  { id: 'cma', label: 'CMA narrative' },
  { id: 'openhouse', label: 'Open house scripts' },
];

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'X', 'Nextdoor'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[0.72rem] transition-all ${
        copied
          ? 'border-[#5C7A65] text-[#5C7A65] bg-[#EAF0EC]'
          : 'border-black/10 text-[#1A1714]/60 hover:border-black/20 hover:text-[#1A1714]'
      }`}
    >
      {copied ? (
        <><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7l4 4 6-6"/></svg>Copied</>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V2h8"/></svg>Copy</>
      )}
    </button>
  );
}

function GenerateButton({ onClick, loading, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1A1714] text-[#F9F6F0] text-[0.8rem] font-medium hover:bg-[#2d2926] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Generating…</>
      ) : label}
    </button>
  );
}

function SectionHeader({ label, onGenerate, loading, hasData, copyText }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A]">{label}</span>
      <div className="flex items-center gap-2">
        {hasData && copyText && <CopyButton text={copyText} />}
        <GenerateButton onClick={onGenerate} loading={loading} disabled={false} label="Generate" />
      </div>
    </div>
  );
}

// ── Captions tab ──────────────────────────────────────────────
function CaptionsTab({ listingDescription, tone }) {
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePlatform, setActivePlatform] = useState('Instagram');

  async function generate() {
    setLoading(true); setError(null); setCaptions([]);
    try {
      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingDescription, tone }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const data = await res.json();
      setCaptions(data.captions);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const active = captions.find(c => c.platform === activePlatform);

  return (
    <div>
      <SectionHeader label="Social media captions" onGenerate={generate} loading={loading} hasData={!!active} copyText={active?.content} />
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {captions.length > 0 && (
        <>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`px-3 py-1 rounded-full text-[0.72rem] font-medium border transition-all ${
                  activePlatform === p
                    ? 'bg-[#F5EDD8] border-[#C9994A] text-[#C9994A]'
                    : 'border-black/10 text-[#1A1714]/60 hover:border-black/20'
                }`}
              >{p}</button>
            ))}
          </div>
          {active && (
            <div className="bg-white border border-black/10 rounded-lg p-5">
              <p className="text-[0.9rem] leading-[1.85] text-[#1A1714] font-light whitespace-pre-wrap">{active.content}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── CMA tab ───────────────────────────────────────────────────
function CMATab({ listingDescription, formData }) {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true); setError(null); setNarrative('');
    try {
      const res = await fetch('/api/generate-cma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingDescription, ...formData }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const data = await res.json();
      setNarrative(data.narrative);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <SectionHeader label="CMA narrative" onGenerate={generate} loading={loading} hasData={!!narrative} copyText={narrative} />
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {narrative && (
        <div className="bg-white border border-black/10 rounded-lg p-6">
          <p className="text-[0.92rem] leading-[1.85] text-[#1A1714] font-light whitespace-pre-wrap">{narrative}</p>
        </div>
      )}
    </div>
  );
}

// ── Open house tab ────────────────────────────────────────────
function OpenHouseTab({ listingDescription, formData }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openIdx, setOpenIdx] = useState(0);

  async function generate() {
    setLoading(true); setError(null); setScripts([]);
    try {
      const res = await fetch('/api/generate-openhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingDescription, ...formData }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const data = await res.json();
      setScripts(data.scripts);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <SectionHeader label="Open house scripts" onGenerate={generate} loading={loading} hasData={false} />
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {scripts.length > 0 && (
        <div className="flex flex-col gap-3">
          {scripts.map((s, i) => (
            <div key={i} className="border border-black/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white text-left gap-4"
              >
                <span className="text-sm font-medium text-[#1A1714]">{s.moment}</span>
                <svg className={`w-4 h-4 text-[#1A1714]/30 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 bg-white border-t border-black/5">
                  <p className="mt-4 text-[0.9rem] leading-[1.85] text-[#1A1714] font-light">{s.script}</p>
                  <div className="mt-4">
                    <CopyButton text={s.script} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Listing tab ───────────────────────────────────────────────
function ListingTab({ listing, isGenerating, hasCopied, onCopy }) {
  function wordCount(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A]">MLS listing description</span>
        {listing && <CopyButton text={listing} />}
      </div>
      <div className="bg-white border border-black/10 rounded-lg p-6 shadow-[0_2px_12px_rgba(26,23,20,0.08)]">
        <p className={`text-[0.92rem] leading-[1.85] text-[#1A1714] font-light whitespace-pre-wrap ${isGenerating ? 'after:content-["▌"] after:text-[#C9994A] after:animate-[blink_0.8s_step-end_infinite] after:text-[0.8em] after:ml-px' : ''}`}>
          {listing || '\u00A0'}
        </p>
        {listing && !isGenerating && (
          <p className="mt-3 text-[0.72rem] text-[#1A1714]/30">{wordCount(listing)} words</p>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export function OutputTabs({ listing, isGenerating, tone, formData }) {
  const [activeTab, setActiveTab] = useState('listing');
  const hasListing = listing.length > 0;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 mb-6 border-b border-black/10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={!hasListing && tab.id !== 'listing'}
            className={`px-4 py-2.5 text-[0.78rem] font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#C9994A] text-[#C9994A]'
                : 'border-transparent text-[#1A1714]/50 hover:text-[#1A1714] disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'listing' && (
        <ListingTab listing={listing} isGenerating={isGenerating} />
      )}
      {activeTab === 'emails' && hasListing && (
        <FollowUpEmails listingDescription={listing} tone={tone} />
      )}
      {activeTab === 'captions' && hasListing && (
        <CaptionsTab listingDescription={listing} tone={tone} />
      )}
      {activeTab === 'cma' && hasListing && (
        <CMATab listingDescription={listing} formData={formData} />
      )}
      {activeTab === 'openhouse' && hasListing && (
        <OpenHouseTab listingDescription={listing} formData={formData} />
      )}
    </div>
  );
}