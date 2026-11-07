import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getAllUserPlaylists, getAllPlaylistTracks, type SpotifyPlaylist, type SpotifyTrack } from '@/lib/spotify-api';
import { createCrate, addTracksToCrate } from '@/lib/crates-api';
import { playlistTracksToAdd } from '@/lib/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function PlaylistCrateStart({ accessToken }: { accessToken: string }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selected, setSelected] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    getAllUserPlaylists(accessToken).then(items => { if (live) setPlaylists(items); })
      .catch(() => { if (live) setError('Spotify playlists are unavailable for this account right now. Try again, or start empty and add songs with Spotify search.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [accessToken, retry]);
  const pick = async (playlist: SpotifyPlaylist) => {
    setSelected(playlist); setName(playlist.name); setLoading(true); setTracks([]); setError(''); setCreatedId(null);
    try { setTracks(await getAllPlaylistTracks(accessToken, playlist.id)); }
    catch { setError('This playlist could not be read. Choose another playlist, or start empty and search Spotify.'); }
    finally { setLoading(false); }
  };
  const save = async () => {
    if (!selected || !name.trim() || saving) return;
    setSaving(true); setError('');
    let id = createdId;
    try {
      if (!id) {
        const crate = await createCrate(name.trim(), `Imported from Spotify · ${selected.name}`.slice(0, 200), '🎵', '#2F624E', accessToken);
        id = crate.id; setCreatedId(id);
      }
      await addTracksToCrate(id, playlistTracksToAdd(tracks), accessToken);
      await client.invalidateQueries({ queryKey: ['crates'] });
      await client.invalidateQueries({ queryKey: ['crates-with-tracks'] });
      navigate(`/crates/${id}`);
    } catch { setError(id ? 'Your crate was created, but the songs did not finish saving. Retry to finish the same crate.' : 'Could not save this crate. Please try again.'); }
    finally { setSaving(false); }
  };
  return <div className="space-y-4">
    {selected ? <>
      <Button variant="ghost" disabled={loading || saving || !!createdId} onClick={() => { setSelected(null); setError(''); }} className="gap-2"><ArrowLeft className="w-4 h-4" />Choose another playlist</Button>
      <h3 className="font-display text-xl break-words">{selected.name}</h3>
      <p className="text-sm text-muted-foreground">{selected.tracks?.total ?? tracks.length} tracks on Spotify · {playlistTracksToAdd(tracks).length} importable songs</p>
      <label className="block text-sm space-y-2">Crate name<Input value={name} disabled={!!createdId || saving} maxLength={80} onChange={e => setName(e.target.value)} /></label>
      {!loading && <ol className="border-t border-border">{tracks.slice(0, 5).map((t, i) => <li key={`${t.id}:${i}`} className="py-3 border-b border-border flex gap-3"><span className="text-muted-foreground text-xs pt-1">{i + 1}</span><div className="min-w-0"><p className="text-sm font-medium break-words">{t.name}</p><p className="text-xs text-muted-foreground">{t.artists.map(a => a.name).join(', ')}</p></div></li>)}</ol>}
      <p className="text-xs text-muted-foreground">Your Spotify playlist stays unchanged. Unavailable songs, podcasts, and local files are skipped; duplicate songs appear once.</p>
      <Button disabled={loading || saving || !name.trim() || !playlistTracksToAdd(tracks).length} onClick={save} className="w-full gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{createdId ? 'Retry saving tracks' : 'Save as crate'}</Button>
    </> : <>
      <Input aria-label="Find a playlist" placeholder="Find a playlist" value={filter} onChange={e => setFilter(e.target.value)} />
      <div className="space-y-1">{playlists.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(p => <Button variant="ghost" key={p.id} onClick={() => pick(p)} className="w-full h-auto py-3 justify-start text-left gap-3 whitespace-normal">
        {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-10 h-10 object-cover rounded" />}<span className="min-w-0"><span className="block break-words font-medium">{p.name}</span><span className="block text-xs text-muted-foreground">{p.tracks?.total ?? 0} tracks · {p.owner.display_name}</span></span>
      </Button>)}</div>
      {!loading && !error && !playlists.length && <p className="text-sm text-muted-foreground">No playlists available. Start empty or mix a few albums instead.</p>}
    </>}
    {loading && <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading playlists" />}
    {error && <div role="alert" className="text-sm text-destructive space-y-2"><p>{error}</p>{!selected && <Button variant="outline" onClick={() => setRetry(r => r + 1)}>Try again</Button>}</div>}
  </div>;
}