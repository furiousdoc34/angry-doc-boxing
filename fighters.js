// Angry Doc: Underground Knockout — data-driven story roster.
// 10 arcs x 10 fights = 100 fighters (9 generated regulars + 1 hand-written boss per arc).
// Every fighter: name, nickname, look (applied to the shared CC0 rig via tint + props), stats,
// AI archetype, 2-4 signature combos, a rage special, and pre/post dialogue.
// Generation is seeded and deterministic; uniqueness of (archetype + combo set + look) is enforced.

export const ARCHETYPES = {
  'out-boxer':       { guard: .25, dodge: .30, idle: [1.0, 1.8], wind: 1.00, combo: .25, retreat: .25, feint: .05, power: .9,  pref: ['jab','jab','hookR'] },
  'swarmer':         { guard: .10, dodge: .05, idle: [0.4, 0.9], wind: 0.90, combo: .55, retreat: .05, feint: .05, power: .85, pref: ['hookL','hookR','jab'] },
  'slugger':         { guard: .15, dodge: .00, idle: [1.1, 2.0], wind: 1.30, combo: .15, retreat: .05, feint: .00, power: 1.45, pref: ['hookL','hookR','upper'] },
  'counter-puncher': { guard: .45, dodge: .20, idle: [1.0, 1.6], wind: 0.85, combo: .20, retreat: .10, feint: .05, power: 1.0, pref: ['jab','upper'], counter: true },
  'switch-hitter':   { guard: .20, dodge: .15, idle: [0.7, 1.4], wind: 0.95, combo: .35, retreat: .10, feint: .10, power: 1.0, pref: ['hookL','hookR'], switch: true },
  'dirty fighter':   { guard: .10, dodge: .10, idle: [0.6, 1.2], wind: 0.80, combo: .35, retreat: .05, feint: .35, power: 1.1, pref: ['upper','hookL'] },
  'tank':            { guard: .50, dodge: .00, idle: [1.2, 2.0], wind: 1.15, combo: .20, retreat: .00, feint: .00, power: 1.2, pref: ['hookL','hookR'], hpMul: 1.35 },
  'speedster':       { guard: .10, dodge: .35, idle: [0.4, 0.9], wind: 0.70, combo: .40, retreat: .15, feint: .10, power: .75, pref: ['jab','jab','hookL'] },
  'trickster':       { guard: .15, dodge: .25, idle: [0.6, 1.3], wind: 0.85, combo: .30, retreat: .10, feint: .45, power: .9,  pref: ['upper','jab'] },
  'brawler':         { guard: .05, dodge: .05, idle: [0.6, 1.1], wind: 1.05, combo: .45, retreat: .00, feint: .00, power: 1.2, pref: ['hookR','hookL','upper'] },
  'technician':      { guard: .30, dodge: .20, idle: [0.8, 1.4], wind: 0.80, combo: .35, retreat: .10, feint: .15, power: 1.0, pref: ['jab','hookL','upper'] },
};

// step: [punch, windMul]; 'feint' = telegraph with no hit
export const COMBOS = {
  'Double Jab': [['jab',1],['jab',.5]],
  'One-Two': [['jab',1],['hookR',.6]],
  'Jab-Jab-Hook': [['jab',1],['jab',.5],['hookL',.7]],
  'Liver Shot': [['hookL',1.1],['upper',.6]],
  'Feint Uppercut': [['feint',.8],['upper',.5]],
  'Feint Hook': [['feint',.7],['hookR',.5]],
  'Tornado Hooks': [['hookL',1],['hookR',.5],['hookL',.5]],
  'Bolo Punch': [['feint',1],['feint',.4],['upper',.6]],
  'Jeepney Rush': [['jab',.8],['jab',.4],['jab',.4],['hookR',.5]],
  'Palengke Haggle': [['jab',1],['feint',.5],['jab',.4],['upper',.6]],
  'Typhoon Spin': [['hookR',1],['hookL',.5],['hookR',.5],['hookL',.5]],
  'Sampal Slap': [['hookR',.7],['hookR',.5]],
  'Bayanihan Barrage': [['jab',.7],['hookL',.5],['hookR',.5],['upper',.6]],
  'Sneaky Upper': [['jab',.9],['upper',.4]],
  'Lechon Roll': [['hookL',1.2],['hookR',.8],['upper',.8]],
  'Karaoke Encore': [['jab',.8],['hookR',.5],['jab',.5],['hookL',.5]],
  'Tsinelas Toss': [['feint',.6],['jab',.4],['hookL',.5]],
  'Halo-Halo Mix': [['upper',1],['jab',.5],['hookR',.5]],
  'Tinikling Step': [['feint',.5],['feint',.5],['hookL',.5]],
  'Kalabaw Charge': [['upper',1.3],['upper',.7]],
  'Sari-Sari Special': [['jab',1],['upper',.6],['hookL',.5]],
  'Habagat Wind': [['hookL',.9],['jab',.4],['hookR',.5]],
  'Balut Breaker': [['jab',.8],['jab',.4],['upper',.6]],
  'Pacman Flurry': [['jab',.6],['jab',.35],['hookL',.4],['hookR',.4],['upper',.5]],
  'Barong Twirl': [['feint',.7],['hookR',.4],['hookL',.4]],
  'Adobo Simmer': [['jab',1.2],['feint',.6],['hookR',.5],['upper',.5]],
};
export const RAGES = ['Lindol Smash','Bagyong Signal 5','Kidlat Strike','Bulkang Mayon','Tsunami Rush','Agimat Fury','Diwata Dance','Tikbalang Trample','Aswang Ambush','Manananggal Dive','Sigbin Shadow','Bakunawa Bite'];

const ARCS = [
  { id: 'barangay', name: 'Barangay San Isidro', place: 'a basketball-court basement', intro: 'Every legend starts at the barangay hall. The tanod say there\'s an underground ring under the covered court. Doc just wants to fix people... and maybe knock a few out.' },
  { id: 'bayan', name: 'Bayan ng Malabon', place: 'the old rice mill', intro: 'Word spreads: a doctor who punches harder than he prescribes. The town fishermen and tricycle kings want a piece.' },
  { id: 'probinsya', name: 'Probinsya Tour', place: 'a cockpit arena', intro: 'Up to the mountains and down to the farms. Provincial strongmen fight for pride, lechon, and bragging rights.' },
  { id: 'cebu', name: 'Queen City Cebu', place: 'a dockside warehouse', intro: 'Cebu has fast hands and faster feet. The Visayan scene does not care about your diploma.' },
  { id: 'davao', name: 'Durian Coast Davao', place: 'a durian-scented garage', intro: 'Down south the fighters are disciplined and the durian is strong. Respect is earned one round at a time.' },
  { id: 'metro', name: 'Metro Manila Mayhem', place: 'a flooded parking basement in Makati', intro: 'Traffic, typhoons, and the toughest underground ring in the capital. The Metro bosses smell a new rival.' },
  { id: 'national', name: 'National Underground Cup', place: 'an abandoned mall atrium', intro: 'Luzon, Visayas, Mindanao — the best of each island in one bracket. Win and you are the Pambansang Kamao of the underground.' },
  { id: 'asiapac', name: 'Asia-Pacific Circuit', place: 'a neon rooftop in Bangkok', intro: 'The passport gets stamped. New styles, new tricks, same doctor\'s orders.' },
  { id: 'asia', name: 'Asian Grand Prix', place: 'a subway depot in Seoul', intro: 'Only the top fighters in Asia remain. Every one of them has studied your tapes.' },
  { id: 'world', name: 'World Underground Championship', place: 'a cathedral-sized boiler room', intro: 'The final stage. The world\'s strangest, strongest fighters — and a champion who has never been knocked down.' },
];

const BOSSES = [
  { name: 'Kapitan Kamao', nick: 'Barangay Captain', arch: 'tank', combos: ['One-Two','Kalabaw Charge'], rage: 'Lindol Smash', look: { build: 'heavy', skin: 0xb07a4a, hair: 'slick', hairColor: 0x111111, top: 'barong', topColor: 0xf3e9c8, shorts: 0x4a3018, glove: 0xd4af37, acc: ['mustache','sash'] }, pre: 'This is MY barangay, Doc. Sign the logbook before I sign your forehead.', post: 'Hmph. Fine. The barangay is yours... for now.' },
  { name: 'Mang Bangus', nick: 'King of the Fishpen', arch: 'slugger', combos: ['Lechon Roll','Liver Shot','Sampal Slap'], rage: 'Tsunami Rush', look: { build: 'heavy', skin: 0x9a6438, hair: 'bald', hairColor: 0x222222, top: 'tank', topColor: 0x1e88e5, shorts: 0xffffff, glove: 0x00897b, acc: ['salakot','beard'] }, pre: 'I\'ve gutted bigger fish than you before breakfast.', post: 'You... you are not a fish. You are a shark.' },
  { name: 'Datu Dagundong', nick: 'Thunder of the Highlands', arch: 'brawler', combos: ['Kalabaw Charge','Tornado Hooks','Bayanihan Barrage'], rage: 'Tikbalang Trample', look: { build: 'heavy', skin: 0x8a5a30, hair: 'long', hairColor: 0x111111, top: 'none', topColor: 0xb71c1c, shorts: 0xb71c1c, glove: 0xffb300, acc: ['headband','tattoo'] }, pre: 'The mountain does not bow. Neither do I.', post: 'The mountain... has moved. Go with honor.' },
  { name: 'Reyna Sinulog', nick: 'Queen of the Dance Floor', arch: 'speedster', combos: ['Tinikling Step','Typhoon Spin','Pacman Flurry'], rage: 'Diwata Dance', look: { build: 'slim', skin: 0xd09a70, hair: 'ponytail', hairColor: 0x3e2723, top: 'tank', topColor: 0xff4081, shorts: 0xffeb3b, glove: 0xffffff, acc: ['flower','headband'] }, pre: 'Pit Señor! Keep up with my rhythm if you can, Doc.', post: 'You stepped on my toes... and my pride. Well danced.' },
  { name: 'Heneral Durian', nick: 'The Spiked General', arch: 'counter-puncher', combos: ['Sneaky Upper','Liver Shot','Adobo Simmer'], rage: 'Sigbin Shadow', look: { build: 'normal', skin: 0xa8703f, hair: 'buzz', hairColor: 0x333333, top: 'vest', topColor: 0x556b2f, shorts: 0x556b2f, glove: 0x9e9d24, acc: ['shades','cap'] }, pre: 'Discipline beats rage. Every. Single. Time.', post: 'Your discipline... is better than mine. Dismissed.' },
  { name: 'Don Trapiko', nick: 'Lord of EDSA', arch: 'dirty fighter', combos: ['Jeepney Rush','Tsinelas Toss','Feint Hook','Barong Twirl'], rage: 'Bagyong Signal 5', look: { build: 'heavy', skin: 0xc68a5a, hair: 'slick', hairColor: 0x9e9e9e, top: 'jacket', topColor: 0x212121, shorts: 0x212121, glove: 0xffd600, acc: ['shades','chain'] }, pre: 'In Manila, nobody moves unless I say so. Not even you.', post: 'Ugh. Stuck in traffic... on the canvas.' },
  { name: 'Pambansang Bagwis', nick: 'The National Eagle', arch: 'technician', combos: ['Bayanihan Barrage','Habagat Wind','Sari-Sari Special','Pacman Flurry'], rage: 'Kidlat Strike', look: { build: 'normal', skin: 0xb07a4a, hair: 'mohawk', hairColor: 0x1565c0, top: 'tank', topColor: 0x0038a8, shorts: 0xce1126, glove: 0xfcd116, acc: ['wings','headband'] }, pre: 'Three islands, one eagle. You face the whole archipelago.', post: 'Fly higher than me, Doc. Bring the flag to Asia.' },
  { name: 'Tiger Somchai', nick: 'Muay Monsoon', arch: 'switch-hitter', combos: ['Typhoon Spin','Feint Uppercut','Habagat Wind'], rage: 'Bakunawa Bite', look: { build: 'slim', skin: 0xc8915f, hair: 'buzz', hairColor: 0x111111, top: 'none', topColor: 0xff6f00, shorts: 0xff6f00, glove: 0xd50000, acc: ['armband','headband'] }, pre: 'In my gym, doctors only treat the loser.', post: 'Good fight. My knees will need your clinic.' },
  { name: 'Iron Hwarang', nick: 'Seoul Steel', arch: 'out-boxer', combos: ['Double Jab','One-Two','Karaoke Encore','Balut Breaker'], rage: 'Agimat Fury', look: { build: 'slim', skin: 0xe0b080, hair: 'idol', hairColor: 0xb39ddb, top: 'jacket', topColor: 0xeeeeee, shorts: 0x263238, glove: 0x263238, acc: ['earring','shades'] }, pre: 'Your footwork is a 70% at best. Let me grade it properly.', post: '...100%. You get a 100%.' },
  { name: 'Lolo Kidlat', nick: 'The Undefeated Lightning', arch: 'trickster', combos: ['Bolo Punch','Pacman Flurry','Feint Uppercut','Tsinelas Toss'], rage: 'Kidlat Strike', look: { build: 'slim', skin: 0xd09a70, hair: 'white', hairColor: 0xeeeeee, top: 'sando', topColor: 0x6a1b9a, shorts: 0xffffff, glove: 0x111111, acc: ['beard','cane','glasses'] }, pre: 'Seventy years, zero knockdowns. Want to be my first, iho?', post: 'Hehe... finally. Now the world belongs to the Doc.' },
];

const FIRST = ['Totoy','Boyet','Jun-Jun','Dodong','Inday','Bebang','Kulot','Bunso','Nonoy','Pido','Andoy','Berto','Caloy','Dindo','Edong','Floro','Gorio','Isko','Jepoy','Kiko','Lito','Mando','Nestor','Onyok','Pepe','Quintin','Rodel','Sonny','Tomas','Udong','Vicente','Weng','Yoyong','Zaldy','Ising','Maring','Tonyo','Badong','Ompong','Bogart','Popoy','Pacing','Teban','Ramon','Lando','Nida','Chito','Elmer','Ruben','Jojo','Bong','Toto','Nene','Lorna','Gary','Rico','Tess','Dado','Ambo','Celso'];
const PREFIX = ['Kuya','Ate','Mang','Aling','Tito','Tita','Lolo','Kid','Big','Little','Señor','Bossing','Pare','Mare','Doc','Sir','Coach','Idol','Master','Batang'];
const NICK_A = ['Tricycle','Jeepney','Balut','Bagoong','Calamansi','Kalabaw','Tinola','Sinigang','Lechon','Turon','Tsinelas','Karaoke','Basketball','Palengke','Sabong','Banca','Habal-Habal','Kalesa','Sampaguita','Bangus','Ube','Pandesal','Adobo','Bibingka','Taho','Sorbetes','Kamote','Patis','Tabo','Videoke'];
const NICK_B = ['Tornado','Terror','Typhoon','Bulldozer','Ninja','Phantom','Hammer','Rocket','Wildcat','Machine','Monster','Prince','Bandit','Cannon','Shadow','Wizard','Dragon','Crusher','Spinner','Viper'];
const INTL_FIRST = ['Kenji','Ji-ho','Aziz','Ravi','Dmitri','Mateo','Kofi','Lars','Somsak','Bao','Hiro','Arjun','Nguyen','Ibrahim','Santiago','Olu','Sven','Marco','Yusuf','Leon'];
const HAIR = ['bald','buzz','slick','mohawk','afro','long','ponytail','spiky','curly','idol','bun','white'];
const TOPS = ['none','tank','sando','jersey','hoodie','vest','jacket','barong'];
const ACC = ['headband','shades','cap','beard','mustache','chain','towel','salakot','flower','bandana','glasses','earring','armband','mask','tattoo','sash'];
const SKINS = [0xe0b080, 0xd09a70, 0xc8915f, 0xc68a5a, 0xb07a4a, 0xa8703f, 0x9a6438, 0x8a5a30, 0x7a4a28];
const PAL = [0xe53935,0xd81b60,0x8e24aa,0x5e35b1,0x3949ab,0x1e88e5,0x039be5,0x00acc1,0x00897b,0x43a047,0x7cb342,0xc0ca33,0xfdd835,0xffb300,0xfb8c00,0xf4511e,0x6d4c41,0x546e7a,0x212121,0xfafafa];
const HAIRC = [0x111111,0x2b1a10,0x4e342e,0x8d6e63,0xc62828,0xfdd835,0x1565c0,0x9e9e9e,0xeeeeee,0x7b1fa2];
const EMO = ['🥊','🔥','⚡','🌪️','🐃','🦅','🐍','🦈','🐯','🐒','🥥','🍌','🌶️','🛺','🚌','🎤','🏀','🐓','🌊','🌋','👊','💪','🍢','🥭','🦀','🐟','🎸','⭐','💥','🌀'];
const ARCH_LIST = Object.keys(ARCHETYPES);
const ARCH_PRE = {
  'out-boxer': ['Catch me if you can, Doc.','I\'ll jab you from the next barangay.'], 'swarmer': ['No space, no air, no mercy!','I fight like rush hour — nonstop!'],
  'slugger': ['One punch. That\'s all I need.','Hope your clinic is open late.'], 'counter-puncher': ['Go on. Swing first.','Every mistake you make, I bill you double.'],
  'switch-hitter': ['Left? Right? Even I don\'t know yet.','Two stances, twice the pain.'], 'dirty fighter': ['Rules? Never heard of \'em.','Psst... your shoelace is untied.'],
  'tank': ['Hit me. I dare you.','I\'ve been hit by a jeepney. You\'re nothing.'], 'speedster': ['Blink and you\'ll miss me!','I\'m already behind you, Doc.'],
  'trickster': ['Is this a feint? Or is THIS?','Magic trick: watch your stamina disappear.'], 'brawler': ['Let\'s settle this the barangay way!','Lights out, Doc!'],
  'technician': ['I\'ve studied your angles.','Precision beats passion.'],
};
const POST = ['Aray ko! You hit like a defibrillator.','Okay okay, I need a check-up now.','Next time, Doc. Next time.','Ang lakas mo, idol!','My lola is going to scold me...','Respeto, Doc. Respeto.','I\'ll be back after my therapy sessions.','You win... but my nickname is still cooler.'];

function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function build() {
  const r = mulberry(20261030), pick = a => a[Math.floor(r() * a.length)];
  const used = new Set(), names = new Set(), roster = [];
  const comboNames = Object.keys(COMBOS);
  ARCS.forEach((arc, ai) => {
    for (let k = 0; k < 10; k++) {
      const idx = ai * 10 + k, tier = idx / 99; // 0..1 difficulty
      let f;
      if (k === 9) {
        const b = BOSSES[ai];
        f = { name: b.name, nick: b.nick, archetype: b.arch, combos: b.combos, rage: b.rage, look: { emoji: '👑', height: 1.08, ...b.look }, boss: true, pre: b.pre, post: b.post };
      } else {
        for (let tries = 0; tries < 200; tries++) {
          const intl = ai >= 7 && r() < 0.6;
          const name = intl ? pick(INTL_FIRST) + ' ' + pick(NICK_B) : pick(PREFIX) + ' ' + pick(FIRST);
          const nick = 'The ' + pick(NICK_A) + ' ' + pick(NICK_B);
          if (names.has(name)) continue;
          const arch = ARCH_LIST[(idx * 7 + Math.floor(r() * 3)) % ARCH_LIST.length];
          const nC = 2 + Math.floor(r() * (ai < 3 ? 2 : 3));
          const pool = [...comboNames].sort(() => r() - .5).slice(0, nC).sort();
          const look = { build: pick(['slim','normal','heavy']), height: 0.92 + r() * 0.16, skin: pick(SKINS), hair: pick(HAIR), hairColor: pick(HAIRC), top: pick(TOPS), topColor: pick(PAL), shorts: pick(PAL), glove: pick(PAL), acc: [...new Set([pick(ACC), r() < .5 ? pick(ACC) : null].filter(Boolean))], emoji: pick(EMO) };
          const key = [arch, pool.join('+'), look.hair, look.top, look.topColor, look.glove].join('|');
          if (used.has(key)) continue; used.add(key); names.add(name);
          f = { name, nick, archetype: arch, combos: pool, rage: pick(RAGES), look, boss: false, pre: pick(ARCH_PRE[arch]), post: pick(POST) };
          break;
        }
      }
      // flashy gear in later arcs + all bosses (cosmetic, original designs)
      const GEAR = ['neon','spiked','mech'];
      f.look.gear = f.boss ? GEAR[ai % 3] : ai >= 4 ? GEAR[(idx * 5) % 3] : (ai >= 2 && k % 3 === 0 ? 'neon' : null);
      f.look.sig = f.look.glove;
      const A = ARCHETYPES[f.archetype];
      const lvl = 1 + idx;
      f.id = idx; f.arc = ai; f.fight = k; f.level = lvl;
      f.stats = {
        hp: Math.round((150 + tier * 230 + (f.boss ? 60 : 0)) * (A.hpMul || 1) * (f.look.build === 'heavy' ? 1.1 : f.look.build === 'slim' ? .92 : 1)),
        power: +(A.power * (0.75 + tier * 0.75) * (f.boss ? 1.1 : 1)).toFixed(2),
        speed: +((0.8 + tier * 0.4) / A.wind).toFixed(2),
        defense: +(A.guard + A.dodge).toFixed(2),
        stamina: Math.round(90 + tier * 60),
      };
      f.intro = `${arc.name} · Fight ${k + 1}${f.boss ? ' · BOSS' : ''} — ${f.name} "${f.nick}" (${f.archetype}) waits in ${arc.place}.`;
      roster.push(f);
    }
  });
  return roster;
}
export const ROSTER = build();
export { ARCS };
