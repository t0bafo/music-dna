export interface MusicProfile {
  avgBpm: number;
  avgEnergy: number;
  avgDanceability: number;
  avgValence: number;
  undergroundRatio: number;
}

export interface Archetype {
  name: string;
  description: string;
  traits: string[];
  emoji: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
  MIDNIGHT_CURATOR: {
    name: 'MIDNIGHT CURATOR',
    description: 'Mid-tempo Afrobeats • Introspective vibes • Quality over trends',
    traits: ['Mid-tempo Afrobeats', 'Introspective vibes', 'Quality over trends'],
    emoji: '🌙',
  },
  ENERGY_ARCHITECT: {
    name: 'ENERGY ARCHITECT',
    description: 'High-energy dance • Peak-hour ready • Crowd mover',
    traits: ['High-energy dance', 'Peak-hour ready', 'Crowd mover'],
    emoji: '⚡',
  },
  VIBES_ENGINEER: {
    name: 'VIBES ENGINEER',
    description: 'Chill grooves • Laid-back energy • Eclectic taste',
    traits: ['Chill grooves', 'Laid-back energy', 'Eclectic taste'],
    emoji: '🎧',
  },
  PEAK_COMMANDER: {
    name: 'PEAK COMMANDER',
    description: 'High-octane hits • Mainstream appeal • Party starter',
    traits: ['High-octane hits', 'Mainstream appeal', 'Party starter'],
    emoji: '🔥',
  },
  UNDERGROUND_EXPLORER: {
    name: 'UNDERGROUND EXPLORER',
    description: 'Deep cuts • Hidden gems • Tastemaker status',
    traits: ['Deep cuts', 'Hidden gems', 'Tastemaker status'],
    emoji: '💎',
  },
  BALANCED_CURATOR: {
    name: 'BALANCED CURATOR',
    description: 'Versatile taste • Mood-adaptive • Wide-ranging selection',
    traits: ['Versatile taste', 'Mood-adaptive', 'Wide-ranging selection'],
    emoji: '🎵',
  },
};

export function calculateArchetype(profile: MusicProfile): Archetype {
  const { avgBpm, avgEnergy, avgDanceability, avgValence, undergroundRatio } = profile;
  
  // Underground Explorer: prioritize if underground ratio is very high
  if (undergroundRatio > 0.4) {
    return ARCHETYPES.UNDERGROUND_EXPLORER;
  }
  
  // Energy Architect: high BPM, high energy, high danceability
  if (avgBpm > 120 && avgEnergy > 0.7 && avgDanceability > 0.7) {
    return ARCHETYPES.ENERGY_ARCHITECT;
  }
  
  // Peak Commander: high BPM, high energy, low underground
  if (avgBpm > 115 && avgEnergy > 0.65 && undergroundRatio < 0.3) {
    return ARCHETYPES.PEAK_COMMANDER;
  }
  
  // Midnight Curator: mid-tempo, moderate energy, some underground
  if (avgBpm >= 100 && avgBpm <= 120 && avgEnergy >= 0.4 && avgEnergy <= 0.7 && undergroundRatio > 0.3) {
    return ARCHETYPES.MIDNIGHT_CURATOR;
  }
  
  // Vibes Engineer: low BPM, low energy
  if (avgBpm < 100 && avgEnergy < 0.5) {
    return ARCHETYPES.VIBES_ENGINEER;
  }
  
  // Default: Balanced Curator
  return ARCHETYPES.BALANCED_CURATOR;
}

export function getEnergyDescription(energy: number): string {
  if (energy < 0.3) return 'Very chill, relaxed selections';
  if (energy < 0.5) return 'Laid-back energy mix';
  if (energy < 0.7) return 'Balanced energy, versatile';
  if (energy < 0.85) return 'High energy, gets crowds moving';
  return 'Maximum intensity, peak hour ready';
}

export function getDanceabilityDescription(dance: number): string {
  if (dance < 0.3) return 'More listening than dancing';
  if (dance < 0.5) return 'Groove-focused, head nodding';
  if (dance < 0.7) return 'Gets people on the floor';
  if (dance < 0.85) return 'Highly danceable selections';
  return 'Pure dance floor energy';
}

export function getValenceDescription(valence: number): string {
  if (valence < 0.3) return 'Moody, introspective vibes';
  if (valence < 0.5) return 'Emotionally complex';
  if (valence < 0.7) return 'Balanced mood palette';
  if (valence < 0.85) return 'Feel-good selections';
  return 'Pure euphoric energy';
}

export function getBpmDescription(bpm: number): string {
  if (bpm < 90) return 'Slow grooves, downtempo';
  if (bpm < 105) return 'Mid-tempo, versatile range';
  if (bpm < 120) return 'Sweet spot for Afrobeats';
  if (bpm < 135) return 'Uptempo, dance-ready';
  return 'High-tempo, intense energy';
}
