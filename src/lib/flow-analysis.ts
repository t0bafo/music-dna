// Flow analysis utilities for playlist curation

export interface TrackWithFeatures {
  id: string;
  name: string;
  artist: string;
  albumImage?: string;
  tempo?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  speechiness?: number;
  instrumentalness?: number;
  liveness?: number;
  popularity?: number;
}

export interface FlowScore {
  score: number;
  grade: 'Excellent Flow' | 'Good Flow' | 'Needs Work';
  summary: string;
  color: 'green' | 'yellow' | 'red';
}

export interface FlowInsight {
  type: 'success' | 'warning' | 'tip';
  message: string;
  trackPosition?: number;
}

export interface TrackFlowImpact {
  status: 'good' | 'review' | 'issue';
  reason: string;
  bpmChange?: number;
  energyChange?: number;
}

export const calculateFlowScore = (tracks: TrackWithFeatures[]): FlowScore => {
  const tracksWithTempo = tracks.filter(t => t.tempo != null && t.energy != null);
  
  if (tracksWithTempo.length < 2) {
    return {
      score: 0,
      grade: 'Needs Work',
      summary: 'Not enough audio data available to analyze flow',
      color: 'red',
    };
  }

  let score = 100;
  const issues: string[] = [];

  // Analyze BPM transitions
  let sharpJumps = 0;
  let monotonous = 0;
  
  for (let i = 1; i < tracksWithTempo.length; i++) {
    const bpmChange = Math.abs((tracksWithTempo[i].tempo || 0) - (tracksWithTempo[i - 1].tempo || 0));
    if (bpmChange > 20) {
      score -= 5;
      sharpJumps++;
    }
    if (bpmChange < 3) {
      score -= 2;
      monotonous++;
    }
  }

  if (sharpJumps > 3) {
    issues.push('multiple sharp BPM jumps');
  }
  if (monotonous > tracksWithTempo.length * 0.5) {
    issues.push('BPM is too consistent');
  }

  // Check energy progression
  const midpoint = Math.floor(tracksWithTempo.length / 2);
  const firstHalf = tracksWithTempo.slice(0, midpoint);
  const secondHalf = tracksWithTempo.slice(midpoint);

  const avgEnergyFirst = firstHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / firstHalf.length;
  const avgEnergySecond = secondHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / secondHalf.length;

  if (avgEnergySecond < avgEnergyFirst * 0.9) {
    score -= 10;
    issues.push('energy drops in second half');
  }

  // Check variety
  const tempos = tracksWithTempo.map(t => t.tempo || 0).filter(t => t > 0);
  if (tempos.length > 0) {
    const tempoRange = Math.max(...tempos) - Math.min(...tempos);
    if (tempoRange < 15) {
      score -= 10;
      issues.push('limited BPM variety');
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine grade and color
  let grade: FlowScore['grade'];
  let color: FlowScore['color'];
  let summary: string;

  if (score >= 80) {
    grade = 'Excellent Flow';
    color = 'green';
    summary = 'Your playlist has smooth BPM transitions and good energy progression';
  } else if (score >= 60) {
    grade = 'Good Flow';
    color = 'yellow';
    summary = issues.length > 0 
      ? `Solid flow with room for improvement: ${issues.join(', ')}`
      : 'Good transitions overall with some areas to refine';
  } else {
    grade = 'Needs Work';
    color = 'red';
    summary = issues.length > 0 
      ? `Flow issues detected: ${issues.join(', ')}`
      : 'Consider reordering tracks for better transitions';
  }

  return { score, grade, summary, color };
};

export const generateInsights = (tracks: TrackWithFeatures[]): FlowInsight[] => {
  const insights: FlowInsight[] = [];
  const tracksWithData = tracks.filter(t => t.tempo != null && t.energy != null);

  if (tracksWithData.length < 2) {
    insights.push({
      type: 'warning',
      message: 'Audio features unavailable for most tracks - insights limited',
    });
    return insights;
  }

  // Find sharp BPM jumps
  for (let i = 1; i < tracksWithData.length; i++) {
    const bpmChange = Math.abs((tracksWithData[i].tempo || 0) - (tracksWithData[i - 1].tempo || 0));
    if (bpmChange > 20) {
      const prevTrack = tracksWithData[i - 1];
      const currTrack = tracksWithData[i];
      insights.push({
        type: 'warning',
        message: `Sharp BPM drop at track ${i + 1}: "${prevTrack.name}" (${Math.round(prevTrack.tempo || 0)} BPM) → "${currTrack.name}" (${Math.round(currTrack.tempo || 0)} BPM)`,
        trackPosition: i + 1,
      });
    }
  }

  // Check energy build
  const midpoint = Math.floor(tracksWithData.length / 2);
  const firstHalf = tracksWithData.slice(0, midpoint);
  const secondHalf = tracksWithData.slice(midpoint);
  
  const avgEnergyFirst = firstHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / firstHalf.length;
  const avgEnergySecond = secondHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / secondHalf.length;

  if (avgEnergySecond > avgEnergyFirst * 1.1) {
    insights.push({
      type: 'success',
      message: `Great energy build from tracks 1-${tracksWithData.length}`,
    });
  } else if (avgEnergySecond < avgEnergyFirst * 0.9) {
    insights.push({
      type: 'warning',
      message: 'Energy drops in the second half - consider adding more energetic tracks toward the end',
    });
  }

  // Check BPM variety
  const tempos = tracksWithData.map(t => t.tempo || 0).filter(t => t > 0);
  if (tempos.length > 0) {
    const minTempo = Math.min(...tempos);
    const maxTempo = Math.max(...tempos);
    const tempoRange = maxTempo - minTempo;

    if (tempoRange >= 30) {
      insights.push({
        type: 'success',
        message: `Good variety in tempo (${Math.round(minTempo)}-${Math.round(maxTempo)} BPM range)`,
      });
    } else if (tempoRange < 15) {
      insights.push({
        type: 'warning',
        message: `All tracks are ${Math.round(minTempo)}-${Math.round(maxTempo)} BPM - more variety could improve flow`,
      });
    }
  }

  // Check for smooth transitions
  let smoothTransitions = 0;
  for (let i = 1; i < tracksWithData.length; i++) {
    const bpmChange = Math.abs((tracksWithData[i].tempo || 0) - (tracksWithData[i - 1].tempo || 0));
    if (bpmChange >= 3 && bpmChange <= 15) {
      smoothTransitions++;
    }
  }
  
  if (smoothTransitions > tracksWithData.length * 0.6) {
    insights.push({
      type: 'success',
      message: 'Smooth BPM transitions throughout the playlist',
    });
  }

  // Find energy plateau
  let plateauStart = -1;
  let plateauLength = 0;
  let maxPlateau = 0;
  let maxPlateauStart = -1;

  for (let i = 1; i < tracksWithData.length; i++) {
    const energyChange = Math.abs((tracksWithData[i].energy || 0) - (tracksWithData[i - 1].energy || 0));
    if (energyChange < 0.05) {
      if (plateauStart === -1) plateauStart = i - 1;
      plateauLength++;
    } else {
      if (plateauLength > maxPlateau) {
        maxPlateau = plateauLength;
        maxPlateauStart = plateauStart;
      }
      plateauStart = -1;
      plateauLength = 0;
    }
  }

  if (maxPlateau >= 5) {
    insights.push({
      type: 'warning',
      message: `Energy plateau from tracks ${maxPlateauStart + 1}-${maxPlateauStart + maxPlateau + 1} - consider adding variation`,
    });
  }

  // Pro tips
  if (tracks.length >= 25 && tracks.length <= 35) {
    insights.push({
      type: 'tip',
      message: `Playlist length is optimal for Spotify algorithm (${tracks.length} tracks)`,
    });
  } else if (tracks.length < 20) {
    insights.push({
      type: 'tip',
      message: 'Consider adding more tracks - 25-35 tracks is optimal for Spotify algorithm',
    });
  }

  // Find peak energy point
  let peakIndex = 0;
  let peakEnergy = 0;
  tracksWithData.forEach((t, i) => {
    if ((t.energy || 0) > peakEnergy) {
      peakEnergy = t.energy || 0;
      peakIndex = i;
    }
  });

  const peakPosition = peakIndex / tracksWithData.length;
  if (peakPosition >= 0.4 && peakPosition <= 0.7) {
    insights.push({
      type: 'success',
      message: `Peak energy at track ${peakIndex + 1} - great placement in the middle section`,
    });
  } else if (peakPosition < 0.3) {
    insights.push({
      type: 'tip',
      message: 'Consider moving high-energy tracks toward the middle for a stronger peak',
    });
  }

  return insights;
};

export const calculateTrackFlowImpact = (
  tracks: TrackWithFeatures[],
  index: number
): TrackFlowImpact => {
  const track = tracks[index];
  
  if (track.tempo == null || track.energy == null) {
    return {
      status: 'review',
      reason: 'Audio features unavailable',
    };
  }

  if (index === 0) {
    return {
      status: 'good',
      reason: 'Opening track',
    };
  }

  const prevTrack = tracks[index - 1];
  
  if (prevTrack.tempo == null || prevTrack.energy == null) {
    return {
      status: 'review',
      reason: 'Cannot compare - previous track missing data',
    };
  }

  const bpmChange = Math.abs(track.tempo - prevTrack.tempo);
  const energyChange = Math.abs(track.energy - prevTrack.energy);

  if (bpmChange > 25) {
    return {
      status: 'issue',
      reason: `Creates ${Math.round(bpmChange)} BPM jump - consider repositioning`,
      bpmChange,
      energyChange,
    };
  }

  if (bpmChange > 20) {
    return {
      status: 'review',
      reason: `Notable BPM change of ${Math.round(bpmChange)}`,
      bpmChange,
      energyChange,
    };
  }

  if (energyChange > 0.3) {
    return {
      status: 'review',
      reason: `Sharp energy shift of ${Math.round(energyChange * 100)}%`,
      bpmChange,
      energyChange,
    };
  }

  if (bpmChange >= 3 && bpmChange <= 15 && energyChange < 0.2) {
    return {
      status: 'good',
      reason: 'Perfect transition from previous track',
      bpmChange,
      energyChange,
    };
  }

  return {
    status: 'good',
    reason: 'Smooth transition',
    bpmChange,
    energyChange,
  };
};
