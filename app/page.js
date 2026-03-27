'use client';

import { FollowUpEmails } from '@/components/FollowUpEmails';
import { useState, useRef } from 'react';

const TONE_OPTIONS = [
  { id: 'mls', value: 'Standard MLS', label: 'Standard MLS' },
  { id: 'luxury', value: 'Luxury', label: 'Luxury Premium' },
  { id: 'ftb', value: 'First-time buyer friendly', label: 'First-Time Buyer' },
];

const NEIGHBORHOOD_OPTIONS = [
  'Quiet suburban, family-friendly',
  'Walkable urban, close to cafés & transit',
  'Upscale established neighborhood',
  'Up-and-coming creative district',
  'Waterfront / lakeside community',
  'Golf community / resort-style living',
  'Historic neighborhood with character',
  'Gated community, privacy-focused',
];

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function CurbPage() {
  const [form, setForm] = useState({
    address: '', beds: '', baths: '', sqft: '',
    feat1: '', feat2: '', feat3: '',
    neighborhood: '', tone: 'Standard MLS',
  });
  const [listing, setListing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const abortRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function generate() {
    if (!form.address && !form.beds && !form.feat1) {
      setError('Please fill in at least the address and one property detail.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Abort any in-progress stream
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsGenerating(true);
    setListing('');
    setError('');
    setStatusMsg('Writing your MLS listing description…');

    try {
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const { text } = JSON.parse(raw);
            if (text) { full += text; setListing(full); }
          } catch {}
        }
      }

      setStatusMsg('Done — your listing is ready.');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function copyListing() {
    navigator.clipboard.writeText(listing).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2200);
    });
  }

  const hasOutput = listing.length > 0;

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-black/10 flex items-center justify-between px-10 h-16">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#1A1714]">
            Curb<span className="text-[#C9994A]">.</span>
          </span>
          <span className="text-[0.68rem] uppercase tracking-widest text-[#1A1714]/60 font-medium">
            BUILT FOR REAL ESTATE PROFESSIONALS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#F5EDD8] text-[#C9994A] border border-[#E8C97A] px-2.5 py-0.5 rounded-full text-[0.68rem] font-medium uppercase tracking-wider">
            Beta
          </span>
          <span className="text-sm text-[#1A1714]/60">Listing Copy Generator</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">

        {/* ── FORM ── */}
        <aside className="w-[420px] shrink-0 bg-white border-r border-black/10 p-10 overflow-y-auto sticky top-16 h-[calc(100vh-64px)]">

          <p className="font-serif text-[1.35rem] font-medium text-[#1A1714] mb-1">Property Details</p>
          <p className="text-[0.82rem] text-[#1A1714]/60 mb-8">Fill in the details below and generate MLS-ready copy in seconds.</p>

          {/* Location */}
          <section className="mb-6">
            <div className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A] mb-3">Location</div>
            <label className="block text-[0.82rem] font-medium text-[#1A1714] mb-1">Property Address</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="e.g. 142 Maple Drive, Austin TX 78701"
              className="curb-input"
              onKeyDown={(e) => e.key === 'Enter' && generate()}
            />
          </section>

          {/* Specs */}
          <section className="mb-6">
            <div className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A] mb-3">Property Specs</div>
            <div className="grid grid-cols-3 gap-3">
              {[['beds','Beds','3'],['baths','Baths','2'],['sqft','Sq Ft','1850']].map(([k,l,p]) => (
                <div key={k}>
                  <label className="block text-[0.82rem] font-medium text-[#1A1714] mb-1">{l}</label>
                  <input type="number" value={form[k]} onChange={set(k)} placeholder={p} className="curb-input" />
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="mb-6">
            <div className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A] mb-3">Key Features</div>
            {[['feat1',"Renovated chef's kitchen"],['feat2','Large private backyard'],['feat3','New roof (2024)']].map(([k,p],i) => (
              <div key={k} className={i < 2 ? 'mb-2' : ''}>
                <label className="block text-[0.82rem] font-medium text-[#1A1714] mb-1">Feature {i+1}</label>
                <input type="text" value={form[k]} onChange={set(k)} placeholder={`e.g. ${p}`} className="curb-input" />
              </div>
            ))}
          </section>

          {/* Neighborhood */}
          <section className="mb-6">
            <div className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A] mb-3">Neighborhood</div>
            <label className="block text-[0.82rem] font-medium text-[#1A1714] mb-1">Neighborhood Vibe</label>
            <select value={form.neighborhood} onChange={set('neighborhood')} className="curb-input curb-select">
              <option value="">Select a vibe…</option>
              {NEIGHBORHOOD_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </section>

          {/* Tone */}
          <section className="mb-6">
            <div className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A] mb-3">Listing Tone</div>
            <div className="grid grid-cols-3 gap-2">
              {TONE_OPTIONS.map(({ id, value, label }) => (
                <label key={id} className={`block p-2.5 border rounded text-center text-[0.72rem] font-medium cursor-pointer transition-all leading-snug ${
                  form.tone === value
                    ? 'bg-[#F5EDD8] border-[#C9994A] text-[#C9994A]'
                    : 'bg-[#F9F6F0] border-black/10 text-[#1A1714]/60 hover:border-black/20 hover:text-[#1A1714]'
                }`}>
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    checked={form.tone === value}
                    onChange={set('tone')}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <hr className="border-black/10 my-6" />

          {error && (
            <div className="bg-red-50 border border-red-200/80 rounded px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={isGenerating}
            className="w-full py-3.5 bg-[#1A1714] text-[#F9F6F0] rounded text-[0.9rem] font-medium flex items-center justify-center gap-2 transition-all hover:bg-[#2d2926] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4"/>
              <circle cx="9" cy="9" r="3"/>
            </svg>
            {isGenerating ? 'Generating…' : 'Generate Listing Copy'}
          </button>
        </aside>

        {/* ── OUTPUT ── */}
        <main className="flex-1 p-10 overflow-y-auto">

          {/* Status bar */}
          {(isGenerating || statusMsg) && (
            <div className="flex items-center gap-2.5 mb-5 text-[0.8rem] text-[#1A1714]/60">
              {isGenerating && (
                <>
                  {[0,0.2,0.4].map((d,i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#C9994A] animate-pulse" style={{ animationDelay: `${d}s` }} />
                  ))}
                </>
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Empty State */}
          {!hasOutput && !isGenerating && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-[fadeIn_0.6s_0.3s_both]">
              <div className="w-14 h-14 border border-black/10 rounded-full flex items-center justify-center mb-5 bg-white">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3" className="opacity-30">
                  <rect x="3" y="3" width="16" height="16" rx="2"/>
                  <path d="M7 8h8M7 11h8M7 14h5"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl font-normal text-[#1A1714] mb-2">Your listing copy will appear here</h2>
              <p className="text-[0.85rem] text-[#1A1714]/60 max-w-xs leading-relaxed">
                Enter your property details on the left and click generate. Streaming output typically begins in under two seconds.
              </p>
            </div>
          )}

          {/* Output Card */}
          {(hasOutput || isGenerating) && (
            <div className="animate-[slideUp_0.4s_ease_both]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.68rem] uppercase tracking-widest font-medium text-[#C9994A]">
                  MLS Listing Description
                </span>
                {hasOutput && (
                  <button
                    onClick={copyListing}
                    className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[0.72rem] transition-all ${
                      hasCopied
                        ? 'border-[#5C7A65] text-[#5C7A65] bg-[#EAF0EC]'
                        : 'border-black/10 text-[#1A1714]/60 hover:border-black/20 hover:text-[#1A1714] bg-transparent'
                    }`}
                  >
                    {hasCopied ? (
                      <><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7l4 4 6-6"/></svg> Copied</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V2h8"/></svg> Copy</>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-white border border-black/10 rounded-lg p-6 shadow-[0_2px_12px_rgba(26,23,20,0.08)]">
                <p className={`text-[0.92rem] leading-[1.85] text-[#1A1714] font-light whitespace-pre-wrap ${isGenerating ? 'after:content-["▌"] after:text-[#C9994A] after:animate-[blink_0.8s_step-end_infinite] after:text-[0.8em] after:ml-px' : ''}`}>
                  {listing || '\u00A0'}
                </p>
                {hasOutput && !isGenerating && (
                  <p className="mt-3 text-[0.72rem] text-[#1A1714]/30">
                    {wordCount(listing)} words
                  </p>
                )}
              </div>
              {hasOutput && !isGenerating && (
                <FollowUpEmails listingDescription={listing} tone={form.tone} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
