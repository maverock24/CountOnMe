
export interface DataKey {
  label: string;
  value: any;
}

const actionMusic: DataKey[] = [
    { label: 'Action: Upbeat', value: require('../assets/sounds/upbeat.mp3') },
    { label: 'Action: Bollywood', value: require('../assets/sounds/bollywood.mp3') },
    { label: 'Action: Happy Rock', value: require('../assets/sounds/happy_rock.mp3') },
    { label: 'Action: Breeze Groove', value: require('../assets/sounds/action_breeze-groove.mp3') },
    {
      label: 'Action: Children Electro Swing',
      value: require('../assets/sounds/action_children-electro-swing-2_medium.mp3'),
    },
    {
      label: 'Action: Cooking Advertisement',
      value: require('../assets/sounds/action_cooking-food-advertising.mp3'),
    },
    {
      label: 'Action: Cooking Happy Time',
      value: require('../assets/sounds/action_cooking-time-happy-cooking-food.mp3'),
    },
    { label: 'Action: Enjoy long', value: require('../assets/sounds/action_enjoy_long.mp3') },
    { label: 'Action: Fun Day', value: require('../assets/sounds/action_fun-day.mp3') },
    { label: 'Action: Funny running', value: require('../assets/sounds/action_funny-running.mp3') },
    { label: 'Action: Joyride', value: require('../assets/sounds/action_joyride-jamboree.mp3') },
    {
      label: 'Action: Sunshine Whistle',
      value: require('../assets/sounds/action_sunshine-whistle.mp3'),
    },
    { label: 'Action: Dance Music', value: require('../assets/sounds/action_the-dance-music.mp3') },
    {
      label: 'Action: Upbeat Electro Swing',
      value: require('../assets/sounds/action_upbeat_children-electro-swing.mp3'),
    },
    {
      label: 'Action: Upbeat energetic',
      value: require('../assets/sounds/action_upbeat-energetic.mp3'),
    },
    { label: 'Action: Upbeat fun', value: require('../assets/sounds/action_upbeat-fun.mp3') },
];

const chillMusic: DataKey[] = [
    { label: 'Chill: Calm down', value: require('../assets/sounds/chill.mp3') },
    { label: 'Chill: Wandering', value: require('../assets/sounds/wandering.mp3') },
    { label: 'Chill: Starlit Serenity', value: require('../assets/sounds/starlit_serenity.mp3') },
    {
      label: 'Chill: Peaceful Indian',
      value: require('../assets/sounds/peaceful_music_indian.mp3'),
    },
    { label: 'Chill: Mystical', value: require('../assets/sounds/mystical.mp3') },
    { label: 'Chill: Chill Beats', value: require('../assets/sounds/chill_beats.mp3') },
    { label: 'Chill: Breath of Life', value: require('../assets/sounds/chill_breath-of-life.mp3') },
    {
      label: 'Chill: Deep Meditation',
      value: require('../assets/sounds/chill_deep-meditation.mp3'),
    },
    { label: 'Chill: Forest Melody', value: require('../assets/sounds/chill_forest-melody.mp3') },
    { label: 'Chill: Inner Peace', value: require('../assets/sounds/chill_inner-peace.mp3') },
    {
      label: 'Chill: Relax Sleep',
      value: require('../assets/sounds/chill_meditation-relax-sleep-music.mp3'),
    },
    { label: 'Chill: Perfect Beauty', value: require('../assets/sounds/chill_perfect-beauty.mp3') },
    {
      label: 'Chill: Space Ambient',
      value: require('../assets/sounds/chill_space-ambient-music.mp3'),
    },
];

const radioMusic: DataKey[] = [
    {
      label: 'Radio: Ndr Info',
      value: 'https://www.ndr.de/resources/metadaten/audio/m3u/ndrinfo_hh.m3u',
    },
    { label: 'Radio: Hirschmilch Chillout', value: 'https://hirschmilch.de:7501/chillout.mp3' },
    { label: 'Radio: Hirschmilch Techno', value: 'https://hirschmilch.de:7501/techno.mp3' },
    { label: 'Radio: Chilltrax', value: 'https://streamssl3.chilltrax.com/listen.pls?sid=1' },
    { label: 'Radio: Frisky Chill', value: 'https://stream.chill.friskyradio.com/mp3_low' },
    { label: 'Radio: Hirschmilch Psy Trance', value: 'https://hirschmilch.de:7501/psytrance.mp3' },
    { label: 'Radio: Hirschmilch Ambient', value: 'https://hirschmilch.de:7501/ambient.mp3' },
    { label: 'Radio Moonphase', value: 'https://cp12.serverse.com/proxy/moonphase/stream' },
    {
      label: 'Radio: La Patate Douce',
      value: 'https://listen.radioking.com/radio/285742/stream/331753',
    },
    { label: 'Radio: Hunter FM LoFi', value: 'https://live.hunter.fm/lofi_normal' },
    { label: 'Radio: Ambient Sleeping Pill', value: 'https://s.stereoscenic.com/asp-h.m3u' },
    { label: 'Radio: Bagle Radio', value: 'https://ais-sa3.cdnstream1.com/2606_128.mp3' },
];

const radioChillMusic = radioMusic.filter(item => item.label.includes('Chill') || item.label.includes('LoFi') || item.label.includes('Ambient') || item.label.includes('Moonphase') || item.label.includes('Patate'));


export const workoutMusic: DataKey[] = [...actionMusic, ...chillMusic, ...radioMusic];
export const breakMusic: DataKey[] = [...chillMusic, ...radioChillMusic];

export const successSound: Array<DataKey> = [
    { label: 'Yeah', value: require('../assets/sounds/yeah.mp3') },
    { label: 'Applause', value: require('../assets/sounds/clapping.mp3') },
    { label: 'Applause Cheer', value: require('../assets/sounds/applause_cheer.mp3') },
    { label: 'Crowd Cheer', value: require('../assets/sounds/crowd_cheer.mp3') },
    { label: 'Oh Yeah', value: require('../assets/sounds/oh_yeah.mp3') },
    { label: 'Yeah Choir', value: require('../assets/sounds/yeah_choir.mp3') },
];

export const language = [
    { label: 'English', value: 'en' },
    { label: 'German', value: 'de' },
];
