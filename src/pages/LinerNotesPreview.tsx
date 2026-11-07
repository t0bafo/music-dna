import { useEffect, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SAMPLE_CRATE } from '@/lib/sample-crate';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Pass 1 design exploration: isolated "Liner Notes" landing hero in two sleeve
 * treatments. Palette is scoped to this page only — nothing app-wide changes.
 */
type Variant = 'paper' | 'ink';

// Page stays on paper for both; only the sleeve changes, so the comparison is fair.
const PAGE = { bg: '#F4F0E8', fg: '#151613', muted: '#4A4C45', accent: '#2F624E', accentFg: '#F4F0E8', rule: '#D9D2C3' };
const SLEEVES: Record<Variant, { bg: string; fg: string; muted: string; accent: string; rule: string; grain: number }> = {
  paper: { bg: '#EAE3D4', fg: '#151613', muted: '#4A4C45', accent: '#2F624E', rule: '#CFC6B3', grain: 0.18 },
  // Muted green fails on ink (≈2.6:1), so the ink sleeve uses a lifted tint of it.
  ink: { bg: '#151613', fg: '#F4F0E8', muted: '#B9B4A8', accent: '#8FBFA8', rule: '#33352F', grain: 0.12 },
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';

const display: CSSProperties = { fontFamily: '"Fraunces", Georgia, serif', fontVariationSettings: '"opsz" 144' };
const ui: CSSProperties = { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' };
const label: CSSProperties = { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase' };

const LinerNotesPreview = () => {
  const { variant = 'paper' } = useParams();
  const v: Variant = variant === 'ink' ? 'ink' : 'paper';
  const s = SLEEVES[v];
  const { login } = useAuth();
  const samplePath = `/sample/${SAMPLE_CRATE.slug}`;

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONTS;
    document.head.appendChild(l);
    return () => { l.remove(); };
  }, []);

  return (
    <div style={{ ...ui, background: PAGE.bg, color: PAGE.fg, minHeight: '100vh' }}>
      <header className="mx-auto max-w-md px-5 py-3 flex items-center justify-between">
        <span style={{ ...display, fontSize: '1.125rem', fontWeight: 600 }}>Music DNA</span>
        <button type="button" onClick={() => login()} className="min-h-11 px-2 text-sm font-medium" style={{ color: PAGE.fg }}>
          Sign in
        </button>
      </header>

      <main className="mx-auto max-w-md px-5 pb-10">
        <h1 style={{ ...display, fontWeight: 500, fontSize: 'clamp(2.25rem, 10vw, 2.75rem)', lineHeight: 1.02, letterSpacing: '-0.02em' }}>
          Find the tracks you don’t want to lose.
        </h1>
        <p className="mt-3" style={{ color: PAGE.muted, fontSize: '1rem', lineHeight: 1.5 }}>
          Keep the music and the memory together. Save tracks in searchable crates, then turn a crate into a Spotify playlist whenever you want.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to={samplePath}
            className="inline-flex min-h-12 items-center rounded-full px-6 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: PAGE.accent, color: PAGE.accentFg }}
          >
            Explore a sample crate
          </Link>
          <button type="button" onClick={() => login()} className="min-h-11 text-sm font-medium underline underline-offset-4" style={{ color: PAGE.fg }}>
            Connect Spotify
          </button>
        </div>

        {/* The sleeve — the only place grain and the record motif appear */}
        <Link
          to={samplePath}
          aria-label={`Open the sample crate ${SAMPLE_CRATE.name}`}
          className="relative mt-6 block overflow-hidden rounded-md p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: s.bg, color: s.fg, boxShadow: v === 'paper' ? `inset 0 0 0 1px ${s.rule}` : 'none' }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ backgroundImage: GRAIN, opacity: s.grain, mixBlendMode: v === 'ink' ? 'screen' : 'multiply' }} />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
            style={{ background: `repeating-radial-gradient(circle, ${s.fg}22 0 1px, transparent 1px 5px)`, boxShadow: `inset 0 0 0 30px ${s.bg}` }}
          />
          <div className="relative">
            <div className="flex items-center justify-between" style={{ ...label, color: s.muted }}>
              <span>Liner notes · Sample crate</span>
              <span>{SAMPLE_CRATE.tracks.length} tracks</span>
            </div>
            <h2 className="mt-2" style={{ ...display, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.1 }}>
              {SAMPLE_CRATE.name}
            </h2>
            <p className="mt-2 text-sm" style={{ color: s.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
              “{SAMPLE_CRATE.note}”
            </p>
            <ol className="mt-3">
              {SAMPLE_CRATE.tracks.slice(0, 2).map((t, i) => (
                <li key={t.id} className="flex items-baseline gap-3 py-2.5" style={{ borderTop: `1px solid ${s.rule}` }}>
                  <span style={{ ...label, color: s.muted }}>A{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-sm" style={{ color: s.muted }}>{t.artist}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-3 text-sm" style={{ borderTop: `1px solid ${s.rule}` }}>
              <span className="font-medium" style={{ color: s.accent }}>Open and search →</span>
              <span style={{ ...label, color: s.muted }}>Try searching ‘Tems’</span>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
};

export default LinerNotesPreview;
