// Kid Kamao: Underground Knockout — data-driven story roster.
// 50 opponent types (from the user's opponent card sheet, portraits in portraits/oppNN.webp).
// Part 1 (Ch.1-5) runs the ladder 1→50; Part 2 "Rematch" (Ch.6-10) runs 1→50 again, harder,
// with an extra combo, a gear upgrade and new pre-fight lines. = 100 story fights.
// Every fight's (archetype + combo set + look) is unique (checked at build time).

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
  'juggernaut':      { guard: .35, dodge: .00, idle: [1.3, 2.2], wind: 1.40, combo: .20, retreat: .00, feint: .00, power: 1.6, pref: ['upper','hookL','hookR'], hpMul: 1.5 },
};

// step: [punch, windMul]; 'feint' = telegraph with no hit
export const COMBOS = {
  'Double Jab': [['jab',1],['jab',.5]], 'One-Two': [['jab',1],['hookR',.6]], 'Jab-Jab-Hook': [['jab',1],['jab',.5],['hookL',.7]],
  'Liver Shot': [['hookL',1.1],['upper',.6]], 'Feint Uppercut': [['feint',.8],['upper',.5]], 'Feint Hook': [['feint',.7],['hookR',.5]],
  'Tornado Hooks': [['hookL',1],['hookR',.5],['hookL',.5]], 'Bolo Punch': [['feint',1],['feint',.4],['upper',.6]],
  'Jeepney Rush': [['jab',.8],['jab',.4],['jab',.4],['hookR',.5]], 'Alley Ambush': [['jab',1],['feint',.5],['jab',.4],['upper',.6]],
  'Typhoon Spin': [['hookR',1],['hookL',.5],['hookR',.5],['hookL',.5]], 'Sampal Slap': [['hookR',.7],['hookR',.5]],
  'Bayanihan Barrage': [['jab',.7],['hookL',.5],['hookR',.5],['upper',.6]], 'Sneaky Upper': [['jab',.9],['upper',.4]],
  'Lechon Roll': [['hookL',1.2],['hookR',.8],['upper',.8]], 'Karaoke Encore': [['jab',.8],['hookR',.5],['jab',.5],['hookL',.5]],
  'Tsinelas Toss': [['feint',.6],['jab',.4],['hookL',.5]], 'Halo-Halo Mix': [['upper',1],['jab',.5],['hookR',.5]],
  'Shadow Step': [['feint',.5],['feint',.5],['hookL',.5]], 'Kalabaw Charge': [['upper',1.3],['upper',.7]],
  'Sari-Sari Special': [['jab',1],['upper',.6],['hookL',.5]], 'Habagat Wind': [['hookL',.9],['jab',.4],['hookR',.5]],
  'Balut Breaker': [['jab',.8],['jab',.4],['upper',.6]], 'Thousand Fists': [['jab',.6],['jab',.35],['hookL',.4],['hookR',.4],['upper',.5]],
  'Blade Twirl': [['feint',.7],['hookR',.4],['hookL',.4]], 'Slow Burn': [['jab',1.2],['feint',.6],['hookR',.5],['upper',.5]],
  'Avalanche': [['hookL',1.3],['hookR',1.0],['upper',1.0]], 'Grave Rattle': [['jab',.7],['feint',.4],['jab',.4],['jab',.4]],
  'Beast Maul': [['hookR',.9],['hookL',.4],['hookR',.4],['upper',.6]], 'System Overload': [['jab',.6],['jab',.3],['jab',.3],['jab',.3],['hookR',.5]],
};

// [label, archetype, build, skin, skinType, hair, hairColor, top, topColor, shorts, glove, acc[], combos[], rage, rageColor, nick]
const T = [
  ['Rookie','out-boxer','slim',0xe8b48a,'',"spiky",0x2b1a10,'none',0,0x1565c0,0xd32f2f,['headband'],['Double Jab','One-Two'],'First Blood Flurry',0xffd23f,'Fresh From the Gym'],
  ['Street Thug','brawler','normal',0xc8915f,'','buzz',0x111111,'tank',0x5d4037,0x37474f,0x424242,['bandana','tattoo'],['Sampal Slap','Alley Ambush'],'Gutter Stomp',0xff7043,'Pride of the Eskinita'],
  ['Bully','slugger','heavy',0xe0b080,'','buzz',0x3e2723,'none',0,0x4e342e,0x212121,['chain'],['Kalabaw Charge','One-Two'],'Lunch Money Smash',0xff5722,'Recess Tyrant'],
  ['Punk','dirty fighter','slim',0xe0b080,'','mohawk',0xe53935,'vest',0x212121,0x263238,0x212121,['earring','chain'],['Tsinelas Toss','Feint Hook'],'Mosh Pit Riot',0xff1744,'Gig-Night Menace'],
  ['Tattooed','brawler','normal',0xc68a5a,'','bald',0x111111,'none',0,0x3e2723,0x8d6e63,['tattoo','armband','beard'],['Tornado Hooks','Sneaky Upper'],'Ink Dragon Rush',0x00bfa5,'Walking Canvas'],
  ['Mohawk','swarmer','normal',0xe0b080,'','mohawk',0x2979ff,'none',0,0x1a237e,0x1565c0,['earring'],['Jeepney Rush','Sampal Slap'],'Blue Spike Storm',0x2979ff,'Rooster of Recto'],
  ['Brawler','brawler','heavy',0xc8915f,'','buzz',0x2b1a10,'none',0,0x6d4c41,0x212121,['beard'],['Lechon Roll','Tornado Hooks'],'Bar Fight Bonanza',0xff6d00,'Last Man Standing'],
  ['Biker','slugger','heavy',0xb07a4a,'','slick',0x111111,'vest',0x212121,0x212121,0x424242,['bandana','shades','beard'],['Kalabaw Charge','Liver Shot'],'Highway Hammer',0xff9100,'Kalsada King'],
  ['Hooligan','dirty fighter','normal',0xe0b080,'','buzz',0x111111,'hoodie',0x37474f,0x263238,0x212121,['hood'],['Alley Ambush','Feint Uppercut'],'Stadium Stampede',0x76ff03,'Terrace Terror'],
  ['Gangster','counter-puncher','normal',0xe0b080,'','slick',0x111111,'jacket',0x212121,0x212121,0x212121,['fedora','mustache','chain'],['Sneaky Upper','Liver Shot','Feint Hook'],'Family Business',0xd50000,'Boss of the Block'],
  ['Ninja','speedster','slim',0xe0b080,'','bald',0x111111,'jacket',0x1a1a1a,0x1a1a1a,0x212121,['ninja'],['Shadow Step','Double Jab'],'Smoke Bomb Assault',0x9c27b0,'Shadow of Binondo'],
  ['Samurai','technician','normal',0xe0b080,'','bun',0x111111,'armor',0x8b1a1a,0x3e2723,0x5d1010,['samurai'],['Blade Twirl','One-Two'],'Iaido Flash',0xff1744,'Last Ronin'],
  ['Monk','counter-puncher','normal',0xd09a70,'','bald',0x111111,'robe',0xff8f00,0xef6c00,0xffa000,['beads'],['Feint Uppercut','Halo-Halo Mix'],'Hundred Palm Prayer',0xffd600,'Temple Stillness'],
  ['Karateka','technician','normal',0xe0b080,'','spiky',0x111111,'gi',0xfafafa,0xfafafa,0xd32f2f,['headband'],['Jab-Jab-Hook','Sneaky Upper'],'Ten-Board Break',0xffffff,'Black Belt Bulldog'],
  ['Muay Thai','switch-hitter','slim',0xc68a5a,'','buzz',0x111111,'none',0,0xc62828,0x1565c0,['headband','armband'],['Typhoon Spin','Liver Shot'],'Elbow Monsoon',0xff3d00,'Art of Eight Limbs'],
  ['Taekwondo','speedster','slim',0xe0b080,'','idol',0x111111,'gi',0xfafafa,0xfafafa,0x1565c0,[],['Habagat Wind','Double Jab'],'Tornado Kick Chain',0x2979ff,'Spinning Storm'],
  ['MMA Fighter','switch-hitter','normal',0xe0b080,'','buzz',0x2b1a10,'none',0,0x212121,0x212121,['tattoo'],['Bayanihan Barrage','Feint Hook'],'Cage Ground-and-Pound',0xff1744,'Cage Champion'],
  ['Wrestler','tank','heavy',0xe0b080,'','bald',0x111111,'singlet',0xc62828,0xc62828,0x212121,['luchador'],['Kalabaw Charge','Lechon Roll'],'Suplex Slam',0xd50000,'Red Mask of the Ring'],
  ['Luchador','trickster','normal',0xc8915f,'','bald',0x111111,'none',0,0x1565c0,0x1565c0,['luchador_blue'],['Bolo Punch','Shadow Step'],'Top-Rope Tornado',0x00b0ff,'Azul Volador'],
  ['Sumo','juggernaut','heavy',0xe8b48a,'','bun',0x111111,'none',0,0xfafafa,0xe0b080,['mawashi'],['Avalanche','Kalabaw Charge','Sampal Slap'],'Mountain Crash',0xffab00,'Yokozuna of the Underground'],
  ['Pirate','dirty fighter','normal',0xc8915f,'','long',0x2b1a10,'jacket',0x5d1010,0x3e2723,0xd32f2f,['pirate','beard','earring'],['Tsinelas Toss','Blade Twirl'],'Broadside Barrage',0xffab00,'Scourge of Manila Bay'],
  ['Viking','slugger','heavy',0xe8b48a,'','long',0xbf6b2a,'fur',0x6d4c41,0x4e342e,0x5d4037,['horns','beard'],['Avalanche','Liver Shot'],'Ragnarok Hammer',0x40c4ff,'Northern Berserker'],
  ['Gladiator','brawler','normal',0xc68a5a,'','buzz',0x111111,'armor',0x8d6e63,0xc62828,0xd32f2f,['gladiator'],['Lechon Roll','One-Two'],'Arena Roar',0xffd600,'Champion of the Sand'],
  ['Barbarian','brawler','heavy',0xc68a5a,'','long',0x3e2723,'fur',0x5d4037,0x4e342e,0x4e342e,['beard'],['Beast Maul','Kalabaw Charge'],'Warlord Rampage',0xff6d00,'Axe of the Wastes'],
  ['Knight','tank','normal',0xe0b080,'metal','bald',0,'armor',0x90a4ae,0x607d8b,0x90a4ae,['helmet'],['Slow Burn','One-Two'],'Holy Lance Charge',0xfff176,'Iron Oath'],
  ['Spartan','counter-puncher','normal',0xc68a5a,'','bald',0,'none',0,0xc62828,0xc62828,['spartan'],['Sneaky Upper','Avalanche'],'This Is The Underground!',0xff1744,'Hoplite of Three Hundred'],
  ['Assassin','speedster','slim',0xe0b080,'','bald',0,'hoodie',0x212121,0x212121,0x212121,['hood','mask'],['Shadow Step','Feint Uppercut'],'Leap of Silence',0x7c4dff,'Hidden Blade'],
  ['Desert Warrior','out-boxer','slim',0xc68a5a,'','bald',0,'robe',0xd7b98a,0x8d6e63,0x8d6e63,['turban'],['Habagat Wind','Jab-Jab-Hook'],'Sandstorm Fury',0xffca28,'Dune Phantom'],
  ['Highlander','slugger','heavy',0xe0b080,'','long',0x5d4037,'none',0,0x2e7d32,0x5d4037,['warpaint'],['Kalabaw Charge','Typhoon Spin'],'Claymore Cyclone',0x00e5ff,'Mist of the Glen'],
  ['Shaman','trickster','normal',0x8d6e63,'','long',0x5d4037,'robe',0x4e342e,0x3e2723,0x5d4037,['skullmask','beads'],['Bolo Punch','Slow Burn','Shadow Step'],'Spirit Totem Curse',0x76ff03,'Voice of the Ancestors'],
  ['Skeleton','speedster','slim',0xece4d0,'bone','bald',0,'none',0,0x5d4037,0xece4d0,['skull'],['Grave Rattle','Double Jab'],'Bone Rattle Rush',0xb2ff59,'Rattling Remains'],
  ['Zombie','brawler','normal',0x7d8a6a,'','bald',0,'none',0,0x4e342e,0x7d8a6a,['zombie'],['Beast Maul','Sampal Slap'],'Undead Horde',0x76ff03,'The Unrested'],
  ['Mummy','tank','normal',0xd9c9a3,'','bald',0,'none',0,0xd9c9a3,0xd9c9a3,['bandage'],['Slow Burn','Halo-Halo Mix'],'Curse of the Pharaoh',0xffd600,'Wrapped Wrath'],
  ['Orc','slugger','heavy',0x6b9a3a,'','mohawk',0x111111,'armor',0x5d4037,0x3e2723,0x5d4037,['tusks'],['Avalanche','Beast Maul'],'Waaagh Smash',0xff3d00,'Warchief Grak'],
  ['Goblin','trickster','slim',0x8bc34a,'','bald',0,'none',0,0x5d4037,0x5d4037,['goblin'],['Tsinelas Toss','Shadow Step'],'Shiny Thief Frenzy',0xffea00,'Sneaky Snik'],
  ['Minotaur','juggernaut','heavy',0x6d4c41,'','bald',0,'none',0,0x3e2723,0x4e342e,['bullhorns','snout'],['Kalabaw Charge','Avalanche'],'Labyrinth Charge',0xff6d00,'Bull of the Maze'],
  ['Werewolf','swarmer','heavy',0x616161,'','afro',0x424242,'none',0,0x37474f,0x424242,['wolf'],['Beast Maul','Tornado Hooks'],'Full Moon Frenzy',0xb388ff,'Midnight Howler'],
  ['Lizard Man','switch-hitter','normal',0x7cb342,'','bald',0,'none',0,0x33691e,0x558b2f,['snout','spikes'],['Typhoon Spin','Sneaky Upper'],'Tail Whip Tempest',0x64dd17,'Swamp King'],
  ['Ogre','juggernaut','heavy',0xd84315,'','bald',0,'none',0,0x4e342e,0x5d4037,['tusks','devilhorns'],['Avalanche','Lechon Roll'],'Club of Ruin',0xff1744,'Red Mountain'],
  ['Troll','juggernaut','heavy',0x78909c,'','afro',0x546e7a,'none',0,0x37474f,0x546e7a,['tusks'],['Avalanche','Beast Maul','Kalabaw Charge'],'Bridge Breaker',0x40c4ff,'Toll of the Bridge'],
  ['Fire Golem','juggernaut','heavy',0xff6d00,'fire','bald',0,'none',0,0x3e2723,0xff3d00,['glow_eyes','rock'],['Slow Burn','Avalanche'],'Magma Eruption',0xff3d00,'Living Volcano'],
  ['Ice Golem','tank','heavy',0x81d4fa,'ice','spiky',0xb3e5fc,'none',0,0x4fc3f7,0xb3e5fc,['glow_eyes'],['Avalanche','Halo-Halo Mix'],'Absolute Zero',0x00e5ff,'Glacier Heart'],
  ['Stone Golem','juggernaut','heavy',0x8d8d84,'','bald',0,'none',0,0x616161,0x8d8d84,['rock'],['Kalabaw Charge','Slow Burn'],'Landslide',0xbcaaa4,'Moving Mountain'],
  ['Dark Knight','counter-puncher','normal',0x37474f,'metal','bald',0,'armor',0x263238,0x212121,0x263238,['helmet','glow_eyes'],['Feint Uppercut','Liver Shot'],'Abyssal Cleave',0x7c4dff,'Fallen Paladin'],
  ['Demon','dirty fighter','heavy',0xd32f2f,'','bald',0,'none',0,0x212121,0xb71c1c,['devilhorns','glow_eyes'],['Feint Hook','Beast Maul'],'Hellfire Inferno',0xff1744,'Pit Lord'],
  ['Dragonborn','technician','heavy',0xc77c2a,'','bald',0,'armor',0x6d4c41,0x4e342e,0xbf6b2a,['snout','spikes','bullhorns'],['Typhoon Spin','Thousand Fists'],'Dragon Breath Blast',0xff9100,'Scale of the Ancients'],
  ['Cyborg','technician','normal',0x9e9e9e,'metal','bald',0,'none',0,0x424242,0x757575,['glow_eyes','visor'],['System Overload','One-Two'],'Overclock Barrage',0xff1744,'Half Man, All Machine'],
  ['Alien','trickster','slim',0xb0bec5,'metal','bald',0,'none',0,0x78909c,0xb0bec5,['alien'],['Shadow Step','Bolo Punch'],'Abduction Beam',0x00e676,'Visitor From Beyond'],
  ['Robot','speedster','normal',0xeceff1,'metal','bald',0,'armor',0xeceff1,0x546e7a,0xeceff1,['visor','antenna'],['System Overload','Thousand Fists'],'Rocket Fist Protocol',0x00b0ff,'Unit KMO-49'],
  ['Final Boss','juggernaut','heavy',0x3e2723,'fire','spiky',0x212121,'armor',0x212121,0x212121,0xb71c1c,['devilhorns','glow_eyes','spikes'],['Thousand Fists','Avalanche','Beast Maul'],'Apocalypse Fist',0xff1744,'The End of All Fights'],
];
const FIRST = ['Rodel','Berto','Bunso','Pido','Tonyo','Badong','Kulot','Dodong','Isko','Jepoy','Kiko','Lito','Mando','Nonoy','Onyok','Pepe','Caloy','Dindo','Andoy','Sonny','Teban','Zaldy','Gorio','Floro','Edong','Udong','Ramon','Lando','Chito','Elmer','Ruben','Jojo','Bong','Toto','Gary','Rico','Dado','Ambo','Celso','Ompong','Popoy','Weng','Yoyong','Boyet','Totoy','Nestor','Vicente','Quintin','Tomas','Bogart'];
const ARCH_PRE = {
  'out-boxer': ['Catch me if you can, Kid.','I\'ll jab you from the next barangay.'], 'swarmer': ['No space, no air, no mercy!','I fight like rush hour — nonstop!'],
  'slugger': ['One punch. That\'s all I need.','Hope your coach brought ice.'], 'counter-puncher': ['Go on. Swing first.','Every mistake you make, I bill you double.'],
  'switch-hitter': ['Left? Right? Even I don\'t know yet.','Two stances, twice the pain.'], 'dirty fighter': ['Rules? Never heard of \'em.','Psst... your shoelace is untied.'],
  'tank': ['Hit me. I dare you.','I\'ve been hit by a jeepney. You\'re nothing.'], 'speedster': ['Blink and you\'ll miss me!','I\'m already behind you, Kid.'],
  'trickster': ['Is this a feint? Or is THIS?','Watch your stamina disappear.'], 'brawler': ['Let\'s settle this the barangay way!','Lights out, Kid!'],
  'technician': ['I\'ve studied your angles.','Precision beats passion.'], 'juggernaut': ['The ground shakes when I walk.','You cannot stop what does not stop.'],
};
const REMATCH_PRE = ['Last time you got lucky, Kid. Not twice.','I\'ve trained every day since you beat me.','Remember me? I remember YOU.','New gear, new combos, same grudge.','Round two. This time I\'m ready.','You knocked me down once. I came back stronger.'];
const POST = ['Aray ko! You hit like a truck.','Okay okay, you win this one.','Next time, Kid. Next time.','Ang lakas mo, idol!','Respeto, Kid. Respeto.','I\'ll be back... after the clinic.','You win... but my name is still cooler.'];
const REMATCH_POST = ['Twice?! Fine. You\'re the real deal.','I have nothing left to teach you... or hit you with.','Go win it all, Kid.'];

export const ARCS = [
  { name: 'Street Ladder', place: 'a basketball-court basement', intro: 'Every legend starts on the street. Coach Angry Doc found a kid with fast hands and a short temper. "Tutok, Kid. Fists up. The underground is calling."' },
  { name: 'Dojo Circuit', place: 'a hidden rooftop dojo', intro: 'Word spreads about Kid Kamao. Martial artists from every school want to test their style against boxing. Coach Doc: "Discipline beats flash. Watch the wind-up."' },
  { name: 'Warriors\' Colosseum', place: 'a flooded colosseum under the city', intro: 'Pirates, vikings, gladiators — warriors from every era fight here for glory. Coach Doc: "They hit hard. Make them miss, then make them pay."' },
  { name: 'Monster Pit', place: 'a torch-lit cave arena', intro: 'Below the colosseum is the pit, where the fighters are not quite human anymore. Coach Doc: "Monsters get tired too. Watch their stamina."' },
  { name: 'Elemental Abyss', place: 'a boiler room at the edge of the world', intro: 'Golems of fire and ice, demons, machines... and at the very bottom, the Final Boss. Coach Doc: "Everything you learned leads here."' },
  { name: 'Rematch: Street Ladder', place: 'the same old basement — now packed', intro: 'PART 2 — REMATCH. You won once. Now they\'ve all trained, upgraded their gear, and want revenge. Coach Doc: "Champions win twice."' },
  { name: 'Rematch: Dojo Circuit', place: 'the rooftop dojo in a thunderstorm', intro: 'The masters have learned new techniques just for you. Every combo is longer, every guard tighter.' },
  { name: 'Rematch: Warriors\' Colosseum', place: 'the colosseum at full moon', intro: 'The warriors bring new weapons-grade gear. The crowd wants blood — and a legend.' },
  { name: 'Rematch: Monster Pit', place: 'the pit, now on fire', intro: 'The monsters are angrier, faster and wearing armor. Coach Doc: "Breathe. Block. Counter."' },
  { name: 'Rematch: Elemental Abyss', place: 'the heart of the abyss', intro: 'The final climb. The Final Boss has been waiting for this rematch since the day you beat him. Win, and you are the undisputed Kid Kamao.' },
];
const GEAR = ['neon','spiked','mech'];

function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function build() {
  const r = mulberry(20261030), pick = a => a[Math.floor(r() * a.length)];
  const roster = [], keys = new Set(), comboNames = Object.keys(COMBOS);
  for (let part = 0; part < 2; part++) {
    T.forEach((t, ti) => {
      const [label, arch, build, skin, skinType, hair, hairColor, top, topColor, shorts, glove, acc, combos, rage, rageColor, nick] = t;
      const idx = part * 50 + ti, tier = idx / 99, boss = (ti + 1) % 10 === 0;
      let cmb = [...combos];
      if (part === 1) { const extra = comboNames.filter(c => !cmb.includes(c)); cmb.push(extra[Math.floor(r() * extra.length)]); }
      const look = { build, height: build === 'heavy' ? 1.06 : build === 'slim' ? 0.96 : 1.0, skin, skinType, hair, hairColor, top, topColor, shorts, glove, acc: [...acc], sig: rageColor, portrait: `portraits/opp${String(ti + 1).padStart(2, '0')}.webp`,
        gear: part === 1 ? GEAR[ti % 3] : (boss ? GEAR[(ti / 10) % 3] : null) };
      const A = ARCHETYPES[arch];
      const f = {
        id: idx, type: ti + 1, part, arc: part * 5 + Math.floor(ti / 10), fight: ti % 10, level: idx + 1, boss, rematch: part === 1,
        name: `${label} ${FIRST[ti]}`, label, nick, archetype: arch, combos: cmb, rage: part === 1 ? rage + ' MAX' : rage, look,
        pre: part === 1 ? pick(REMATCH_PRE) : pick(ARCH_PRE[arch]), post: part === 1 ? pick(REMATCH_POST) : pick(POST),
      };
      f.stats = {
        hp: Math.round((150 + tier * 230 + (boss ? 60 : 0)) * (A.hpMul || 1) * (build === 'heavy' ? 1.1 : build === 'slim' ? .92 : 1)),
        power: +(A.power * (0.75 + tier * 0.75) * (boss ? 1.1 : 1)).toFixed(2),
        speed: +((0.8 + tier * 0.4) / A.wind).toFixed(2),
        defense: +(A.guard + A.dodge).toFixed(2), stamina: Math.round(90 + tier * 60),
      };
      const arc = ARCS[f.arc];
      f.intro = `${arc.name} · Fight ${f.fight + 1}${boss ? ' · BOSS' : ''}${f.rematch ? ' · REMATCH' : ''} — ${f.name} "${nick}" (${arch}) waits in ${arc.place}.`;
      const key = [arch, [...cmb].sort().join('+'), label, look.gear].join('|');
      if (keys.has(key)) throw new Error('duplicate fighter ' + key); keys.add(key);
      roster.push(f);
    });
  }
  return roster;
}
export const ROSTER = build();
