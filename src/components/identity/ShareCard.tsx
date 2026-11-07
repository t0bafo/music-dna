import { forwardRef } from 'react';

/**
 * The exported share image. Rendered at full pixel size; the in-app preview
 * renders this same component scaled down, so preview === export.
 *
 * Colors are literal values on purpose: this is image artwork rasterized by
 * html2canvas, not themed app UI, and must look identical in light/dark mode.
 */

export type ShareFormat = 'story' | 'square' | 'wide';

export const SHARE_FORMATS: Record<ShareFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Story' },
  square: { width: 1080, height: 1080, label: 'Square' },
  wide: { width: 1200, height: 675, label: 'Wide' },
};

export interface ShareCardTrack {
  name: string;
  artist: string;
}

export interface ShareCardProps {
  format: ShareFormat;
  title?: string | null;
  tracks: ShareCardTrack[];
}

const INK = '#F3EFE6';
const MUTED = 'rgba(243, 239, 230, 0.56)';
const FAINT = 'rgba(243, 239, 230, 0.14)';
const PAPER = '#121211';
const ACCENT = '#00CC88';
const FONT = '"Space Grotesk", Inter, system-ui, sans-serif';

export const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

/** Shrinks the headline so its longest word always fits the column. */
export const headlineSize = (title: string, columnWidth: number, base: number) => {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length), 1);
  return Math.floor(Math.min(base, columnWidth / (longest * 0.64)));
};

const Grain = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px)',
    }}
  />
);

/** Concentric grooves: the record peeking out of its sleeve. */
const Record = ({ size, top, right }: { size: number; top: number; right: number }) => {
  const rings = [1, 0.84, 0.68, 0.52];
  return (
    <div style={{ position: 'absolute', top, right, width: size, height: size }}>
      {rings.map((r) => (
        <div
          key={r}
          style={{
            position: 'absolute',
            left: (size * (1 - r)) / 2,
            top: (size * (1 - r)) / 2,
            width: size * r,
            height: size * r,
            borderRadius: '50%',
            border: `2px solid ${FAINT}`,
            boxSizing: 'border-box',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: size * 0.36,
          top: size * 0.36,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: ACCENT,
        }}
      />
    </div>
  );
};

const Label = ({ children, size }: { children: React.ReactNode; size: number }) => (
  <div
    style={{
      fontSize: size,
      letterSpacing: size * 0.22,
      textTransform: 'uppercase',
      color: MUTED,
      fontWeight: 500,
    }}
  >
    {children}
  </div>
);

const TrackList = ({
  tracks,
  titleSize,
  artistSize,
  gap,
  maxTitle,
}: {
  tracks: ShareCardTrack[];
  titleSize: number;
  artistSize: number;
  gap: number;
  maxTitle: number;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>
    {tracks.slice(0, 3).map((t, i) => (
      <div key={i} style={{ display: 'flex', gap: titleSize * 0.7, alignItems: 'baseline' }}>
        <div
          style={{
            fontSize: artistSize,
            color: ACCENT,
            fontWeight: 600,
            letterSpacing: 2,
            minWidth: artistSize * 1.6,
          }}
        >
          A{i + 1}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: titleSize, fontWeight: 600, color: INK, lineHeight: 1.15, whiteSpace: 'nowrap' }}>
            {truncate(t.name, maxTitle)}
          </div>
          <div style={{ fontSize: artistSize, color: MUTED, marginTop: artistSize * 0.3, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {truncate(t.artist, maxTitle + 4)}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Wordmark = ({ size }: { size: number }) => (
  <div style={{ fontSize: size, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
    <span style={{ color: ACCENT, fontSize: size * 0.7 }}>●</span>
    <span style={{ fontWeight: 700, color: INK, letterSpacing: -0.5, marginLeft: size * 0.4 }}>Music DNA</span>
    <span style={{ fontSize: size * 0.8, color: MUTED, marginLeft: size * 0.5 }}>musicdna.tobiafo.com</span>
  </div>
);

const Headline = ({ title, size }: { title: string; size: number }) => (
  <div
    style={{
      fontSize: size,
      lineHeight: 0.92,
      fontWeight: 700,
      letterSpacing: -size * 0.035,
      textTransform: 'uppercase',
      color: INK,
      wordBreak: 'keep-all',
    }}
  >
    {title.split(/\s+/).map((w, i) => (
      <div key={i}>{w}</div>
    ))}
  </div>
);

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ format, title, tracks }, ref) => {
  const { width, height } = SHARE_FORMATS[format];
  const headline = (title && title.trim()) || 'My Music DNA';
  const shown = tracks.slice(0, 3);
  const base: React.CSSProperties = {
    width,
    height,
    background: PAPER,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: FONT,
    boxSizing: 'border-box',
  };

  if (format === 'story') {
    // Keep text inside ~260px top/bottom safe zones used by story UIs.
    return (
      <div ref={ref} style={base}>
        <Grain />
        <Record size={700} top={1380} right={-260} />
        <div
          style={{
            position: 'absolute',
            left: 96,
            right: 96,
            top: 280,
            bottom: 280,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Label size={26}>Side A · Listening identity</Label>
          <div>
            <Headline title={headline} size={headlineSize(headline, 860, 168)} />
            <div style={{ width: 120, height: 6, background: ACCENT, marginTop: 64 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
            {shown.length > 0 && (
              <TrackList tracks={shown} titleSize={50} artistSize={32} gap={shown.length < 3 ? 56 : 44} maxTitle={30} />
            )}
            <Wordmark size={34} />
          </div>
        </div>
      </div>
    );
  }

  if (format === 'square') {
    return (
      <div ref={ref} style={base}>
        <Grain />
        <Record size={520} top={-160} right={-160} />
        <div
          style={{
            position: 'absolute',
            inset: 88,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Label size={22}>Side A</Label>
          <Headline title={headline} size={headlineSize(headline, 820, 124)} />
          {shown.length > 0 && (
            <TrackList tracks={shown} titleSize={36} artistSize={24} gap={26} maxTitle={36} />
          )}
          <Wordmark size={26} />
        </div>
      </div>
    );
  }

  // wide: headline left, tracklist right
  return (
    <div ref={ref} style={base}>
      <Grain />
      <Record size={420} top={-150} right={-150} />
      <div style={{ position: 'absolute', inset: 72, display: 'flex', gap: 72 }}>
        <div style={{ flex: '0 0 540px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Label size={18}>Side A · Listening identity</Label>
          <Headline title={headline} size={headlineSize(headline, 520, 104)} />
          <Wordmark size={22} />
        </div>
        <div style={{ width: 2, background: FAINT }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {shown.length > 0 ? (
            <TrackList tracks={shown} titleSize={30} artistSize={20} gap={30} maxTitle={20} />
          ) : (
            <div style={{ fontSize: 24, color: MUTED }}>Organized by vibe, not genre.</div>
          )}
        </div>
      </div>
    </div>
  );
});
ShareCard.displayName = 'ShareCard';

export default ShareCard;
