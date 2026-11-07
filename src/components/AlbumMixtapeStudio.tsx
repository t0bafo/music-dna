import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Check, Disc3, Loader2, Music, Search, Sparkles, X, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getTopTracks,
  searchAlbums,
  getAlbumTracks,
  getAudioFeaturesFromReccoBeats,
} from '@/lib/spotify-api';
import { generateMixtape, type MixtapeAlbum, type MixtapeOrdering, type MixtapeResult } from '@/lib/mixtape-engine';
import { createCrate, addTracksToCrate } from '@/lib/crates-api';

interface PickAlbum {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
}

const ORDERINGS: { id: MixtapeOrdering; label: string; hint: string }[] = [
  { id: 'journey', label: 'Journey', hint: 'Follows each album’s story arc' },
  { id: 'interleave', label: 'Interleave', hint: 'Alternates between albums' },
  { id: 'bpm_flow', label: 'BPM Flow', hint: 'Smooth tempo transitions' },
  { id: 'energy_arc', label: 'Energy Arc', hint: 'Builds to a peak, then lands' },
];
const LENGTHS = [10, 15, 20, 25];
const MAX = 5;

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

const AlbumMixtapeStudio = ({ accessToken }: { accessToken: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customize, setCustomize] = useState(false);
  const [pendingCrateId, setPendingCrateId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<PickAlbum[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickAlbum[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PickAlbum[]>([]);
  const [ordering, setOrdering] = useState<MixtapeOrdering>('journey');
  const [length, setLength] = useState(20);
  const [sides, setSides] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MixtapeResult | null>(null);
  const [art, setArt] = useState<Record<string, string | null>>({});

  useEffect(() => {
    getTopTracks(accessToken, 'medium_term', 50)
      .then(({ items }) => {
        const map = new Map<string, PickAlbum & { n: number }>();
        items.forEach((t) => {
          const e = map.get(t.album.id);
          if (e) e.n++;
          else map.set(t.album.id, { id: t.album.id, name: t.album.name, artist: t.artists[0]?.name ?? 'Unknown', imageUrl: t.album.images?.[0]?.url ?? null, n: 1 });
        });
        setFavorites([...map.values()].sort((a, b) => b.n - a.n).slice(0, 10));
      })
      .catch(() => setFavorites([]));
  }, [accessToken]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const albums = await searchAlbums(accessToken, q);
        setResults(albums.map((a) => ({ id: a.id, name: a.name, artist: a.artists[0]?.name ?? 'Unknown', imageUrl: a.images?.[0]?.url ?? null })));
      } catch { setResults([]); } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, accessToken]);

  const isSelected = (id: string) => selected.some((a) => a.id === id);
  const toggle = (album: PickAlbum) => {
    setResult(null);
    setSelected((cur) => {
      if (cur.some((a) => a.id === album.id)) return cur.filter((a) => a.id !== album.id);
      if (cur.length >= MAX) { toast({ title: `Pick up to ${MAX} albums` }); return cur; }
      return [...cur, album];
    });
  };
  const move = (i: number, dir: -1 | 1) => {
    setResult(null);
    setSelected((cur) => {
      const next = [...cur]; const j = i + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const albumTracks = await Promise.all(selected.map((a) => getAlbumTracks(accessToken, a.id)));
      const features = ordering === 'bpm_flow' || ordering === 'energy_arc'
        ? await getAudioFeaturesFromReccoBeats(albumTracks.flat().map((t) => t.id)).catch(() => new Map())
        : new Map();
      const artMap: Record<string, string | null> = {};
      const albums: MixtapeAlbum[] = selected.map((a, ai) => {
        const tracks = albumTracks[ai];
        artMap[a.id] = a.imageUrl;
        return {
          albumId: a.id,
          albumName: a.name,
          tracks: tracks.map((t, i) => {
            const f = features.get(t.id);
            return {
              trackId: t.id, albumId: a.id, albumName: a.name, name: t.name,
              artists: t.artists.map((x) => x.name), durationMs: t.duration_ms,
              discNumber: t.disc_number, trackNumber: t.track_number,
              albumPosition: tracks.length > 1 ? i / (tracks.length - 1) : 0,
              bpm: f?.tempo, energy: f?.energy, valence: f?.valence, danceability: f?.danceability,
            };
          }),
        };
      });
      setArt(artMap);
      const r = generateMixtape(albums, { ordering, targetTracks: length, sides, seed: 0 });
      setResult(r);
      if (!r.tracks.length) toast({ title: 'Could not build a mixtape', description: r.diagnostics.notes[0], variant: 'destructive' });
    } catch (e) {
      toast({ title: 'Something went wrong', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const disabledReason = useMemo(() => {
    const m = new Map<MixtapeOrdering, string>();
    result?.diagnostics.disabledOrderings.forEach((d) => m.set(d.ordering, d.reason));
    return m;
  }, [result]);

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const name = `Mixtape: ${selected.map((a) => a.name).join(' × ')}`.slice(0, 80);
      const crateId = pendingCrateId ?? (await createCrate(name, `Album mixtape · ${ORDERINGS.find((o) => o.id === ordering)?.label}`, '📼', '#2F624E', accessToken)).id;
      setPendingCrateId(crateId);
      await addTracksToCrate(crateId, result.tracks.map((t) => ({
        track_id: t.trackId, name: t.name, artist_name: t.artists.join(', '), album_name: t.albumName,
        album_art_url: art[t.albumId] ?? '', duration_ms: t.durationMs, bpm: t.bpm, energy: t.energy,
        danceability: t.danceability, valence: t.valence,
      })), accessToken);
      toast({ title: `Saved ${result.tracks.length} tracks to "${name}"` });
      await queryClient.invalidateQueries({ queryKey: ['crates'] });
      await queryClient.invalidateQueries({ queryKey: ['crates-with-tracks'] });
      navigate(`/crates/${crateId}`);
    } catch (e) {
      toast({ title: 'Could not save', description: 'Retry to finish saving the same crate.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const AlbumTile = ({ album }: { album: PickAlbum }) => (
    <Button variant="ghost"
      type="button"
      onClick={() => toggle(album)}
      className="flex-shrink-0 w-[104px] h-auto p-0 block whitespace-normal text-left group"
      aria-pressed={isSelected(album.id)}
    >
      <div className={cn('relative w-[104px] h-[104px] rounded-md overflow-hidden ring-2 transition-all',
        isSelected(album.id) ? 'ring-primary' : 'ring-transparent group-hover:ring-border')}>
        {album.imageUrl ? <img src={album.imageUrl} alt={album.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full bg-muted flex items-center justify-center"><Music className="w-6 h-6 text-muted-foreground" /></div>}
        {isSelected(album.id) && (
          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-foreground truncate">{album.name}</p>
      <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
    </Button>
  );

  let sideBreak = -1;
  if (result?.sides) sideBreak = result.sides.a;

  return (
    <div className="space-y-6">
      {/* Step 1: pick */}
      <section className="border-b border-border">
        <CardContent className="p-5 lg:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-foreground">1. Pick 2–5 albums</h3>
            <Badge variant="secondary">{selected.length}/{MAX} selected</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any album on Spotify…" className="pl-9" />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          {results.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">{results.map((a) => <AlbumTile key={a.id} album={a} />)}</div>
          )}
          {favorites.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quick picks from your favorites</p>
              <div className="flex gap-3 overflow-x-auto pb-2">{favorites.map((a) => <AlbumTile key={a.id} album={a} />)}</div>
            </div>
          )}
          {selected.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your albums (order breaks ties)</p>
              {selected.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40">
                  <span className="w-5 text-center text-sm font-bold text-primary">{i + 1}</span>
                  {a.imageUrl ? <img src={a.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover" /> : <div className="w-10 h-10 rounded-md bg-muted" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.artist}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === selected.length - 1} aria-label="Move down"><ArrowDown className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggle(a)} aria-label="Remove"><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </section>

      {/* Step 2: settings */}
      <section className={cn('border-b border-border', selected.length < 2 && 'opacity-50 pointer-events-none')}>
        <CardContent className="p-5 lg:p-6 space-y-5">
          <h3 className="font-display text-lg font-bold text-foreground">2. Preview your mix</h3>
          <p className="text-sm text-muted-foreground">Journey follows each album from its opening to its closing, bringing their stories together. 20 tracks, with A/B sides.</p>
          <Button variant="ghost" aria-expanded={customize} onClick={() => setCustomize(v => !v)}>Customize the mix</Button>
          {customize && <>
          <div className="grid grid-cols-2 gap-2">
            {ORDERINGS.map((o) => {
              const reason = disabledReason.get(o.id);
              return (
                <Button variant="outline" key={o.id} type="button" onClick={() => { setOrdering(o.id); setResult(null); }}
                  className={cn('p-3 h-auto block whitespace-normal rounded-md border text-left transition-colors',
                    ordering === o.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border')}
                  title={reason}>
                  <p className="text-sm font-semibold text-foreground">{o.label}</p>
                  <p className="text-xs text-muted-foreground">{reason ?? o.hint}</p>
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex gap-1.5">
              {LENGTHS.map((n) => (
                <Button key={n} size="sm" variant={length === n ? 'default' : 'outline'} onClick={() => { setLength(n); setResult(null); }}>{n} tracks</Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={sides} onCheckedChange={(v) => { setSides(v); setResult(null); }} /> A/B sides
            </label>
          </div>
          </>}
          <Button size="lg" className="w-full gap-2" onClick={generate} disabled={generating || selected.length < 2}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Mixing…' : 'Preview sequence'}
          </Button>
        </CardContent>
      </section>

      {/* Step 3: result */}
      {result && result.tracks.length > 0 && (
        <section className="border-t border-border">
          <CardContent className="p-5 lg:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Disc3 className="w-5 h-5 text-primary" /> Your mixtape</h3>
                <p className="text-sm text-muted-foreground">
                  {result.tracks.length} tracks · {fmt(result.tracks.reduce((s, t) => s + t.durationMs, 0))}
                </p>
              </div>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save as crate
              </Button>
            </div>
            {result.diagnostics.notes.length > 0 && (
              <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3 space-y-1">
                {result.diagnostics.notes.map((n) => <p key={n}>{n}</p>)}
              </div>
            )}
            <ol className="space-y-1">
              {result.tracks.map((t, i) => (
                <li key={t.trackId}>
                  {result.sides && i === 0 && <p className="text-xs font-bold tracking-widest text-primary py-2">SIDE A</p>}
                  {i === sideBreak && <p className="text-xs font-bold tracking-widest text-primary pt-4 pb-2">SIDE B</p>}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40">
                    <span className="w-6 text-right text-xs text-muted-foreground">{i + 1}</span>
                    {art[t.albumId] ? <img src={art[t.albumId] ?? ''} alt="" className="w-9 h-9 rounded object-cover" /> : <div className="w-9 h-9 rounded bg-muted" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.artists.join(', ')} · {t.albumName}</p>
                    </div>
                    {t.bpm && <span className="hidden sm:inline text-xs text-muted-foreground">{Math.round(t.bpm)} BPM</span>}
                    <span className="text-xs text-muted-foreground">{fmt(t.durationMs)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </section>
      )}
    </div>
  );
};

export default AlbumMixtapeStudio;
