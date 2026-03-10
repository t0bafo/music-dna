/**
 * Music DNA Artist Database v2.0 — SNITC Brooklyn Sound Progression Blueprint
 * Maintained by Apollo Wrldx
 * Last updated: 2026-03-10
 * 300+ artists for SNITC event playlist generation
 * 
 * Event: Saturday Night in the City (SNITC Brooklyn)
 * Date: April 25, 2026
 * Venue: The House, Brooklyn
 * Duration: 6 hours (10:00 PM - 4:00 AM)
 */

export type SlotType =
  | 'foundation_setter'
  | 'energy_builder'
  | 'peak_energy'
  | 'late_peak_curator'
  | 'deep_dive'
  | 'global_closer'

export interface Segment {
  tracks: string
  duration_min: string
  energy: { min: number; max: number }
  bpm: { min: number; max: number }
  sound: string
  artists: string[]
  example_tracks: string[]
  transition_to?: string
  handoff_notes?: string
}

export interface SetBlueprint {
  dj: string
  time: string
  role: string
  genre: string
  energy_arc: { start: number; end: number }
  bpm_range: { min: number; max: number }
  track_count: number
  segments: Segment[]
  rules: string[]
}

export const ARTIST_DATABASE = {
  afro_house: {
    tier_1_established: [
      "Black Coffee", "Shimza", "Culoe De Song", "Kususa", "Da Capo",
      "Atjazz", "Boddhi Satva", "DJ Mreja", "Enoo Napa", "Jullian Gomes",
      "Kafele Bandele", "Lazarusman", "Manoo", "Osunlade", "Rocco",
      "Saint Lia", "Thakzin", "Vinny Da Vinci",
    ],
    tier_2_rising: [
      "3rd Son", "Aero Manyelo", "Aminah", "Aryue", "Caiiro",
      "Cornelius SA", "Deep Narratives", "Djeff Afrozila", "Ed-Ward", "Fka Mash",
      "Floyd Lavine", "Hyenah", "JazziDisciples", "Jazzuelle", "Kelvin Momo",
      "Kin Dee", "Lahza", "Legendary Crisp", "Lemon & Herb", "Lokiboi",
      "Msaki", "Nitefreak", "Noon Gun", "Pablo Fierro", "Ralf GUM",
      "Ryan Murgatroyd", "SoulMC", "Stones & Bones", "Sun-El Musician",
      "Themba", "Zakes Bantwini",
    ],
    tier_3_underground: [
      "6th Avenue", "Argento Dust", "Bakongo", "Christopher Yates", "Coflo",
      "Darian Crouse", "Djoko", "Ezel", "FloFilz", "Gift",
      "Hallex M", "Hylu", "Jaydee", "Kaidi Tatham", "Keor Meteor",
      "Lars Bartkuhn", "Maero", "Nandu", "Nuno Dos Santos", "Patrick Podage",
      "Phaze Dee", "Reece Madlisa", "Roog", "Sebb Junior", "Stimming",
      "Toto Chiavetta", "Vanco",
    ],
  },

  amapiano: {
    tier_1_established: [
      "Uncle Waffles", "Major League DJz", "DBN Gogo", "DJ Maphorisa",
      "Kabza De Small", "Focalistic", "Kamo Mphela", "Ch'cco",
      "MFR Souls", "Cassper Nyovest", "Lady Du", "DJ Stokie",
      "Mellow & Sleazy", "Young Stunna", "Vigro Deep", "MDU aka TRP",
      "Busta 929", "Mr JazziQ",
    ],
    tier_2_rising: [
      "Robot Boii", "Toss", "Tyler ICU", "Tumelo.za", "PCee",
      "Daliwonga", "Njelic", "De Mthuda", "Sino Msolo", "Kelvin Momo",
      "Mas Musiq", "Aymos", "Sam Deep", "Boohle", "Azana",
      "Zee Nxumalo", "Djy Biza", "Djy Zan'Ten", "Entity MusiQ", "Lihle Bliss",
      "Nvcho", "EeQue", "ShaunMusiq", "Ftears", "Scotts Maphuma",
      "DJ Vitoto", "LeeMcKrazy", "Stompiiey", "2woshort", "Eemoh",
      "Triple X Da Ghost", "Madumane", "Musa Keys", "Reece Madlisa",
      "Zuma", "Mpura", "Killer Kau",
    ],
    tier_3_underground: [
      "Josiah De Disciple", "JazziDisciples", "Kabelo Motha", "Kwiish SA",
      "Loxion Deep", "Mr Thela", "Semi Tee", "Soa Mattrix",
      "DJ Vitoto", "LuuDadeejay", "DJ Lag", "Thakzin",
      "Djy Jaivane", "DJ Buckz", "Felo Le Tee", "Bongza",
      "DJAbi", "Djy Ma'Ten", "Russell Zuma",
      "The Godfathers of Deep House SA", "Limpopo Champions League",
      "DJ Paper707", "MKeyz", "Andile Andy", "Visca",
    ],
  },

  afrobeats: {
    tier_1_global_superstars: [
      "Burna Boy", "Wizkid", "Davido", "Rema", "Tems",
      "Asake", "Ayra Starr", "Omah Lay", "Fireboy DML", "Ckay",
      "Joeboy", "Oxlade", "Tiwa Savage", "Yemi Alade", "Kizz Daniel",
      "Adekunle Gold", "Simi", "Mr Eazi", "Tekno", "Phyno",
    ],
    tier_2_established_rising: [
      "Ruger", "Victony", "Buju", "BNXN", "Ladipoe",
      "Zinoleesky", "Seyi Vibez", "Young Jonn", "Naira Marley", "Bella Shmurda",
      "Mohbad", "Olamide", "Mayorkun", "Peruzzi", "Reekado Banks",
      "Lojay", "Blaqbonez", "Vector", "Ice Prince", "Falz",
      "Niniola", "Teni", "Seyi Shay", "DJ Tunez", "DJ Spinall",
      "DJ Neptune", "Shallipopi", "Spyro", "T.I Blaze", "Portable",
      "Khaid", "Magixx", "Boy Spyce", "Bayanni", "Lifesize Teddy",
      "Andre Vibez", "Crayon", "Ajebutter22", "BOJ", "DRB Lasgidi",
      "Odunsi (The Engine)", "Santi", "Show Dem Camp", "PsychoYP", "Cruel Santino",
    ],
    tier_3_alte_afro_fusion: [
      "Amaarae", "Tay Iwar", "Nonso Amadi", "Wavy The Creator",
      "Prettyboy D-O", "Fasina", "Genio Bambino", "Le Mav",
      "Teezee", "Zamir", "Lady Donli", "Alpha Ojini",
      "Teni Entertainer", "Ayüü", "Ayodeji", "Byno Ayoni",
      "Deto Black", "Dunnie", "GMK", "Josh2funny",
      "Ladé", "Lekan", "Moelogo", "Paybac",
      "Remy Baggins", "The Cavemen", "Wani",
    ],
    tier_4_ghanaian_west_african: [
      "Sarkodie", "Shatta Wale", "Stonebwey", "King Promise", "KiDi",
      "Kuami Eugene", "Mr Drew", "Black Sherif", "Gyakie", "Darkovibes",
      "$pacely", "Joey B", "R2Bees", "E.L.", "Kwesi Arthur",
      "Medikal", "La Même Gang", "Pappy Kojo", "Sister Deborah",
    ],
  },

  afrobeats_club_edits_producers: [
    "Nektunez", "P.Priime", "Juls", "Sarz", "Tempoe",
    "Andre Vibez", "London", "Magicsticks", "Rexxie", "Killertunes",
    "Pheelz", "Young John", "Kel P", "Telz", "Ozedikus",
    "Blaise Beatz", "Ramoni", "Eskeez", "Don Jazzy", "DJ Coublon",
    "Fresh VDM", "Masterkraft", "Ckay",
  ],

  global_sounds: {
    afro_tech: [
      "Black Coffee", "Âme", "Dixon", "Recondite", "Tale Of Us",
      "Mind Against", "Monolink", "Stephan Bodzin", "Maceo Plex", "Solomun",
      "Rampa", "&ME", "Adam Port", "Adriatique", "Artbat",
      "Fideles", "Bedouin", "Mathame", "Stimming", "Thyladomid",
    ],
    uk_afrobeats_afro_swing: [
      "J Hus", "Koffee", "NSG", "Hardy Caprio", "Octavian",
      "Not3s", "Yxng Bane", "Mist", "M Huncho", "Headie One",
      "AJ Tracey", "Dave", "Fredo", "Darkoo", "Tion Wayne",
      "Unknown T", "Skepta",
    ],
    jersey_club_afro: [
      "Uniiqu3", "DJ Sliink", "R3ll", "Cookiee Kawaii",
      "Mike Williams", "DJ Jayhood", "Nadus",
    ],
    global_bass_afro_latin_caribbean: [
      "Rosalía", "Bad Bunny", "J Balvin", "Karol G", "Nicky Jam",
      "Ozuna", "Anitta", "Major Lazer", "Diplo", "Busy Signal",
      "Popcaan", "Vybz Kartel", "Konshens", "Chronixx", "Protoje",
      "Beres Hammond", "Shenseea",
    ],
  },
} as const

// ─── Full Sound Progression Blueprint ───────────────────────────────────────

export const SET_BLUEPRINTS: Record<SlotType, SetBlueprint> = {
  foundation_setter: {
    dj: 'SAMINO',
    time: '10:00-11:00 PM',
    role: 'Foundation Setter',
    genre: 'Afro House',
    energy_arc: { start: 0.5, end: 0.65 },
    bpm_range: { min: 118, max: 122 },
    track_count: 25,
    segments: [
      {
        tracks: '1-8',
        duration_min: '0-20',
        energy: { min: 0.5, max: 0.55 },
        bpm: { min: 118, max: 120 },
        sound: 'Deep, grounded, percussive Afro House',
        artists: ['Black Coffee', 'Culoe De Song', 'Enoo Napa', 'Atjazz', 'Boddhi Satva', 'Osunlade'],
        example_tracks: ['Black Coffee - Drive', 'Culoe De Song - Webaba', 'Enoo Napa - Journey Into Time'],
      },
      {
        tracks: '9-18',
        duration_min: '20-45',
        energy: { min: 0.55, max: 0.62 },
        bpm: { min: 120, max: 122 },
        sound: 'Electric, percussive, tribal rhythms intensify',
        artists: ['Shimza', 'Kususa', 'Da Capo', 'Kafele Bandele', 'Caiiro', 'Djeff Afrozila', 'Manoo'],
        example_tracks: ['Shimza - Calling Out Your Name', 'Kususa - Sondela', 'Da Capo - Thando'],
      },
      {
        tracks: '19-25',
        duration_min: '45-60',
        energy: { min: 0.62, max: 0.68 },
        bpm: { min: 122, max: 124 },
        sound: 'Transition zone: Afro House with subtle log drum hints',
        artists: ['Themba', 'Zakes Bantwini', 'Sun-El Musician', 'Floyd Lavine', 'Hyenah'],
        example_tracks: ['Themba - Ashamed', 'Zakes Bantwini - Osama (Afro House version)', 'Sun-El Musician - Akanamali (deep mix)'],
        transition_to: 'MUDIA',
        handoff_notes: 'Introduce subtle Amapiano elements, prepare for energy build',
      },
    ],
    rules: [
      'No Amapiano (even if log drums present)',
      'No Afrobeats',
      'No commercial house or tech house',
      'Stay grounded, percussive, cultural',
      'Minimal but intentional',
      'Set the vibe, don\'t chase energy',
    ],
  },

  energy_builder: {
    dj: 'MUDIA',
    time: '11:00 PM-12:00 AM',
    role: 'Energy Builder',
    genre: 'Afro House',
    energy_arc: { start: 0.65, end: 0.75 },
    bpm_range: { min: 122, max: 126 },
    track_count: 25,
    segments: [
      {
        tracks: '1-8',
        duration_min: '0-25',
        energy: { min: 0.65, max: 0.70 },
        bpm: { min: 122, max: 124 },
        sound: 'Afro House with more drive, more energy',
        artists: ['Shimza', 'Jullian Gomes', 'Floyd Lavine', 'Hyenah', 'Cornelius SA', 'Nitefreak', 'Pablo Fierro'],
        example_tracks: ['Shimza - Tarantino', 'Jullian Gomes - Late Dreamer', 'Floyd Lavine - Kaya'],
      },
      {
        tracks: '9-18',
        duration_min: '25-45',
        energy: { min: 0.70, max: 0.75 },
        bpm: { min: 124, max: 126 },
        sound: 'Electric Afro House, percussive intensity increasing',
        artists: ['Black Coffee', 'Themba', 'Ryan Murgatroyd', 'Caiiro', 'Ralf GUM', 'Fka Mash', 'Ed-Ward'],
        example_tracks: ['Black Coffee - We Dance Again', 'Themba - Who Is Themba?', 'Caiiro - Thanda'],
      },
      {
        tracks: '19-25',
        duration_min: '45-60',
        energy: { min: 0.75, max: 0.78 },
        bpm: { min: 118, max: 122 },
        sound: 'Transition zone: Afro House with CLEAR Amapiano elements',
        artists: ['Kelvin Momo', 'Mas Musiq', 'MFR Souls', 'De Mthuda', 'Musa Keys'],
        example_tracks: ['Kelvin Momo - Bayekele', 'MFR Souls - Isphithiphithi', 'Mas Musiq - Zaka'],
        transition_to: 'NIFFSTER',
        handoff_notes: 'Log drums clearly present, basslines start, BPM drops to 118-122 for Amapiano handoff',
      },
    ],
    rules: [
      'No Afrobeats',
      'Don\'t fully commit to Amapiano (Niffster owns that)',
      'Build energy from 0.65 → 0.75',
      'Last 10-15 min MUST tease Amapiano',
      'Smooth handoff (not jarring genre jump)',
    ],
  },

  peak_energy: {
    dj: 'NIFFSTER',
    time: '12:00-1:00 AM',
    role: 'The First Impression / Peak Ignition',
    genre: 'Amapiano',
    energy_arc: { start: 0.75, end: 0.85 },
    bpm_range: { min: 112, max: 118 },
    track_count: 25,
    segments: [
      {
        tracks: '1-8',
        duration_min: '0-18',
        energy: { min: 0.75, max: 0.78 },
        bpm: { min: 116, max: 118 },
        sound: 'Pure Amapiano — log drums, basslines, piano melodies, groovy',
        artists: ['Uncle Waffles', 'DBN Gogo', 'Major League DJz', 'Vigro Deep', 'Mr JazziQ', 'DJ Stokie'],
        example_tracks: ['Uncle Waffles - Tanzania', 'DBN Gogo - French Kiss', 'Major League DJz - Dinaledi'],
      },
      {
        tracks: '9-18',
        duration_min: '18-42',
        energy: { min: 0.78, max: 0.83 },
        bpm: { min: 114, max: 118 },
        sound: 'High-energy Amapiano, heavier basslines, driving log drums',
        artists: ['Focalistic', 'Kamo Mphela', 'Kabza De Small', 'DJ Maphorisa', 'Lady Du', 'Busta 929', 'Tyler ICU'],
        example_tracks: ['Focalistic - Ke Star', 'Kamo Mphela - Nkulunkulu', 'Kabza De Small - Sponono'],
      },
      {
        tracks: '19-25',
        duration_min: '42-60',
        energy: { min: 0.83, max: 0.85 },
        bpm: { min: 112, max: 116 },
        sound: 'Peak Amapiano energy, crowd favorites, anthems',
        artists: ["Ch'cco", 'Mellow & Sleazy', 'Young Stunna', 'MFR Souls', 'MDU aka TRP', 'Daliwonga'],
        example_tracks: ["Ch'cco - Nkao Tempela", 'Mellow & Sleazy - Bopha', 'MFR Souls - Amanikiniki'],
        transition_to: 'DESTINEE',
        handoff_notes: 'Stay in PURE Amapiano, hand off at HIGH energy (0.83-0.85)',
      },
    ],
    rules: [
      'No Afro House regression',
      'No Afrobeats (Destinee handles expansion)',
      'Pure Amapiano only (log drums, basslines, piano)',
      'Build energy from 0.75 → 0.85',
      'Make early crowd feel validated',
      'Hand off at HIGH energy',
    ],
  },

  late_peak_curator: {
    dj: 'DESTINEE',
    time: '1:00-2:00 AM',
    role: 'Late Peak Curator',
    genre: 'Amapiano → Afrobeats Expansion',
    energy_arc: { start: 0.85, end: 0.80 },
    bpm_range: { min: 110, max: 120 },
    track_count: 30,
    segments: [
      {
        tracks: '1-7',
        duration_min: '0-20',
        energy: { min: 0.85, max: 0.83 },
        bpm: { min: 114, max: 118 },
        sound: 'Melodic Amapiano (softer than Niffster, more musical depth)',
        artists: ['Kelvin Momo', 'Aymos', 'Mas Musiq', 'Sam Deep', 'Boohle', 'Azana', 'Sino Msolo'],
        example_tracks: ['Kelvin Momo - Inyembezi', 'Aymos - Lydia', 'Mas Musiq - Sengizwile', 'Sam Deep - Khuza Gogo'],
      },
      {
        tracks: '8-15',
        duration_min: '20-42',
        energy: { min: 0.83, max: 0.82 },
        bpm: { min: 112, max: 118 },
        sound: 'Amapiano/Afrobeats hybrids (log drums + Nigerian/Ghanaian vocals)',
        artists: ['DJ Maphorisa', 'Wizkid', 'Focalistic', 'Davido', 'Cassper Nyovest', 'Major League DJz', 'DJ Tunez'],
        example_tracks: ['DJ Maphorisa, Wizkid - Money Constant', 'Focalistic, Davido - Ke Star remix', 'Cassper Nyovest - Siyathandana'],
      },
      {
        tracks: '16-22',
        duration_min: '42-52',
        energy: { min: 0.82, max: 0.80 },
        bpm: { min: 110, max: 118 },
        sound: 'Afrobeats club edits + Alté (less log drums, more Afrobeats rhythm)',
        artists: ['Rema', 'Asake', 'Ayra Starr', 'Cruel Santino', 'Odunsi (The Engine)', 'Santi', 'Amaarae'],
        example_tracks: ['Rema - Calm Down (Amapiano remix)', 'Asake - Terminator', 'Cruel Santino - Gangster Fear', 'Odunsi - Tipsy'],
      },
      {
        tracks: '23-30',
        duration_min: '52-60',
        energy: { min: 0.80, max: 0.78 },
        bpm: { min: 108, max: 115 },
        sound: 'Afro-fusion handoff (NO more log drums, pure Afrobeats/Afro-fusion)',
        artists: ['Burna Boy', 'Tems', 'Omah Lay', 'Wizkid', 'Ayra Starr', 'Fireboy DML', 'Oxlade'],
        example_tracks: ['Burna Boy - Last Last', 'Tems - Free Mind', 'Omah Lay - Soso', 'Wizkid - Essence (club edit)'],
        transition_to: 'MIKEWEST',
        handoff_notes: 'CRITICAL: Amapiano GONE, pure Afrobeats/Afro-fusion, melodic, sets up deep dive',
      },
    ],
    rules: [
      'NO staying in pure Amapiano (must expand)',
      'NO jarring genre jumps (gradual evolution)',
      'NO random pop music',
      'Start melodic Amapiano (0-20 min)',
      'Introduce Amapiano/Afrobeats hybrids (20-42 min)',
      'Expand into Afrobeats club edits + Alté (42-52 min)',
      'Close with Afro-fusion handoff (52-60 min)',
      'Maintain peak energy (0.80-0.85)',
      'Add personality and depth (not just bangers)',
    ],
  },

  deep_dive: {
    dj: 'MIKEWEST',
    time: '2:00-3:00 AM',
    role: 'Deep Dive / Curator',
    genre: 'Afrobeats',
    energy_arc: { start: 0.78, end: 0.70 },
    bpm_range: { min: 100, max: 118 },
    track_count: 28,
    segments: [
      {
        tracks: '1-7',
        duration_min: '0-20',
        energy: { min: 0.78, max: 0.76 },
        bpm: { min: 110, max: 118 },
        sound: 'Pure Afrobeats (NOT the hits everyone knows)',
        artists: ['Omah Lay', 'Ayra Starr', 'Asake', 'Victony', 'Fireboy DML', 'Lojay', 'Khaid'],
        example_tracks: ['Omah Lay - Understand', 'Ayra Starr - Beggie Beggie', 'Asake - Peace Be Unto You', 'Victony - Kolomental'],
      },
      {
        tracks: '8-17',
        duration_min: '20-45',
        energy: { min: 0.76, max: 0.73 },
        bpm: { min: 105, max: 115 },
        sound: 'Current Afrobeats, emerging artists, deep album cuts',
        artists: ['Seyi Vibez', 'Ruger', 'BNXN', 'Zinoleesky', 'Young Jonn', 'Shallipopi', 'Spyro', 'Boy Spyce', 'Magixx'],
        example_tracks: ['Seyi Vibez - Catalyst', 'Ruger - Kristy', 'BNXN - Outside', 'Zinoleesky - Caro', 'Young Jonn - Xtra Cool'],
      },
      {
        tracks: '18-23',
        duration_min: '45-55',
        energy: { min: 0.73, max: 0.70 },
        bpm: { min: 100, max: 112 },
        sound: 'Afro-fusion / Alté depth',
        artists: ['Tems', 'Cruel Santino', 'Tay Iwar', 'Nonso Amadi', 'The Cavemen', 'Amaarae', 'Lady Donli'],
        example_tracks: ['Tems - Damages', 'Cruel Santino - Sparky', 'Tay Iwar - Sideline', 'Nonso Amadi - Tonight', 'The Cavemen - Osondu'],
      },
      {
        tracks: '24-28',
        duration_min: '55-60',
        energy: { min: 0.70, max: 0.68 },
        bpm: { min: 105, max: 115 },
        sound: 'Melodic Afrobeats, prep for Afro-tech handoff',
        artists: ['Burna Boy', 'Wizkid', 'Adekunle Gold', 'Simi', 'Mr Eazi'],
        example_tracks: ['Burna Boy - It\'s Plenty', 'Wizkid - Longtime', 'Adekunle Gold - Before You Wake Up'],
        transition_to: 'TOBEGO',
        handoff_notes: 'Melodic, reflective, sets up Tobego\'s Afro-tech/global sounds close',
      },
    ],
    rules: [
      'No going back to Amapiano',
      'No playing the hits (already played by Destinee)',
      'No commercial Afrobeats (overplayed tracks)',
      'Deep cuts, B-sides, album tracks only',
      'Current sound (2024-2026 releases)',
      'Discovery-focused (emerging artists)',
      'Trust curation (people came for this)',
      'Slow energy from 0.78 → 0.70',
    ],
  },

  global_closer: {
    dj: 'TOBEGO',
    time: '3:00-4:00 AM',
    role: 'Global Closer',
    genre: 'Afro-Tech & Global Sounds',
    energy_arc: { start: 0.68, end: 0.55 },
    bpm_range: { min: 118, max: 126 },
    track_count: 25,
    segments: [
      {
        tracks: '1-7',
        duration_min: '0-20',
        energy: { min: 0.68, max: 0.65 },
        bpm: { min: 122, max: 126 },
        sound: 'Afro-tech (Afro House + techno elements, melodic, deep)',
        artists: ['Black Coffee', 'Themba', 'Âme', 'Dixon', 'Rampa', '&ME', 'Adam Port'],
        example_tracks: ['Black Coffee - Your Eyes (tech mix)', 'Themba - Ashamed (extended)', 'Âme - Rej', 'Dixon - Where Were You'],
      },
      {
        tracks: '8-15',
        duration_min: '20-45',
        energy: { min: 0.65, max: 0.60 },
        bpm: { min: 120, max: 124 },
        sound: 'Afro House return (full circle bookend)',
        artists: ['Shimza', 'Culoe De Song', 'Enoo Napa', 'Zakes Bantwini', 'Ralf GUM', 'Jazzuelle', 'Stones & Bones'],
        example_tracks: ['Shimza - Shimza\'s Remix', 'Culoe De Song - Exodus', 'Enoo Napa - Spiritual Hunger', 'Zakes Bantwini - Osama (deep mix)'],
      },
      {
        tracks: '8-10',
        duration_min: '45-55',
        energy: { min: 0.60, max: 0.57 },
        bpm: { min: 118, max: 122 },
        sound: 'Global sounds (UK Afrobeats, global bass, open format)',
        artists: ['J Hus', 'Koffee', 'Burna Boy', 'Solomun'],
        example_tracks: ['J Hus - Spirit', 'Koffee - Toast', 'Burna Boy - B. d\'Or', 'Solomun - Something We All Adore'],
      },
      {
        tracks: '11-12',
        duration_min: '55-60',
        energy: { min: 0.57, max: 0.55 },
        bpm: { min: 118, max: 120 },
        sound: 'The landing (Afro House, Afro-tech, melodic, reflective)',
        artists: ['Black Coffee', 'Themba', 'Osunlade'],
        example_tracks: ['Black Coffee - We Dance Again (outro)', 'Themba - Who Is Themba? (extended)', 'Osunlade - Envision (Yoruba Soul Mix)'],
        transition_to: 'END',
        handoff_notes: 'Let people leave feeling full, not exhausted. Satisfying close.',
      },
    ],
    rules: [
      'No regression to Amapiano or Afrobeats',
      'No abrupt ending (no crashing the energy)',
      'No commercial EDM or tech house',
      'Afro-tech + Afro House + global sounds',
      'Bookend the night (started Afro House, close Afro House)',
      'Wind down energy gradually (0.68 → 0.55)',
      'Satisfying, not jarring',
      'Let people leave feeling whole',
    ],
  },
}

// Legacy export for backward compat
export const DJ_SET_CRITERIA = Object.fromEntries(
  Object.entries(SET_BLUEPRINTS).map(([slot, bp]) => [
    slot,
    {
      time: bp.time,
      genre: bp.genre,
      energy: { min: bp.energy_arc.start, max: bp.energy_arc.end },
      tempo: bp.bpm_range,
      characteristics: bp.segments.map(s => s.sound).join(' → '),
    },
  ])
) as Record<SlotType, { time: string; genre: string; energy: { min: number; max: number }; tempo: { min: number; max: number }; characteristics: string }>
