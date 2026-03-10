/**
 * Music DNA Artist Database v1.0
 * Maintained by Apollo Wrldx
 * Last updated: 2026-03-10
 * 300+ artists for SNITC event playlist generation
 */

export type SlotType =
  | 'foundation_setter'
  | 'energy_builder'
  | 'peak_energy'
  | 'late_peak_curator'
  | 'deep_dive'
  | 'global_closer'

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

export const DJ_SET_CRITERIA = {
  foundation_setter: {
    time: '10:00-11:00 PM',
    genre: 'Afro House',
    energy: { min: 0.5, max: 0.7 },
    tempo: { min: 118, max: 124 },
    characteristics: 'Grounded, percussive, minimal or deep soulful vocals',
  },
  energy_builder: {
    time: '11:00 PM-12:00 AM',
    genre: 'Afro House',
    energy: { min: 0.65, max: 0.8 },
    tempo: { min: 122, max: 126 },
    characteristics: 'Building momentum, transition-friendly, subtle Amapiano elements',
  },
  peak_energy: {
    time: '12:00-1:00 AM',
    genre: 'Amapiano',
    energy: { min: 0.75, max: 0.9 },
    tempo: { min: 112, max: 118 },
    characteristics: 'Log drums, basslines, piano, peak danceability',
  },
  late_peak_curator: {
    time: '1:00-2:00 AM',
    genre: 'Amapiano → Afrobeats Expansion',
    energy: { min: 0.7, max: 0.85 },
    tempo: { min: 110, max: 120 },
    characteristics: 'Melodic Amapiano, Afrobeats club edits, Alte, Afro-fusion',
  },
  deep_dive: {
    time: '2:00-3:00 AM',
    genre: 'Afrobeats',
    energy: { min: 0.6, max: 0.75 },
    tempo: { min: 100, max: 118 },
    characteristics: 'B-sides, deep cuts, current sound, discovery-focused',
  },
  global_closer: {
    time: '3:00-4:00 AM',
    genre: 'Afro-Tech & Global Sounds',
    energy: { min: 0.5, max: 0.7 },
    tempo: { min: 118, max: 126 },
    characteristics: 'Afro-tech, Afro House, global sounds, satisfying wind-down',
  },
} as const
