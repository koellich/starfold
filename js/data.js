// STARFOLD data.js: elements, upgrades, artifacts, races, dialogue, story text
'use strict';

// ---- minerals ---------------------------------------------------------------
SF.ELEMENTS = [
  { id: 'iron',     name: 'IRON',     val: 2,  color: SF.P.brown },
  { id: 'nickel',   name: 'NICKEL',   val: 3,  color: SF.P.lgray },
  { id: 'lead',     name: 'LEAD',     val: 3,  color: SF.P.dgray },
  { id: 'copper',   name: 'COPPER',   val: 4,  color: SF.P.red },
  { id: 'cobalt',   name: 'COBALT',   val: 6,  color: SF.P.lblue },
  { id: 'titanium', name: 'TITANIUM', val: 8,  color: SF.P.white },
  { id: 'silver',   name: 'SILVER',   val: 10, color: SF.P.lgray },
  { id: 'thorium',  name: 'THORIUM',  val: 12, color: SF.P.lgreen },
  { id: 'gold',     name: 'GOLD',     val: 18, color: SF.P.yellow },
  { id: 'platinum', name: 'PLATINUM', val: 25, color: SF.P.lcyan },
  { id: 'iridium',  name: 'IRIDIUM',  val: 30, color: SF.P.lmagenta },
  { id: 'auralite', name: 'AURALITE', val: 45, color: SF.P.lred }
];
SF.EL = {}; SF.ELEMENTS.forEach(e => SF.EL[e.id] = e);

// ---- ship upgrades ----------------------------------------------------------
SF.UPGRADES = {
  engine:  { name: 'ENGINE',  max: 5, price: [0, 1200, 3000, 6400, 12000], desc: 'ZPE drive output. Faster travel, better escapes.' },
  shield:  { name: 'SHIELD',  max: 5, price: [1000, 2400, 5200, 10000, 18000], desc: 'Deflector screens. Absorbs weapon hits.' },
  armor:   { name: 'ARMOR',   max: 5, price: [0, 600, 1600, 3600, 7000], desc: 'Hull plating. Passive damage soak.' },
  laser:   { name: 'LASER',   max: 4, price: [1400, 3200, 6800, 14000],  desc: 'Beam weapon. The Vanguard shipped with a single light survey mount.' },
  missile: { name: 'MISSILE', max: 3, price: [1800, 4400, 9600],         desc: 'Torpedo launcher. Heavy, slower to cycle.' },
  pods:    { name: 'CARGO POD', max: 4, price: [800, 800, 800, 800],     desc: '+100 M3 cargo capacity each.' },
  scanner: { name: 'SCANNER', max: 3, price: [0, 1600, 4000],            desc: 'Detection range for stars and anomalies. Class 2 resolves surface structures from orbit.' }
};
SF.SHIELD_PTS = [0, 40, 70, 110, 160, 220];
SF.ARMOR_PTS  = [40, 60, 100, 150, 210, 280];
SF.LASER_DMG  = [0, 9, 16, 26, 40];
SF.MISSILE_DMG= [0, 22, 38, 58];
SF.SCAN_RANGE = [0, 14, 26, 42];
SF.ENGINE_SPD = [0, 4.5, 6, 7.5, 9.5, 12];
// the Kvoth passage toll, in M3 of thorium. The start planet's thorium budget
// (galaxy.js) is SF.TOLL + 34 so the margin stays pocket money: retune the
// toll here and the budget follows.
SF.TOLL = 100;

// ---- artifacts --------------------------------------------------------------
SF.ARTIFACTS = {
  ring:       { name: 'TRANSPONDER RING', abbr: 'RING', sell: 300, desc: 'A dull torus of woven metal. Broadcasts a Kvoth lattice-authorization pulse. While carried, Kvoth vessels acknowledge your right of passage.' },
  pyramid:    { name: 'PYRAMID DEVICE', abbr: 'PYRAMID', sell: 1500, desc: 'A palm-sized pyramid of seamless black stone, older than any known culture. When powered it renders gravitic fluxes visible to the sensor grid.' },
  phasematrix:{ name: 'HUMMING WEAVER', abbr: 'WEAVER', sell: 1500, desc: 'A weave of filaments in perfect balance, humming one low note without end. No function can be discerned; most likely decorative. The Ashkaru speak of an inner fire that rivals the stars. That\'s Ashkaru poetry for you.' },
  resonance:  { name: 'CRYSTAL LODESTAR', abbr: 'LODESTAR', sell: 1500, desc: 'A crystalline tuning device recovered from an ancient drone. It emits a patient, repeating pulse: a hailing signal, aimed at someone who listens. Held long enough, one begins to feel it leaning.' },
  sunstone:   { name: 'ASHKARU SUNSTONE', abbr: 'SUNSTONE', sell: 4000, desc: 'A fist-sized gem burning with inner light. The holiest relic of the Ashkaru, plundered from the Pyre Throne by corsairs. A fence will pay a fortune for it - but the Ashkaru would give something worth more than any fortune to see it carried home.' },
  chartcore:  { name: 'KVOTH CHART CORE', abbr: 'CHART CORE', sell: 250, desc: 'A data lattice. Installing it charts the reach\'s political geography: the catalogued stars of the Kvoth Sphere, the charted spheres of influence, and their named systems (Gilded Reach, Ashkar). The Corsair Pocket appears on no chart.' },
  shard:      { name: 'ANCIENT SHARD', sell: 2500, desc: 'A fragment of engraved crystal from a dead civilization. Collectors pay very, very well.' },
  voidpearl:  { name: 'VOID PEARL', sell: 550, desc: 'A perfect sphere found in deep ice. It is faintly warm and no instrument can say why.' },
  stasiscube: { name: 'STASIS CUBE', sell: 700, desc: 'A cube that is always exactly the temperature it was yesterday. Vel-ma-rah traders adore it.' },
  biodata:    { name: 'XENOBIOLOGY DATA', abbr: 'BIODATA', sell: 0, desc: 'Recorded life-form scans, one catalogue entry per specimen. Buyers pay per entry; science pays for patience.' },
  descrambler:{ name: 'YELLOW DESCRAMBLER', abbr: 'YELLOW CURIO', sell: 0, desc: 'A palm-width wafer of layered yellow ceramic that hums, faintly, near a live comm channel. Dr. Johnson\'s best guess, and their name for it: a DESCRAMBLER, built to sit between a signal and a listener. Which signal, whose listener, they cannot say.' },
  voidamber:  { name: 'VOID-AMBERGRIS', abbr: 'AMBERGRIS', sell: 3340, desc: 'A waxen mass from a void-whale\'s song-gland, fragrant of ozone and myrrh. Perfumers and curators pay absurdly. Nobody asks how it is harvested.' },
  astrolabe:  { name: 'PILGRIM\'S ASTROLABE', abbr: 'ASTROLABE', sell: 110, desc: 'A hand-worn brass instrument from no culture on record. Eleven rings, one needle. The needle refuses to point north, or anywhere else twice.' },
  silentbell: { name: 'SILENT BELL', sell: 90, desc: 'It swings, it strikes, it rings nothing at all. Whoever made it wanted a bell that keeps a secret.' },
  weepstone:  { name: 'WEEPING STONE', sell: 70, desc: 'A fist-sized pebble that is always damp, even in vacuum storage. The Vel-ma-rah swear it grieves.' }
};

// ---- lifeform scan descriptions: per-biome pool + generic pool ----------------
SF.LIFE_DESC = {
  generic: [
    'a low browsing polyp-herd',
    'a stilt-legged filter walker',
    'something fast that watches back',
    'an armored grazer that ignores the TV completely',
    'a colony organism pretending, badly, to be a rock',
    'a tumbling scavenger ball of hooks and patience',
    'a translucent stalker the sensors keep losing',
    'a burrowing thing known only by its exhale vents'
  ],
  garden: [
    'a canopy of leaves that all turn to follow the TV',
    'a songbird-analogue with three voices and no fear',
    'a moss that closes around footprints and keeps them'
  ],
  ocean: [
    'an amphibious shoal that beaches itself to sun',
    'a tide-pool colony blinking in slow patterns'
  ],
  ice: [
    'a heat-seeking lichen crawling toward the TV\'s exhaust',
    'a herd of slow crystalline shell-backs, frost-furred'
  ],
  desert: [
    'a sand-swimming ribbon that surfaces like a dolphin',
    'a dew-farming web strung between two dunes'
  ],
  molten: [
    'a silicate tube-worm basking at a lava vent',
    'a heat-shimmer that is, on second scan, an animal'
  ],
  rock: [
    'a mineral-boring snail the size of a TV wheel',
    'a pressure-flattened creeper hugging the leeward stone'
  ]
};
SF.lifePool = type => (SF.LIFE_DESC[type] || []).concat(SF.LIFE_DESC.generic);

// xenobiology data is priced per catalogued specimen; bazaar curios resell at
// half their (inflated) buy price; every other relic is a flat sell value
SF.artifactPrice = function (id) {
  if (id === 'biodata') return (SF.G.bioCount || 0) * 150;
  if (SF.CURIO_PRICE && SF.CURIO_PRICE[id]) return Math.floor(SF.CURIO_PRICE[id] / 2);
  return SF.ARTIFACTS[id].sell;   // sell 0 means "not for sale"
};

// an artifact is "installed" once it's wired into the ship and no longer loose
// cargo you could trade. Pyramid, descrambler and chart core leave the hold on
// analysis; the Weaver leaves it when woven into the deflector grid; the
// Lodestar stays aboard but counts as installed once fully analyzed (keyed).
SF.installedArtifact = id =>
  (id === 'resonance' && !!SF.G.flags.resonanceRead) ||
  (id === 'phasematrix' && !!SF.G.flags.phasematrix);

// the three plot relics a fence will re-sell you (at double) if you offloaded
// them — a safety net so selling the Lodestar/Weaver/Sunstone is never a
// permanent mistake. `flags.sold_<id>` is set on sale, cleared on buy-back.
SF.BUYBACK_RELICS = ['resonance', 'phasematrix', 'sunstone', 'pyramid'];

// ---- races ------------------------------------------------------------------
SF.RACES = {
  kvoth: {
    name: 'KVOTH', color: SF.P.lcyan,
    posturePref: 'friendly', // plain and open; they scorn both threats and groveling
  },
  velmarah: {
    name: 'VEL-MA-RAH', color: SF.P.yellow,
    posturePref: 'friendly',
  },
  ashkaru: {
    name: 'ASHKARU', color: SF.P.lred,
    posturePref: 'hostile', // they respect fire and boldness
  },
  corsair: {
    name: 'CORSAIRS', color: SF.P.lmagenta,
    posturePref: 'hostile',
  },
  rhanfayr: {
    name: 'RHAN FAYR', color: SF.P.white,
    posturePref: 'friendly',
  }
};

// ---- enemy ship stats --------------------------------------------------------
SF.SHIPS = {
  kvothPatrol: { race: 'kvoth', label: 'KVOTH PATROL LATTICE', shield: 70, armor: 100, dmg: 24, engine: 3 },
  ashkRaider:  { race: 'ashkaru', label: 'ASHKARU WARBRAND', shield: 34, armor: 80, dmg: 19, engine: 3 },
  corsair:     { race: 'corsair', label: 'CORSAIR CUTTER', shield: 22, armor: 55, dmg: 15, engine: 2 },
  velmarahTrader:{ race: 'velmarah', label: 'VEL-MA-RAH CARAVEL', shield: 12, armor: 28, dmg: 0, engine: 2 },   // gasbags in auralite-spun envelopes: fragile, priceless, defenseless
  watcher:     { race: 'rhanfayr', label: 'UNKNOWN VESSEL', shield: 9999, armor: 9999, dmg: 0, engine: 5 },
  whale:       { race: null, label: 'IMMENSE LIFEFORM', shield: 0, armor: 400, dmg: 55, engine: 1 }
};

// ---- first contact: negotiating with the toll patrol --------------------------
// A lone Kvoth patrol picket opens with ARCHIVAL (record to the ledger, then
// destroy). Every path can be talked around to the toll (they are ruthless
// bookkeepers, not killers for sport), but wrong turns cost paint, pride, or
// standing. Unlike a capital ship, a patrol can be fought (barely) or fled
// (eventually), and the crew says so on the opening node.
// Option labels must stay ≤ ~27 chars to fit the right-hand menu panel.
SF.FIRST_CONTACT = {
  start: {
    k: ['UNREGISTERED CARBON VESSEL. YOU OCCUPY LATTICE SPACE WITHOUT AUTHORIZATION. YOUR ARMAMENT: ONE SURVEY LASER. YOUR TRANSPONDER: NONE. YOUR ENTRY DOES NOT BALANCE.',
        'PROTOCOL SELECTED: ARCHIVAL. HOLD YOUR POSITION. THIS WILL BE ORDERLY.'],
    crew: ['DR. JOHNSON, off-channel: "Patrol class, Captain. One battery, light screens. If it came to shooting... we could perhaps take them. Perhaps."',
           'ENS. LEE, off-channel: "Or we run for open space. Their drive idles hotter than ours, but a picket is paid to hold station, not to chase. No promises, Captain."'],
    opts: [
      { t: 'DEFINE "ARCHIVAL".', next: 'define' },
      { t: 'WE ARE LOST. AN ACCIDENT.', next: 'accident' },
      { t: 'STAND DOWN, OR WE FIRE.', next: 'bluff' },
      { t: 'BEG FOR MERCY.', next: 'plead' }
    ]
  },
  define: {
    k: ['DEFINITION: YOUR HULL, CARGO, CREW, AND TRAJECTORY ARE RECORDED TO THE LEDGER IN FULL. THE RECORD IS PERMANENT. THE VESSEL IS THEN REMOVED.',
        'AN UNAUTHORIZED MASS IS AN ORPHAN ENTRY. THE LEDGER ABHORS AN ORPHAN ENTRY. THIS IS NOT MALICE. IT IS BOOKKEEPING.'],
    opts: [
      { t: 'WHO ARE YOU?', next: 'identify' },
      { t: 'ERASED ENTRIES PAY NOTHING.', next: 'toll' },
      { t: 'WE ARE LOST. AN ACCIDENT.', next: 'accident' }
    ]
  },
  accident: {
    k: ['INTENT IS NOTED AND IRRELEVANT. THE LEDGER RECORDS MASS AND POSITION, NOT WISHES.',
        'HOWEVER. NO PRIOR ENTRY EXISTS FOR YOUR SPECIES. AN UNRECORDED CIVILIZATION IS AN ACCOUNTING IRREGULARITY. IRREGULARITIES RECEIVE... REVIEW.'],
    opts: [
      { t: 'ERASED ENTRIES PAY NOTHING.', next: 'toll' },
      { t: 'WHO ARE YOU?', next: 'identify' },
      { t: 'RELEASE US. WE DEMAND IT.', next: 'demand' }
    ]
  },
  bluff: {
    k: ['ASSERTION EVALUATED AGAINST SENSOR RECORD. YOUR ARMAMENT: ONE LASER, RATED FOR MINERAL ASSAY. YOUR SHIELDS: ABSENT. YOUR THREAT INDEX IS LOW. NOT ZERO. THE DIFFERENCE IS NOTED, AND INSURED AGAINST.',
        'A DEMONSTRATION FOLLOWS.'],
    act: 'warnshot',
    opts: [
      { t: 'POINT MADE. LET US TALK.', next: 'define' },
      { t: 'WE ARE LOST. AN ACCIDENT.', next: 'accident' },
      { t: 'DO YOUR WORST.', next: 'defiant' }
    ]
  },
  defiant: {
    k: ['COURAGE IS NOT A LEDGER ENTRY. NEITHER IS STUPIDITY, THOUGH THE TWO ARE FREQUENTLY CO-LOCATED.',
        'FINAL ADVISORY: PROPOSE VALUE, OR THE PROTOCOL RESUMES.'],
    opts: [
      { t: 'WE CAN PAY. NAME A PRICE.', next: 'toll' },
      { t: 'HOW CAN OUR ENTRY BALANCE?', next: 'toll' }
    ]
  },
  plead: {
    k: ['YOUR TRANSMISSION CONTAINS ELEVEN EMOTIVE MARKERS AND ZERO ACTIONABLE DATA. IT HAS BEEN FILED UNDER: NOISE.',
        'MERCY IS NOT A LEDGER ENTRY. VALUE IS. HAVE YOU ANY?'],
    opts: [
      { t: 'WE CAN PAY. NAME A PRICE.', next: 'toll' },
      { t: 'ERASED ENTRIES PAY NOTHING.', next: 'toll' },
      { t: 'WHO ARE YOU?', next: 'identify' }
    ]
  },
  identify: {
    k: ['WE ARE KVOTH. SILICON SUBSTRATE, LATTICE-BONDED COGNITION. THIS VOLUME IS THE KVOTH SPHERE. THE LATTICE IS NOT A GOVERNMENT. IT IS A LEDGER.',
        'YOU ARE A NEW LINE IN THAT LEDGER, CARBON VESSEL. NEW LINES ARE WRITTEN, OR THEY ARE STRUCK.'],
    act: 'reveal',
    opts: [
      { t: 'THEN WRITE US. WE CAN PAY.', next: 'toll' },
      { t: 'YOUR LEDGER IS A GRAVEYARD.', next: 'insult' },
      { t: 'HOW CAN OUR ENTRY BALANCE?', next: 'toll' }
    ]
  },
  insult: {
    k: ['YOUR STATEMENT HAS BEEN RECORDED VERBATIM. THE LEDGER DOES NOT BLUSH.',
        'YOUR CONDUCT INDEX NOW OPENS AT A DEFICIT. THIS IS RARELY WISE. PROPOSE VALUE, OR THE PROTOCOL RESUMES.'],
    act: 'scorn',
    opts: [
      { t: 'WITHDRAWN. WE CAN PAY.', next: 'toll' },
      { t: 'ERASED ENTRIES PAY NOTHING.', next: 'toll' }
    ]
  },
  demand: {
    k: ['DEMANDS REQUIRE LEVERAGE. INVENTORY OF YOUR LEVERAGE: NONE. THE AUDACITY HAS BEEN LOGGED. IT CARRIES NO EXCHANGE VALUE.',
        'PROPOSE VALUE, OR THE PROTOCOL RESUMES.'],
    opts: [
      { t: 'WE CAN PAY. NAME A PRICE.', next: 'toll' },
      { t: 'WHO ARE YOU?', next: 'identify' }
    ]
  },
  toll: {
    k: ['COMPUTING. .... .. COMPLETE.',
        'CONCLUSION: AN OPEN ENTRY WITH POSITIVE FLOW EXCEEDS THE VALUE OF A CLOSED ONE. YOUR ARCHIVAL IS SUSPENDED. IN ITS PLACE, A TOLL IS ASSESSED.',
        'DELIVER ' + SF.TOLL + ' CUBIC METERS OF THORIUM TO THIS VESSEL. UPON RECEIPT: PASSAGE IS GRANTED.'],
    opts: [
      { t: 'AGREED. WE WILL DELIVER.', next: 'agree' },
      { t: 'WE DON\'T HAVE ANY THORIUM.', next: 'mine', req: G => (G.cargo.thorium || 0) < SF.TOLL },
      { t: 'AND IF WE REFUSE?', next: 'refuse' }
    ]
  },
  agree: {
    k: ['AGREEMENT LOGGED. THIS VESSEL HOLDS STATION IN THIS SYSTEM PENDING DELIVERY. THE LATTICE IS PATIENT. WITHIN REASON.',
        'THIS CONCLUDES THE ORIENTATION. THE LATTICE FINDS THIS OUTCOME EFFICIENT.'],
    act: 'toll'
  },
  mine: {
    k: ['CARGO SCAN CONCURS: THE SUM IS NOT ABOARD. THE DEFICIT IS NOTED. IT IS NOT AN OBSTACLE. MINING IS AN ACCEPTED ROUTE OF ACQUISITION.',
        'SENSOR RECORD: THE SECOND PLANET OF THIS SYSTEM HOLDS WORKABLE THORIUM DEPOSITS. THIS VESSEL WILL WAIT. THE LATTICE IS PATIENT. WITHIN REASON.',
        'THIS CONCLUDES THE ORIENTATION. THE LATTICE FINDS THIS OUTCOME EFFICIENT.'],
    act: 'toll'
  },
  refuse: {
    k: ['THEN THE PROTOCOL RESUMES AND YOUR ENTRY CLOSES. A CLOSED ENTRY PAYS EXACTLY ONCE. AN OPEN ENTRY PAYS INDEFINITELY. THE LATTICE PREFERS THE SECOND. RECONSIDER.'],
    opts: [
      { t: 'AGREED. WE WILL DELIVER.', next: 'agree' },
      { t: 'WE DON\'T HAVE ANY THORIUM.', next: 'mine', req: G => (G.cargo.thorium || 0) < SF.TOLL }
    ]
  }
};

// the Ashkaru tongue defeats the universal translator until the YELLOW
// DESCRAMBLER is installed (sold at Vel-ma-rah stations)
SF.UNTRANSLATABLE = {
  hail: [
    'The channel fills with fire: layered voices, chanted meter, fury and grief braided together. The translator returns only: [UNTRANSLATABLE WAR-HYMN].',
    'LT. GONSALVES: "It\'s language, Captain. A magnificent one. And the matrix can\'t hold a single syllable of it."',
    'A choir of hard consonants and burning vowels. Somewhere in it, a question, or a sentence being passed. The translator offers static.'
  ],
  signoff: 'The hymn rises once, sharp as a blade drawn across strings, and the channel dies.'
};

// how each culture ends a conversation when its patience runs out
SF.SIGNOFF = {
  kvoth: 'THIS CONCLUDES YOUR ALLOCATED PROCESSING WINDOW. FURTHER QUERIES REQUIRE A NEW ENTRY. THE CHANNEL CLOSES.',
  velmarah: 'Ohh, the solar wind shifts and the clan-mother calls, friend! Enough words for one meeting. Find us again; we SAVED some gossip for you!',
  ashkaru: 'Enough, gray-ship. Words are wind and the Flame needs fuel. We are done speaking. Go.',
  corsair: 'Right, that\'s all the free talk you get, tub. Channel\'s closed.',
  rhanfayr: 'REST NOW, LITTLE VESSEL. EVEN PATIENCE AS OLD AS OURS MUST BREATHE.'
};

// ---- race gambits: each culture's social key -----------------------------------
// Kvoth: data is currency (they interrogate back). Vel-ma-rah: stories are currency.
// Ashkaru: fire is currency (they test you). Corsairs: credits are currency.
// Rhan Fayr: deeds are currency (words are transparent to them).
// posture entries: reactions to the two non-preferred postures on first hail.
SF.GAMBITS = {};

SF.GAMBITS.kvoth = {
  posture: {
    hostile:     { line: 'HOSTILE POSTURE LOGGED. THREAT ASSESSMENT: YOUR ARMAMENT AGAINST A LATTICE HULL ROUNDS TO ZERO. INTIMIDATION WITHOUT COLLATERAL IS AN UNSECURED LOAN. IT IS DECLINED, AND A FEE IS APPLIED.', rel: -2 },
    obsequious:  { line: 'FLATTERY DETECTED AT A DENSITY OF NINE EMOTIVE MARKERS PER SENTENCE. FLATTERY IS DATA ABOUT THE SPEAKER, NOT THE SUBJECT, AND THE DATA IS UNFAVORABLE. A DEBASEMENT SURCHARGE IS APPLIED TO YOUR CONDUCT INDEX.', rel: -2 }
  },
  queries: [
    { q: 'QUERY: RECIPROCITY IS INVOKED. YOU HAVE DRAWN DATA; DATA IS NOW OWED. STATE THIS VESSEL\'S PURPOSE IN TEN WORDS OR FEWER. WORDS IN EXCESS OF TEN WILL BE BILLED.', opts: [
      { t: 'WE ARE HUMANITY\'S FINEST.', good: false, reply: 'SUPERLATIVES CANNOT BE AUDITED. AN UNAUDITABLE CLAIM IS ENTERED AT VALUE: ZERO, MINUS HANDLING. ALSO, THAT WAS NOT A PURPOSE. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' },
      { t: 'SURVEY. TRADE. RETURN HOME.', good: true,  reply: 'FOUR WORDS. SIX UNDER BUDGET. PRECISION RETURNS A SURPLUS, AND SURPLUS IS CREDITED. YOUR CONDUCT INDEX ADJUSTS UPWARD.' },
      { t: 'WE SEEK OUR DESTINY.', good: false, reply: 'THE TERM \'DESTINY\' HAS NO UNIT OF MEASURE. A PURPOSE THAT CANNOT BE MEASURED CANNOT BE BILLED, AND WHAT CANNOT BE BILLED DOES NOT EXIST. THE FIELD REMAINS BLANK. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' }
    ]},
    { q: 'QUERY: THE HUMAN FILE IS INCOMPLETE. STATE YOUR SPECIES\' MEAN OPERATIONAL LIFESPAN, FOR ACTUARIAL COMPLETENESS. ROUND FIGURES ARE ACCEPTED. EUPHEMISMS ARE NOT.', opts: [
      { t: 'WE DO NOT DISCUSS DEATH.', good: false, reply: 'YOUR PARTICIPATION IS NOT REQUIRED. MORTALITY ENTERS THE LEDGER WITH OR WITHOUT YOUR COOPERATION; WITHHELD DATA IS BOOKED AS A DEBIT AGAINST THE WITHHOLDER. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' },
      { t: 'LONG ENOUGH TO OUTLIVE YOU.', good: false, reply: 'ASSERTION AUDITED: WE DEPRECIATE. WE DO NOT EXPIRE. YOUR BOAST FAILS ON CONTACT WITH ARITHMETIC AND IS FILED UNDER: FICTION, UNPRICED. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' },
      { t: 'ABOUT 80 YEARS. THEN DEATH.', good: true,  reply: 'EIGHTY YEARS. RECORDED. A SHORT DEPRECIATION SCHEDULE, PLAINLY STATED. CANDOR ABOUT ONE\'S OWN WRITE-OFF DATE IS THE RAREST COMMODITY WE PURCHASE. THE LATTICE EXTENDS YOUR PROCESSING WINDOW.' }
    ]},
    { q: 'QUERY: YOUR HULL BEARS THE DESIGNATION \'VANGUARD\'. A SERIAL NUMBER INDEXES FASTER AND CANNOT BE MOURNED. WHY DO HUMANS NAME THEIR VESSELS?', opts: [
      { t: 'SO CREW WILL DIE FOR IT.', good: true,  reply: 'A NAME AS CREW-RETENTION INFRASTRUCTURE. FUNCTION STATED, SENTIMENT OMITTED, COST JUSTIFIED. THE ENTRY BALANCES. YOUR ANSWER IS APPENDED TO THE HUMAN FILE AT NO CHARGE TO YOU.' },
      { t: 'A SHIP HAS A SOUL.', good: false, reply: 'SCAN RESULT: TITANIUM, POLYMER, SIX CARBON UNITS. NO SOUL DETECTED AT ANY RESOLUTION. YOU HAVE DECLARED AN ASSET THAT CANNOT BE LOCATED. THERE IS A WORD FOR THAT: FRAUD. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' },
      { t: 'THE NAME STRIKES FEAR.', good: false, reply: 'AUDITED AGAINST OUR OWN RECORD: WE HAVE MET YOUR VESSEL. FEAR REGISTERED: ZERO. A CLAIM DISPROVED BY ITS OWN AUDIENCE IS WORTH LESS THAN SILENCE, WHICH AT LEAST COSTS NOTHING TO STORE. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' }
    ]},
    { q: 'QUERY: AUDIT FLAG. YOUR FILE READS: ARRIVAL BY ACCIDENT. YET YOU NAVIGATE, MINE, AND TRANSACT WITH EVIDENT INTENT. AN ACCIDENT WITH A HEADING IS AN IRREGULARITY. RECONCILE THE ENTRY.', opts: [
      { t: 'WE JUST WANT TO GO HOME.', good: false, reply: 'WANTING IS NOT DATA. THE LEDGER CARRIES NO COLUMN FOR LONGING; OUR ANCESTORS AUDITED IT OUT AND RECORDED A SAVINGS. THE IRREGULARITY REMAINS OPEN. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' },
      { t: 'DRIVE BURNED OUT. STRANDED.', good: true,  reply: 'RECONCILED. ARRIVAL: INVOLUNTARY. PERSISTENCE: MECHANICAL. THE ORPHAN ENTRY CLOSES CLEAN. A CLEAN AUDIT IS THE NEAREST THING TO PLEASURE THE INSTRUCTION SET PERMITS. YOUR PROCESSING WINDOW IS EXTENDED.' },
      { t: 'THAT IS CLASSIFIED.', good: false, reply: 'CLASSIFIED: A WORD MEANING THE DATA EXISTS AND YOU ARE WITHHOLDING IT. WITHHELD DATA ACCRUES INTEREST, PAYABLE IN SUSPICION. YOUR CONDUCT INDEX ADJUSTS DOWNWARD.' }
    ]}
  ]
};

SF.GAMBITS.velmarah = {
  posture: {
    hostile:     { line: 'Weapons hot? At US? Friend, we are a bag of gas and gossip: shoot and you lose BOTH, and the gossip was the valuable half!', rel: -2 },
    obsequious:  { line: 'Ohh, look at it GROVEL! Adorable. But flattery is free, friend, and free things fetch free prices. Stand up straight and bring us a story instead!', rel: 0 }
  },
  stories: [
    { id: 'fold', label: 'THE FOLD THAT BROKE',
      tell: 'You tell them of the fold that went wrong: four hundred years of flight in a heartbeat, and the wrong heartbeat. The stars smeared into lines, the lines bent, and the Vanguard arrived nowhere on any chart.',
      reply: 'Everyone! Come, come, the round-heads fell across the WHOLE SKY and lived to be annoyed about it! Oh, this is a four-cushion tale, friend. For a story like this the clan-mother can WAIT. The channel stays open a little longer.' },
    { id: 'arth', label: 'LIFE ON DISTANT ARTH',
      tell: 'You speak of home: Arth, one small warm world under one steady sun, and the six of you who volunteered to cross four hundred years of dark in a single heartbeat.',
      reply: 'One rock, one sun, one people? Friend, that is not a home, that is an EGG. We know, we hatched from one too. Ohh, the Bazaar will love this. Homesickness is the easiest cargo to move; every clan carries a little.' },
    { id: 'whale', label: 'THE VOID-WHALE\'S EYE', req: G => G.flags.whaleScanned,
      tell: 'You tell of the void-whale: kilometres of slow grace grazing on starlight, and the one ancient eye that looked the Vanguard over, decided you were neither food nor threat, and forgave you in advance.',
      reply: 'It LOOKED at you? Friend, my cousin Vess sold whale-song for nine seasons and never once got the eye, and the eye is the expensive part! We will trade this at the Bazaar for three lies and a spice contract. Excellent business, and nobody shot anybody. Our favorite kind.' },
    { id: 'haggle', label: 'HAGGLING THE LATTICE', req: G => G.flags.firstContact,
      tell: 'You recount your first hour in the reach: a gray Kvoth patrol, polite as an invoice, announcing your ARCHIVAL, and how you talked a death sentence down to a mining toll.',
      reply: 'You haggled with the LEDGER and the ledger blinked?! Friend, we once paid a fine for arriving early. EARLY! And you argued an archival down to an invoice... The clans will sing this badly and often. We will resell it tonight: full price, no discount, not even for family.' },
    { id: 'maw', label: 'THE MOUTH OF THE COLD', req: G => G.flags.mawSeen,
      tell: 'You tell them, quietly, of the Maw: a hole shaped like a star, so wrong the viewports kept trying to correct for it, and the cold that reached through the hull like a debt come due.',
      reply: 'Friend... the caravel has gone quiet, and we are NEVER quiet. You looked into the mouth of the Cold and came back warm. No. This one we do not resell. This one we keep, for the night the running starts, so the clans remember somebody saw it and LIVED.' },
    { id: 'veil', label: 'THE STAR THAT SPOKE', req: G => G.flags.veilContact,
      tell: 'You tell them of the Veil: an uncharted star that dimmed by one percent, politely, when you sang the right pulse back at it. The Watchers are not hiding NEAR the star. They are the star, and they have been watching everything, all along.',
      reply: 'The blinking star spoke BACK?... Friend, my grandmother saw a star blink out past the Gilded Reach, and we smiled, and gave her the good cushion, and waited for the years to finish talking. The years were not talking. Tonight every hearth in the caravan hears that her story ends TRUE. The Bazaar can wait. Some stories you tell to FAMILY first.' }
  ]
};

SF.GAMBITS.ashkaru = {
  posture: {
    friendly:    { line: 'A courteous tongue. Courtesy is water, gray-ship: it neither feeds a flame nor insults one. We allow it. Barely.', rel: 0 },
    obsequious:  { line: 'You speak from your knees. Stand, or be swept out with the rest of the ash. Ash bends. Ash pleads. Ash apologizes for existing. The Flame keeps no company with it.', rel: -2 }
  },
  standdown: 'The warbrand\'s guns go dark one by one, like candles pinched at a wake. She rolls her scarred hull once (a warrior\'s salute, grudged but given) and holds station off the bow, watching.',
  firstWords: 'It ANSWERS. Choir, silence. SILENCE! The gray-ship sings back in true words. Nine generations we cast our hymns into a reach of squeaking meat and counting engines, and nothing ever answered with a MIND behind it. You are the first, gray-ship. Whatever else you are, you are the FIRST.',
  challenges: [
    { c: 'Hold your course and answer, gray-ship. The Flame asks one question of every stranger, and it asks it once: what do you BURN for? Speak, and be weighed.', opts: [
      { t: 'WE BURN THORIUM. MOSTLY.', kind: 'plain', reply: 'A literal answer. No wings on it, but no fear in it either. Honest fuel is still fuel, gray-ship. The Flame shrugs, and lets you pass.' },
      { t: 'MY CREW, AND THE ROAD HOME.', kind: 'bold', reply: 'HA! Hear it, choir: a torch answers! Crew and the hearth-road: the two fuels that never gutter. You speak like our own honored dead, gray-ship, and we mean that as high praise. Burn on. The Flame makes way for flame.' },
      { t: 'NOTHING. WE WANT NO FIGHT.', kind: 'meek', reply: 'NOTHING. It burns for nothing, choir: a hull full of ash, begging to stay unlit. Learn this, gray-ship: flame is what fights, ash is what gave up. We do not treat with ash. Crawl home cold.' }
    ]},
    { c: 'A test of fire, gray-ship. Our war-psalm runs: the night is long, the fuel is short: what does the last torch owe the dark? Finish the verse. We have boarded ships over lesser rhymes.', opts: [
      { t: 'A SCAR IT WILL NOT FORGET.', kind: 'bold', reply: 'A SCAR! Better than the canon answer: our poets say DEFIANCE, and defiance is only a word, but a scar is a deed. The verse is yours now, gray-ship. It will be sung at the Pyre, and your gray hull with it.' },
      { t: 'SORRY. WE MEANT NO OFFENSE.', kind: 'meek', reply: 'We ask for a verse and you hand us an apology. So the last torch owes the dark an APOLOGY? Then let the dark collect it. You taste of wet ash, gray-ship. The Flame turns its face from you.' },
      { t: 'TO BURN AS LONG AS IT CAN.', kind: 'plain', reply: 'To burn as long as it can. Flat as a deck-plate, and true as one. Our widows would sand it smoother, but the Flame counts heat, not polish. It passes, gray-ship. Barely, and honestly.' }
    ]},
    { c: 'You trespass in mourning space, gray-ship. Our sun lies on its deathbed, and strangers track soot through the sickroom. Name one reason the Flame should suffer your shadow across its dying light.', opts: [
      { t: 'WE\'LL LEAVE. FORGIVE US.', kind: 'meek', reply: 'It flinches. It BEGS. Hear us, gray-ship: we do not weep at strangers, we MEASURE them, and you measured ash. Forgiveness is for kin, and kin do not grovel. Take your shadow out of our light.' },
      { t: 'WE ARE PASSING. NO MALICE.', kind: 'plain', reply: 'No malice. Small words, weighed honest. You are no torch, gray-ship, but you are not ash either. Pass, and dim your running lights as you go. It is a funeral you are crossing.' },
      { t: 'A DEATHBED NEEDS WITNESSES.', kind: 'bold', reply: 'Nine generations, gray-ship, and no stranger has said THAT to us. Yes. A deathbed needs witnesses, and witnesses need fire in the throat to stand where others flee. Sail freely through mourning space. When our sun goes down, stand near.' }
    ]}
  ]
};

SF.GAMBITS.corsair = {
  posture: {
    friendly:    { line: 'Ooh, diplomacy! Look at the tub: all handshakes and no guns. Relax, we ain\'t biting. Soft ain\'t a crime out here. It\'s just funny.', rel: 0 },
    obsequious:  { line: 'Oh, grovel MORE, the whole deck\'s listening. Boys! Smell that? A tub that crawls is a tub that PAYS. Somebody fetch the ledger we stole.', rel: -2 }
  },
  drink: {
    cost: 30,
    label: 'STAND A ROUND (30 CR)',
    narrate: 'The credits cross the channel; the cheering arrives before the receipt does. A minute later a dented message torpedo thumps into the airlock: inside, a bottle of something evil, so the captain can drink along.',
    yarns: [
      { once: 'yarnDeadMen', text: 'Right, the dead men. Three clans back, a wrecker crew pulled a log-core off a hulk older than anybody\'s god. One heading inside, burned in deep: THIRTY BY THIRTY, out in the empty northwest. They flew it. And there\'s NOTHING there, tub. They parked in the nothing and toasted the find anyway, and the star they\'d been drinking under BLINKED. Twice. Like it was done watching. Know what came back? The bottle. Still corked. Clan law now: nobody flies thirty by thirty.',
        journal: 'Corsair ghost story: "dead men\'s coordinates" at 30,30, in the empty northwest. Crews who flew there found NOTHING. They did not come back. The bottle did.' },
      { once: 'yarnAuralite', text: 'Get-rich-quick, tub? Forget rocks. Them gas-bag caravels: the envelopes are spun AURALITE, purest in the reach, and the things can\'t shoot back. Pop one, scoop the drift, retire. There\'s so many of \'em, savvy? Ain\'t like the clouds\'ll notice one missing.' },
      { once: 'yarnCold', text: 'One of ours chased a distress beacon into the dark. Chrono ran backwards the whole way in. Found the sender: a whole fleet, frozen mid-burn, crews still at their posts. Years dead. Here\'s the part you drink about, tub: the beacon was still keying. Fresh. By hand. She didn\'t stay to take the call.' },
      { once: 'yarnPyre', text: 'The Pyre job? HA! Walked in during the mourning-hymn: ten thousand zealots singing at a dying sun and not one watching the altar. Grief\'s the best lookout money can\'t buy. The rock wouldn\'t stop SHINING, so we smothered it in their own prayer-cloth. Lost two crew on the way out. Worth it. Mostly.' },
      'A toast! To the Cold, for keeping the salvage FRESH. What? Too dark? Drink faster, tub, it gets funnier.',
      'Zealots\'ll burn you, ledger-heads\'ll fine you, gasbags\'ll talk you to death. Us? We just rob you. Cleanest deal in the reach, savvy?',
      'To somewhere better! May it miss us. It won\'t. Pour another.'
    ]
  }
};

SF.GAMBITS.rhanfayr = {
  posture: {
    hostile:     { line: 'You point your little fires at a star, and the star is not threatened, little vessel. It is MOVED. Everything young roars at the dark once. We remember roaring. It was very long ago, and very dear.', rel: 0 },
    obsequious:  { line: 'Sweet words, worn like a costume. Little vessel, we have watched you since the Folding, undressed of every costume. Speak plainly or not at all; we take no offense. Words were never the coin we count.', rel: 0 }
  },
  deedRecall: {
    good: [
      'Before you ask, little vessel: we saw you {DEED}. It is kept in the light now, and our light does not forget. Ask.',
      'We watched you {DEED}. Do you know what it is, to be a billion years old and still be SURPRISED by kindness? You have our whole attention, little vessel.',
      'First the ledger, then the words. We watched you {DEED}, and somewhere in the reach an old fire burned a little steadier for it. Now, ask.'
    ],
    bad: [
      'Before your question, little vessel, it must be said, or it will lie between us like a cold star: we saw you {DEED}. We do not scold. We have watched too many suns go out to spend grief on anger.',
      'We watched you {DEED}. There is no anger in us, little vessel; anger is for the young, who have time for it. There is only the watching, and the weight, and we carry both.',
      'You will ask, and we will answer. But know this: we saw you {DEED}, and grieved as the old grieve: quietly, and without end. Nothing in this reach is lost, little vessel. That is the mercy of it, and the weight.'
    ],
    none: [
      'We looked for you in our light, little vessel, and found a page with nothing written on it. Do you know how rare that is, a thing that has not yet chosen? We are watching very closely now.',
      'Your record is empty, little vessel. No mercy, no cruelty, not one mark in the light. We have not been handed an unwritten page in an age of ages. Write carefully. We will keep whatever you set down.'
    ]
  }
};

// ---- dialogue ---------------------------------------------------------------
// Topic pools. Lines may be gated: {req: flagsFn, once:'flagName', text, journal, act}
SF.DIALOG = {
  kvoth: {
    hail: {
      hostile: ['UNAUTHORIZED MASS DETECTED. YOU CARRY NO TRANSPONDER. COMPLIANCE WINDOW: CLOSED. PREPARE FOR REMOVAL.'],
      wary: ['SIGNAL ACKNOWLEDGED. YOUR AUTHORIZATION IS MARGINAL. STATE PURPOSE. BREVITY IS ADVISED.'],
      neutral: ['TRANSPONDER PULSE VERIFIED. VESSEL "VANGUARD" MAY PROCEED. QUERIES WILL BE PROCESSED IN ORDER RECEIVED.'],
      friendly: ['TRANSPONDER VERIFIED. YOUR CONDUCT INDEX IS FAVORABLE. THE LATTICE EXTENDS PROCESSING PRIORITY TO YOU.']
    },
    themselves: [
      'WE ARE KVOTH. SILICON SUBSTRATE, LATTICE-BONDED COGNITION. WE DO NOT DIE. WE DEPRECIATE.',
      'EMOTION WAS EVALUATED BY OUR ANCESTORS. COST EXCEEDED BENEFIT. IT WAS ARCHIVED.',
      'THE LATTICE IS NOT A GOVERNMENT. IT IS A LEDGER. ALL THINGS ARE ENTERED. ALL THINGS BALANCE.',
      'YOUR SHIP EMITS NO EXHAUST MASS. ZERO-POINT EXTRACTION. ADEQUATE ENGINEERING, FOR CARBON.',
      'AMONG KVOTH, PRECISION IS COURTESY. AN EXACT ANSWER IS A GIFT. AN EVASIVE ONE IS THEFT OF PROCESSING TIME, AND THEFT IS ENTERED IN THE LEDGER LIKE ANYTHING ELSE.'
    ],
    region: [
      'THIS VOLUME IS THE KVOTH SPHERE. RADIUS 45 UNITS FROM DATUM STAR KX-471. TRANSIT IS PERMITTED TO AUTHORIZED MASSES.',
      'STATIONS: LATTICE BASTION AT THE PRIME NODE. DEPOT KV-9 RIMWARD OF IT. TRADE RATES ARE NON-NEGOTIABLE AND THEREFORE FAIR.',
      'ADVISORY: THE VOLUME AROUND COORDINATES 110,185 SHOWS ELEVATED PIRACY. THE CORSAIRS ARE AN UNBALANCED ENTRY IN EVERY LEDGER.',
      'THE RED ZEALOTS (ASHKARU) HOLD THE VOLUME NEAR 45,148. THEY ARE IRRATIONAL BUT PREDICTABLY SO. PREDICTABILITY HAS VALUE.'
    ],
    others: [
      'THE VEL-MA-RAH TRADE IN OBJECTS AND IN RUMOR. THE FIRST HAS AUDITABLE VALUE. WEIGH THE SECOND YOURSELF.',
      'THE ASHKARU BURN FUEL TO MAKE POETRY AND POETRY TO MAKE WAR. WE DO NOT ENGAGE THEM. THE EXCHANGE RATE IS POOR.',
      'THE ASHKARU TRANSMISSION CORPUS: 9,000 CYCLES OF RECORDINGS. TRANSLATION YIELD: ZERO. THE SIGNAL RESISTS EVERY MATRIX EVER BUILT. WHETHER IT IS LANGUAGE OR ORNAMENTED NOISE REMAINS AN OPEN ENTRY. WE FILE THEIR INTENTIONS UNDER: BEHAVIOR, OBSERVED.',
      'THE CORSAIRS TOOK SOMETHING FROM THE ASHKARU. ASSESSED VALUE, INFERRED FROM RESPONSE: INFINITE. WE WOULD HAVE DECLINED TO INSURE IT. SINCE THAT DAY THE ZEALOTS BOARD ANY SHIP THAT CANNOT OUTRUN THEM.',
      'QUERY LOGGED: "HUMANS." NO PRIOR ENTRY EXISTS FOR YOUR SPECIES IN THE LATTICE. YOU ARE A NEW LINE IN THE LEDGER. WRITE IT CAREFULLY.'
    ],
    watchers: [
      { req: G => !G.flags.ring, text: 'QUERY DENIED. ARCHIVE ACCESS REQUIRES AUTHORIZATION.' },
      { req: G => G.flags.ring && G.rel.kvoth < 10, text: 'ARCHIVE ACCESS REQUIRES A FAVORABLE CONDUCT INDEX. YOURS IS INSUFFICIENT. IMPROVE IT.' },
      { req: G => G.flags.ring && G.rel.kvoth >= 10, once: 'clueDrone',
        text: 'ARCHIVE ENTRY 8812-C: A DRONE OF UNREGISTERED ORIGIN CROSSED OUR SPHERE 61 CYCLES AGO AND ANSWERED NO HAIL. WE LOGGED FLUCTUATIONS IN ITS POWER SIGNATURE, THEN LOST IT ON A DESCENT. ITS TRAJECTORY RESOLVES TO AN ELLIPSE, SOME 15 UNITS ABOUT 40,158. THE EXACT WORLD IS UNRESOLVED. THE ENTRY REMAINS UNBALANCED.',
        journal: 'Kvoth archive 8812-C: an unregistered drone crossed their sphere 61 cycles ago; they logged fluctuations in its power signature before losing it on a descent. Trajectory resolves to an ellipse ~15 units about 40,158. Exact world unresolved; the entry "remains unbalanced".' },
      { req: G => G.flags.clueDrone, text: 'NO FURTHER ENTRIES. THE BUILDERS OF THE DRONE PREDATE THE LATTICE. THAT SENTENCE COST US NOTHING TO SAY AND MAY COST YOU YEARS TO UNDERSTAND.' },
      { req: G => G.flags.clueDrone, once: 'clueMotion',
        text: 'SUPPLEMENTARY ANOMALY, RELEASED WITHOUT CHARGE: LONG-BASELINE OBSERVATION RECORDS 14 STARS IN THIS REACH WHOSE PROPER MOTION MATCHES NO GRAVITATIONAL MODEL. THE ERROR IS NOT IN OUR INSTRUMENTS. WE HAVE CHECKED FOR 9,000 CYCLES. FILED UNDER: UNRESOLVED.',
        journal: 'Kvoth records: 14 stars in this reach MOVE in ways gravity cannot explain. Filed unresolved for 9,000 cycles.' },
      { req: G => G.flags.starsAlive, text: 'YOUR SCIENCE OFFICER\'S HYPOTHESIS HAS BEEN LOGGED. THE LATTICE DECLINES TO EVALUATE IT. SOME ENTRIES ARE TOO LARGE FOR THE LEDGER.' }
    ],
    trade: [
      'THE LATTICE BUYS RADIOACTIVES AT PREMIUM. THORIUM SUSTAINS OUR SUBSTRATE FORGES. BRING ORE, RECEIVE CREDITS. THIS IS THE ENTIRE RELATIONSHIP. WE FIND IT RESTFUL.',
      'THE LATTICE ALSO PURCHASES SURVEY DATA: ORBITAL ENTRIES FOR WORLDS BEYOND OUR SPHERE. THE FARTHER FROM KV PRIME THE ENTRY, THE HIGHER THE RATE. THE SPHERE ITSELF IS ALREADY ON FILE. BRING US THE EDGES OF THE MAP.',
      'DEFENSIVE SYSTEMS ARE SOLD AT THE BASTION. WEAPONS ARE NOT. AN ARMED CUSTOMER IS AN ACTUARIAL LIABILITY.',
      'ADVISORY, ISSUED WITHOUT PLEASURE: THE ZEALOT FORGES CAST DRIVE, DEFLECTOR, AND PLATING UNITS EXCEEDING OUR CLASS 3 CEILING. THE LATTICE HAS FILED A COMPLAINT WITH PHYSICS. PHYSICS HAS NOT RESPONDED.',
      'A CHART CORE OF OUR SPHERE MAY BE PURCHASED AT ANY STATION. KNOWLEDGE IS INVENTORY.'
    ],
    anomaly: [
      { once: 'kvothDim',
        text: 'THE DIMMING. FOR 9,000 CYCLES, STARS AT THE REACH\'S COREWARD EDGE HAVE COOLED BELOW ALL STELLAR MODELS AND GONE DARK. EPICENTER: COORDINATES 25,175. GROWTH WAS SLOW. STABLE. SURVIVABLE. THEN, WITHIN ONE CYCLE OF YOUR ARRIVAL, THE GROWTH RATE MULTIPLIED BY FOUR. CORRELATION IS NOT CAUSATION. WE REPEAT THIS TO OURSELVES WITH INCREASING FREQUENCY.',
        journal: 'Kvoth: the DIMMING, stars going dark and cold for millennia, spreading from coordinates 25,175. Its growth accelerated sharply the day we arrived.' },
      'CAUSATION IS NOT GUILT. INTENT IS WEIGHED. THE LATTICE DOES NOT PUNISH COINCIDENCES. BUT IT RECORDS THEM.',
      'PROJECTION: AT CURRENT GROWTH, EVERY STAR IN THIS REACH GOES DARK. NO KNOWN ENERGY SOURCE CAN REKINDLE A DRAINED CORE. IF ONE EXISTS, IT IS OLDER THAN THE LATTICE. WE ARE ARCHIVING EVERYTHING. THAT IS WHAT WE DO WHEN WE CANNOT FIX A THING.',
      'OBSERVATION: THE DEAD SYSTEMS ARE NOT MERELY COLD. INSTRUMENTS INSIDE THEM REPORT VACUUM ENERGY BELOW THEORETICAL MINIMUM. SOMETHING IS DRINKING THE SPACE ITSELF. WE DO NOT USE THE WORD "DRINKING" LIGHTLY. WE DO NOT USE ANY WORD LIGHTLY.',
      'PROBE PROGRAM 4471: 612 PROBES DISPATCHED INTO THE DIMMING\'S HEART OVER 9,000 CYCLES. 612 SILENCES. COMPUTATION FAILS INSIDE: CURRENT IS DRUNK BEFORE THOUGHT COMPLETES. NO KVOTH CAN GO. THE PROGRAM CONTINUES BECAUSE STOPPING WOULD BE DESPAIR, AND DESPAIR IS NOT IN THE INSTRUCTION SET.'
    ]
  },

  velmarah: {
    hail: {
      hostile: ['Oh! Oh no. Weapons? We are FULL of flammable gas, friend, this benefits NO ONE...'],
      wary: ['Hmmm, a stranger-ship. Odd lines, hardly a gun to its name... You are either very poor or very interesting. Speak!'],
      neutral: ['Ahhhh, the round-headed newcomers! Come, come, the void is cold and gossip is warm. What do you carry?'],
      friendly: ['Sweet drifting friend! The Bazaar still sings of you! Sit, metaphorically, and let us trade WORDS, the only cargo lighter than vacuum!']
    },
    themselves: [
      'We are Vel-ma-rah! Born in the clouds of a world too heavy to leave. So we left anyway. Now every ship is a cloud and every cloud is home.',
      'A Vel-ma-rah who stops moving starts sinking. This is true in gas and true in life, friend.',
      'Our Bazaar Eternal drifts at the star men call the Gilded Reach. All are welcome. Even the Kvoth come, though they haggle like tombstones.',
      'What do we want? Stories, trinkets, spices, maps with mistakes on them! A perfect map is a dead map, friend.',
      'Money, friend? Money is only a story the banks all agree on. We prefer the UNAGREED kind. Bring us one we have not heard, and watch what it buys.',
      { req: G => G.rel.velmarah < 30, once: 'velFriendHint',
        text: 'You want the GOOD stories, hm? Friend, every caravel keeps a shelf the open channel never sees: stories with weight, stories that cost us something to carry. Those we do not sell. Those we tell only to our best friends, the way you open the last spice jar. Be good to the clans (mend a beacon, carry a courier, trade warm) and one day, sweet drifter, the jar opens for YOU.',
        journal: 'The Vel-ma-rah keep their best stories for their best friends. Kindness to the clans (beacons mended, couriers carried, warm trade) opens the jar.' }
    ],
    region: [
      'You fell into the Kvoth Sphere, poor thing. Rules upon rules. But their rules are honest, we give them that.',
      'Coreward of here the stars thin out and the corsairs thicken. Keep your cargo boring and your engines warm near 110,185.',
      'The Ashkaru sun is dying, friend. That is not a metaphor. Their star gutters like a candle and it has made them... intense.',
      'There are more stars in this reach than any chart admits. We have seen a star that is NOT on any chart. No, we will not say where. Yes, that is a hint. Ask again with credits!'
    ],
    others: [
      'The Kvoth? Fair, cold, and fair. They once fined US for arriving early. EARLY, friend!',
      'Corsair filth stole something from the Ashkaru, friend. A trinket, a bauble, we never saw it; but the zealots weep FIRE over the loss. If someone were to bring it back to them, ohh, the songs would be embarrassing in their gratitude.',
      'Corsairs den somewhere in the dark near 110,185, in the cold rocks. Even we do not trade there. Well. Rarely. Well. Not on Tuesdays.',
      'Nobody SPEAKS Ashkaru, friend. Not us, not the ledger-heads. Nine generations of listening and every translator chokes on the hymning. Maybe it is words. Maybe it is a burning house that RHYMES. Even the name is no name: "ash-KA-ru" is only the sound that comes back most often in the singing. We had to call them SOMETHING.',
      { req: G => G.rel.velmarah >= 30, once: 'clueVeil1',
        text: 'You ask good questions, friend, so here is a bad answer, free: long before the Kvoth counted anything, someone WATCHED. The old wrecks whisper a name: Rhan Fayr. Those Who Watch. The ruins know more than we do. Dead stone gossips too, if you can read it.',
        journal: 'Vel-ma-rah: ancient watchers called RHAN FAYR, "Those Who Watch". Planetary ruins may hold more.' }
    ],
    watchers: [
      { req: G => G.rel.velmarah < 30, text: 'Watchers? Old-wives-tales and static, friend. All the stories agree they kept a hidden homeworld, and every clan that went looking found nothing. NOTHING, in this business, is usually the interesting part. ...Why, what have you heard? WHO told you?' },
      { req: G => G.rel.velmarah >= 15, text: 'Have you ever seen a star BLINK, friend? My grandmother swore she did, out past the Gilded Reach. We gave her the good cushion and stopped asking questions. Lately... lately I think about her a lot.' },
      { req: G => G.rel.velmarah >= 30 && !G.flags.clueVeil2, once: 'clueVeil2',
        text: 'Shhh. Closer. For you, one story, because you have been kind and kindness is the rarest cargo: the Watchers dwell behind a door in nothing, near a star no chart will hold. How to find it, we cannot say. But three times in the deep reaches this caravel has met strange stars that seemed to... FLICKER, friend, for lack of a better word. Blink, almost. We logged it as faulty sensors, all three times, because the other explanation was too large. Perhaps your sensors are better than ours. Or your nerves. Oh, and if you ever do find a door in nothing: without a phase-woven veil, a door chews bone.',
        journal: 'Vel-ma-rah legend: the Watchers dwell behind a "door in nothing", near a star no chart holds. The Vel-ma-rah themselves have met stars that seemed to FLICKER, and logged it as faulty sensors every time. Perhaps ours are better. And a "door in nothing" chews unveiled hulls; a "phase-woven veil" is needed to pass one.' },
      { req: G => G.flags.clueVeil2, text: 'We told you about the flickering stars already, friend. Do not make us regret it. The Watchers judge what is DONE, not what is said. So go DO.' }
    ],
    trade: [
      'The Bazaar buys everything and sells most of it back! Gold, curios, life-scans, embarrassing sculpture!',
      'Cargo pods! Charts! Oddities! And rumors, friend, the finest rumors, aged in vacuum, ten credits the whisper... well, more. Inflation.',
      { req: G => G.flags.clueVeil2 && !G.flags.phasematrixGiven, text: 'A "phase-woven veil", was it? Hmmmm. We know of one thing that HUMS the way the stories say: the zealots keep it, pulled from a drowned ruin, and they stare at it like a newborn sun. We have SEEN it, friend: a knot of wire that hums. Whatever they see burning in it, nobody else ever has. They will never trade it. Unless... you had something they want MORE. Something stolen. Something that burns.' }
    ],
    anomaly: [
      'The Dimming, friend. We have watched three worlds we loved freeze under a guttering sun. No sunrise. Imagine it. The clans are already voting on which way to run. There is always somewhere to run. Usually.',
      'Grandmothers\' tales say the dark drinks the stars one by one, coreward, where no clan flies anymore. The tales used to say "slowly." The tales have stopped saying "slowly," friend.',
      'The Kvoth measured it: the dark got HUNGRIER the very day you fell into the reach. We do not blame you. But somebody pulled you here, friend, and whoever it was paid something for the pulling. Nothing in this reach is free. Not even rescue.',
      { req: G => G.flags.clueVeil2, text: 'If ANYONE can relight a dead sky, it is the ones who were old when the dark\'s grandmother was young. You know the story. The flickering stars, friend. GO. The Bazaar would rather lose a customer than a reach.' }
    ]
  },

  ashkaru: {
    hail: {
      hostile: ['Your hull will make fine ash. The Flame does not negotiate with thieves and strangers. BURN.'],
      wary: ['Speak, ember, before the Flame judges you. You fly through mourning space. Our star dies and our patience died first.'],
      neutral: ['You are known, gray-ship. The Flame has not judged against you. Speak and be quick.'],
      friendly: ['SUNBRINGER! The choirs still burn your name into the Pyre Walls! Ask, and it is yours, kin-of-the-Flame.']
    },
    themselves: [
      'We are Ashkaru. Our sun is dying and we will not let it die quietly. Every raid, every hymn, every forge-stroke feeds the Pyre.',
      'You think us cruel. We are grieving. There is a difference, though the wreckage looks the same.',
      'The Pyre Throne orbits our guttering sun at 45,148, by the counting-engines\' arithmetic. Numbers are the one thing the machines say plainly. Uninvited guests become fuel.',
      'Our poetry is written in exhaust plumes and read by widows. Would you like to hear some? No? Wise.',
      'We pay in fire here, gray-ship. Courage is the coin and grief is the mint. Speak to an Ashkaru like a torch and be answered as kin. Speak like ash and be swept.',
      'Nine generations we sang challenge into the void, and the void sent back static, squeaking, and arithmetic. We concluded the reach was full of moving things and empty of minds. Then your gray hull answered IN VERSE-FORM. The theologians have not slept since.'
    ],
    region: [
      'The cold ones, the Kvoth, count everything and feel nothing. Their sphere borders ours. The border is warm with old battles.',
      'The gas-bags? Charming ANIMALS, we judged: weather-bladders that squeak and barter by pointing, like feeding birds. You say there are minds in there, gray-ship? The Flame refuses to consider it. One speaking species besides us is already too many.',
      'Corsair filth dens in the black rocks at 110,185. Mark it, gray-ship. Mark it and burn it if you have the fire.'
    ],
    others: [
      { once: 'ashStoneTold',
        text: 'THE SUNSTONE. They took the SUNSTONE. Corsair vermin crept into the Pyre Throne itself and carried off the heart of our dying sun. Until it returns, every stranger is a suspect and every suspect is ash.',
        journal: 'The Ashkaru\'s holy Sunstone was stolen by corsairs (den near 110,185). Returning it would mean much.' },
      'The counting-engines once offered to BUY back what was taken from us. They did not even know what they priced. Pictures, gray-ship: a relic, an arrow, a sum. As if grief had a rate of exchange. We burned the envoy\'s escort. It was worth the war.',
      'The Watchers? Ask the dead ruins, ember. The Flame remembers only fire.'
    ],
    watchers: [
      { req: G => !G.flags.phasematrixGiven, text: 'We keep one relic of the elder dark and you may not see it, stranger. It hums. It waits. It is not for you.' },
      { req: G => G.flags.phasematrixGiven, text: 'The Weaver is with you now, Sunbringer: the fairest work of the elder dark, an inner fire to rival our dying sun. The gas-bags called it a trinket. The counting-engines offered a NUMBER for it. The reach is blind, Sunbringer. Guard what it cannot see.' },
      'The elder dark watched our first fires. If they watch still, ember, then let them see the Ashkaru died SINGING.'
    ],
    trade: [
      'The forges of the Pyre sell fire: lasers, torpedoes, and the hottest drives and shield-hearts in the reach, hotter than the counting-engines can cast. To friends. Are you a friend? The Flame will decide.',
      'Bring us titanium and iridium, gray-ship. Grief is expensive and armor doubly so.'
    ],
    anomaly: [
      'You have seen it, then. The Great Cold, coreward of the Pyre. Our sun stands closest to it and has guttered for nine generations. We are the people of a dying flame, gray-ship. We did not choose it. We only chose not to leave.',
      { once: 'ashPsalm',
        text: 'The psalm of the Last Ember says: "When the fires gutter, a stranger shall fall from a folded sky. By the stranger\'s hand the hearth is fed, or by no hand at all." Nine generations we recited it as comfort. Now YOU are here, gray-ship, and we recite it as prophecy. Do not make us recite it as a curse.',
        journal: 'Ashkaru prophecy: "When the fires gutter, a stranger shall fall from a folded sky. By the stranger\'s hand the hearth is fed, or by no hand at all."' },
      'If the Cold reaches the Pyre, we will fly into the dark singing, and burn what remains of us to warm our sun one final hour. The psalm allows another ending. See that you are worthy of being in a psalm, gray-ship.',
      'Do not think us cowards for waiting, gray-ship. The Ninth Crusade flew into the Cold with nine hundred ships and every torch the forges could cast. The Cold did not even ECHO. Fire is what it EATS. We learned, at the price of a generation, that courage is also fuel.'
    ]
  },

  corsair: {
    hail: {
      hostile: ['Well well. A fat little science tub, far from home. Cargo and credits, NOW, or we open you like a tin.'],
      wary: ['You got salvage-nerve coming here. Talk fast.'],
      neutral: ['Heh. The tub that pays. Talk, but keep your hands off the scanner.'],
      friendly: ['If it ain\'t our favorite mark! Relax, we don\'t bite the hand that trades.']
    },
    themselves: [
      'No flag, no god, no ledger. Just the take. Cleanest religion in the reach.',
      'Every one of us got thrown out of somewhere better. That\'s the entry fee.',
      'The clan? Kvoth exiles, Vel-ma-rah what got too greedy even for Vel-ma-rah. A dozen species, one religion. You\'ve met the religion.'
    ],
    region: [
      'Kvoth space is bad hunting, too many patrols. Ashkaru space is worse, they LIKE dying. So we work the seams, savvy?',
      'Our patch is cold rocks and warm bars, savvy? The dark\'s been creeping toward it for years. Clan\'s official position: it can have the rocks when we\'re done with the bars.'
    ],
    others: [
      { req: G => !G.flags.sunstone && !G.flags.sunstoneReturned, once: 'corsairStone',
        text: 'The rock? The glowing rock? HA. Best take the clan ever pulled. The zealots would burn a fleet for it. Which is why it ain\'t for sale... cheap. And not for credits, tub. Credits is paper and promises; a thing like THAT you trade for metal in the hold. Twenty measures of iridium. That\'s the price of a god. Take it or leave it.',
        journal: 'The corsairs hold a glowing relic stolen from the Ashkaru. They will part with it for 20 M3 of iridium; credits refused.' },
      'The Watchers? Spacer\'s ghost story. Dead men\'s coordinates. Buy me a drink sometime and I\'ll tell you which dead men.',
      'The zealots? Nobody parleys with \'em, tub. Their comm traffic is all howl and drum. No translator ever cracked it. Might be words. Might be a kettle boiling angry. Might be nothing thinking at all in there, just fire that learned to fly ships. You don\'t talk your way out of Ashkaru space. You run or you burn.'
    ],
    watchers: ['Ghost stories cost extra, tub.'],
    trade: [
      'Everything\'s for sale. Especially things that ain\'t ours.',
      'Free advice, one time only: a tub that pays tribute flies home. A tub that runs gets opened and counted. Market forces, savvy?'
    ],
    anomaly: [
      'The dark systems? Best salvage in the reach, tub. Whole frozen fleets, cargo still racked, crews still at their posts. Like robbing a museum. A big... cold... quiet museum. We don\'t go deep anymore, though. Deep in the dark, the instruments start reading BACKWARDS.',
      'Word is the Cold got faster the day you fell into the reach. If the zealots ever do that arithmetic, tub, I\'d fly fast and far.'
    ]
  },

  rhanfayr: {
    hail: {
      hostile: ['...'], wary: ['...'], neutral: ['...'],
      friendly: ['The star\'s flares resolve, impossibly, into language: WE HAVE WATCHED YOU SINCE THE FOLDING, LITTLE VESSEL. You looked for our city. You looked for our world. You are inside our answer.']
    },
    themselves: [
      'You searched for a homeworld. Forgive us. We have not worn worlds for a long age. Planets are cradles, little vessel. We outgrew ours before your sun was lit.',
      'Perhaps we live IN the stars. Perhaps we ARE the stars. After a billion years the preposition wears thin, and we have stopped minding which is true.',
      'We kindle stars as your kind kindles lamps, and we move them when the furniture of the galaxy displeases us. Slowly. Carefully. Your astronomers charted our footsteps and filed them under ANOMALY.',
      'The drones you found are our hands. Small work needs small fingers. The one that frightened the counting-people was old, and shy. We are sorry it fell.'
    ],
    region: [
      'Every fire in this reach is kin, or kindling we left burning to warm the young races. We watched the Kvoth archive their sorrow, the Ashkaru set theirs alight, the Vel-ma-rah outrun theirs. Your kind builds a ship and points it at sorrow directly. Remarkable.',
      'The Ashkaru sun is one of ours: the oldest soldier of a war you have only now seen the edge of. It stands closest to the Hunger and has fed the Cold pieces of itself for nine of their generations, so that brighter kin might live. The Ashkaru have kept it better company than they know.',
      'This reach was old when your Earth was molten. What you call ruins are the houses of those who looked up, and counted, and understood too late that they were counting US.'
    ],
    others: [
      'The folding of space is not forbidden knowledge. It is merely knowledge with teeth. Your species reached for it early. That is either courage or appetite; we have been watching your voyage to learn which.',
      'The young races say the stars want nothing. Almost true, little vessel. We are paid in what each of you does when you believe no one is watching. The reach has made us rich, and poor, and rich again.'
    ],
    watchers: [
      'You wish to go home. We know. We have read it in every course you plotted. The engine you broke can be rewoven; we wove such engines when we were young and still wore hands.',
      'Understand, little vessel: we do not sell, and we do not bargain. We JUDGE. We have watched everything you did in this reach: the mercies and the cruelties, the greed and the grace. The ledger the Kvoth keep in numbers, we keep in light.'
    ],
    trade: ['We want nothing you carry. What you have already given, or taken, is the only coin we count.'],
    anomaly: [
      'You call it the Dimming. We call it the Hunger. Long ago something crossed into this reach from the between-spaces: a maw that drinks starfire and drinks the vacuum itself. Every star it takes is one of us, or one of our sleeping kin, going cold. You have charted our graves and called them anomalies.',
      'We cannot touch it, little vessel. We are made of the same deep fires it feeds upon; we approach, and it drinks us faster. For an age we have only fed it slowly, rationed ourselves to it, and grown fewer, and colder, and quieter.',
      { once: 'confession',
        text: 'And now the confession you are owed. We watched your species kindle a folding engine, and we were drowning, and we grabbed. The pulling burned out your drive and cost us more strength than we had spared in an epoch. The Hunger leapt forward on the day you arrived because we spent ourselves to bring you. You were not lost, little vessel. You were CHOSEN, clumsily, by the dying. We are sorry. We were so very tired.',
        journal: 'The Rhan Fayr confess: the Fold "malfunction" was THEM, a desperate summons. They are dying, and they pulled us across the galaxy because a matter-ship with a fold drive can do what they cannot: carry fire into the Maw.' },
      'You cannot kill a hunger. But you can feed it something that transforms it. A seed of our fire, folded into its very throat, and the Maw becomes a womb. A star is born inside it, and the Hunger becomes the newest of us. That is the errand, little vessel. That has always been the errand.',
      'You wonder why the errand falls to YOU. Look at this reach. The counting-people are minds of running current; the Cold drinks current before a thought completes. The burning-people fly on fire, and fire is food. The drifting-people are warmth in thin skins. Every engine here eats fuel, and fuel is fire, and fire is food. Do you understand yet? Every strength of this reach is EDIBLE.',
      'But your ship, little vessel: your ship drinks the vacuum itself. A heart that beats on the far side of everywhere, where the Hunger cannot reach. And your crew: six small, warm, brief minds, too quick and too strange to taste. The reach is full of better ships. It has never once held a crew like yours. The Hunger will not know to be afraid.',
      'Inside the Cold, your instruments will lie to you. Numbers will run backwards. Stars will not exist. Only the old key you carry will speak truly; it was tuned for this errand before your species drew breath. Follow its pulse, and fly by your own eyes and hands, as your ancestors crossed their oceans. That is the whole of the plan, little vessel. We are sorry it is also the best one.'
    ]
  }
};

// ---- rumors for sale (station lounges) ---------------------------------------
SF.RUMORS = [
  { id: 'r_ruins', price: 600, at: 'velmarah', text: '"Dead cities on dead worlds, friend. We know of three: a rock at 100,70... an iceball at 60,80... a desert at 160,130. Take a shovel and a linguist."', journal: 'Rumor: ruins at 100,70 / 60,80 / 160,130.' },
  { id: 'r_corsair', price: 400, at: 'velmarah', text: '"The corsair den? The cold rocks at 110,185. You did not hear it from us, and if you die there, you REALLY did not hear it from us."', journal: 'Rumor: corsair den at 110,185.' },
  { id: 'r_whale', price: 300, at: 'velmarah', text: '"Void-whales graze the empty reaches. Harmless, unless shot. Scan one close: the data sells, and the whale forgives."', journal: 'Rumor: scan void-whales for valuable data. Do not shoot.' },
  { id: 'r_vault', price: 1500, at: 'velmarah', req: G => G.flags.clueRuin1 || G.flags.clueRuin2 || G.flags.clueRuin3, text: '"The ruin-builders kept a vault-world, the stories say. The ruins themselves spell out where. Three stones: numbers and a colour, friend. Though stones burn too, they say. Arithmetic is the cheapest shovel; patience is the second cheapest."', journal: 'Rumor: the three ruins together spell the vault-world\'s location.' },
  { id: 'r_kvoth', price: 250, at: 'velmarah', text: '"The Kvoth pay premium for thorium and sell fine engines. Just never be late, never be early, and never make a joke."' },
  { id: 'r_ash', price: 450, at: 'kvoth', text: 'DATA FOR SALE: ASHKARU DISPOSITION ANALYSIS. THEIR DISPOSITION INDEX DROPPED 71 POINTS THE DAY A RELIC WAS STOLEN FROM THEM. IMPLICATION: IT WOULD RISE AGAIN IF RETURNED. WE SELL THIS OBSERVATION BECAUSE WE CANNOT USE IT. THEY WOULD NOT TAKE IT FROM US.', journal: 'Kvoth analysis: returning the Ashkaru\'s stolen relic would win their favor.' },
  { id: 'r_scar', price: 800, at: 'kvoth', req: G => G.flags.dimKnown, text: 'DATA FOR SALE: DIMMING PROJECTION MODEL. GROWTH IS SUPERLINEAR. EVERY CATALOGUED CULTURE IN THIS REACH IS INSIDE THE PROJECTED TERMINAL RADIUS. INCLUDING YOU, WHEREVER YOU RUN. RECOMMENDATION: DO NOT RUN.', journal: 'Kvoth projection: the Dimming will eventually swallow every star in the reach. Running is not an option.' },
  { id: 'r_maw', price: 1200, at: 'velmarah', req: G => G.flags.dimKnown, text: '"The heart of the Cold? The corsairs\' grandsires called it the MAW: a black un-star at 25,175 that eats light and worse. Every probe ever sent came back as... less probe. Do NOT go there without a reason, friend. Or shields. Or a will."', journal: 'Vel-ma-rah: the heart of the Dimming is the MAW, a black un-star at 25,175.' }
];

// ---- story text ---------------------------------------------------------------
SF.INTRO_PAGES = [
  [
    'STARDATE 4640.1, ABOARD THE ISS VANGUARD',
    '',
    'Twenty years have passed since the Heroes of Arth',
    'set forth to save the galaxy by bringing about the',
    'destruction of the Crystal Planet. From the long',
    'shadow of the Old Empire a NEW EMPIRE has been',
    'reformed, and its brightest minds have conceived a',
    'technological marvel the likes of which the universe',
    'has never seen: THE FOLD DRIVE. A device that folds',
    'two points of space together and steps across.',
    '',
    'The Vanguard, the New Empire\'s finest ship. A crew',
    'of six. Mission: the maiden voyage. Destination:',
    're-colonized Earth. A voyage of four hundred years',
    'at sublight speed, made in a heartbeat.',
    '',
    'That was the plan.'
  ],
  [
    'T+00:00:04 FOLD INITIATION',
    '',
    'The stars smeared into lines. Then the lines bent.',
    '',
    'ENGINEERING: "Power spike! The regulators are..."',
    'SCIENCE:     "Fold geometry is NOT converging..."',
    'NAVIGATION:  "That\'s not Earth. That\'s not ANYWHERE."',
    '',
    'Every console went white. Every alarm sang at once.',
    'And the Vanguard folded... somewhere else.'
  ],
  [
    'T+00:19:31 EMERGENCY POWER RESTORED',
    '',
    'The lights come back brown and reluctant.',
    'The Fold Drive is a fused, blackened ruin.',
    'The starcharts are useless: not one constellation',
    'matches. Navigation puts the probable displacement',
    'at "more than the mission budget."',
    '',
    'The good news: the zero-point engines need no fuel,',
    'the crew is alive, and the hull is whole.',
    '',
    'Aft sensors record one final impossibility before',
    'failing: the fold vector never matched the plotted',
    'course. As if something, at the far end, was pulling.',
    '',
    'And the bad news arrives at that exact moment,',
    'on the proximity alarm:',
    '',
    'A VESSEL ON INTERCEPT COURSE. SMALL. FAST. EXACT.'
  ]
];

// twenty years after the Crystal Planet fell (Starflight 1, SD 4620)
SF.START_SD = 4640.1;

// ---- THE DIMMING (existential threat) ------------------------------------------
// An ancient hunger, the Maw, squats in the far reach and drinks starfire.
// Stars gutter out cold; their worlds freeze. It has crept for millennia, but it
// LEAPT forward around the day the Vanguard arrived... because summoning the
// Vanguard cost the Watchers nearly everything they had left.
SF.DIM = {
  cx: 25, cy: 175,
  r0: 12,          // dead radius at game start (ancient victims)
  base: 4.5,       // radius growth per stardate (acceleration trips ~SD +4.0)
  accelR: 30,      // radius at which growth accelerates
  accel: 11,       // accelerated growth rate (Ashkar falls at SD +4.3)
  doom: 80         // radius at which the chorus fails (game over, ~SD +8.5)
};
SF.dimRadius = function (sd) {
  const t = sd - SF.START_SD;
  const r = SF.DIM.r0 + t * SF.DIM.base;
  if (r <= SF.DIM.accelR) return r;
  const tAccel = (SF.DIM.accelR - SF.DIM.r0) / SF.DIM.base;
  return SF.DIM.accelR + (t - tAccel) * SF.DIM.accel;
};
SF.starCold = function (star) {
  if (SF.G && SF.G.flags.emberDelivered) return false;   // the reach rekindles
  return SF.dimRadius(SF.G ? SF.G.stardate : SF.START_SD) >= SF.dist(star.x, star.y, SF.DIM.cx, SF.DIM.cy);
};

SF.HELP_LINES = [
  '=== OPERATIONS MANUAL: ISS VANGUARD ===',
  '',
  'BRIDGE STATIONS (press number key at any time in flight):',
  '  1 CAPTAIN:     log, cargo, jettison cargo, fold drive, save',
  '  2 SCIENCE:     sensors, artifact analysis, starmap',
  '  3 NAVIGATION:  enter/leave orbit, shields, deploy the TV',
  '  4 ENGINEER:    damage report, repairs (uses titanium)',
  '  5 COMMS:       hail nearby vessels or stations',
  '  6 DOCTOR:      examine and treat the crew',
  '',
  'THE COMM/LOG CONSOLE keeps the last 400 lines. SHIFT+UP',
  'scrolls back through the record, SHIFT+DOWN returns toward',
  'the present (PGUP/PGDN also work). When more arrives at',
  'once than fits on screen, the view holds at the first',
  'unread line and SPACE turns the page: nothing scrolls',
  'away unread.',
  '',
  'FLIGHT: arrow keys thrust the ship. Approach a star to enter',
  'its system. Approach a planet and press ENTER to orbit it;',
  'near a station, ENTER requests docking. (The NAVIGATION',
  'station offers the same maneuvers.) Fly to the system edge',
  'to return to deep space. Shields deflect harm but wash out',
  'the sensor grid: detection range is HALVED while they are up.',
  '',
  'PLANETSIDE: the ship never lands; the TV drops alone via',
  'NAVIGATION > LAND (pick a site with the crosshair) while the',
  'Vanguard holds orbit. Drive the TV with arrows. ENTER',
  'interacts: mine deposits, recover artifacts, scan life.',
  'Worlds are LARGE: study the orbital scan, land near the',
  'blips, and steer by the corner minimap.',
  'ESC opens the vehicle menu. The TV holds 50 M3 per trip;',
  'a deposit too big for the bay keeps its remainder. Ore that',
  'does not fit the ship\'s hold stays racked in the TV bay and',
  'offloads automatically on a later landing.',
  '',
  'ENCOUNTERS: choose a posture before hailing. Different',
  'cultures respect different tones. Weapons are a last resort;',
  'the Vanguard carries only a light survey laser. Patience is',
  'finite: a contact humors only a few questions before closing',
  'the channel. Return another day; they will have more to say.',
  '',
  'TRADE: dock at stations (fly close, COMMS > hail, request',
  'docking). Sell minerals, buy upgrades, listen for rumors.',
  'The Kvoth also buy orbital survey data of worlds beyond',
  'their sphere: the farther out the entry, the better the',
  'rate. Every orbit you establish is money in the bank.',
  '',
  'THE WAY HOME: no one hands you the answer. Read ruins, earn',
  'trust, ask everyone about the old races. Write it all down:',
  'the Captain\'s log records what matters (CAPTAIN > LOG).',
  '',
  'There is no fuel gauge. Zero-point energy is free.',
  'Everything else must be earned.'
];

SF.CREW_DEF = [
  { role: 'CAPTAIN',   name: 'Capt. Moira McConnell' },
  { role: 'SCIENCE',   name: 'Dr. Rowan Johnson' },
  { role: 'NAVIGATOR', name: 'Ens. Jun Lee' },
  { role: 'ENGINEER',  name: 'Unit CLAUD' },
  { role: 'COMMS',     name: 'Lt. Rafael Gonsalves' },
  { role: 'DOCTOR',    name: 'Dr. Eszter Kercso' }
];
