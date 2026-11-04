/*
 * ─── CLAIMS TO VERIFY ───────────────────────────────────────────────────────────
 * Every word the page says about Kobra's feature bar, the Editor and their FAQ answers
 * lives in this file. They shipped in Kobra 1.0 (GitHub Release v1.0.0).
 * Edit claims here only. vite.config.ts writes them into index.html during dev and build,
 * so they are part of the static page and work without JavaScript.
 *
 * - `upcoming.show`: while true, both sections carry the `upcoming.label` badge. Use it only
 *   while the download in src/config.ts lacks the features described here. It is false
 *   because v1.0.0 contains them.
 * - `capture`: false shows the illustrated panel; true shows the real screenshot
 *   public/assets/screens/featurebar-<id>-{light,dark}-{1440,2880}.webp (see MANIFEST.md).
 * ────────────────────────────────────────────────────────────────────────────────
 */

export const upcoming = { show: false, label: 'Coming in the next update' };

export interface FeatureTab {
  id: 'watch' | 'clips' | 'convert' | 'scenes' | 'listen' | 'insights';
  tab: string;
  title: string;
  body: string;
  points: string[];
  capture: boolean;
}

export const featureBar = {
  eyebrow: 'Kobra, now with a feature bar',
  title: 'One bar.',
  titleMuted: 'Six ways in.',
  intro: 'Like the workspace tabs in Kobra Studio, a quiet bar across the top of Kobra. Everything you have today stays exactly where it is.',
  tabs: [
    {
      id: 'watch', tab: 'Watch',
      title: 'The picture comes first.',
      body: 'Home, Continue watching, My videos, the transcript and every tool you know. The Watch tab is the Kobra you already have.',
      points: ['Picture modes', 'Transcript', 'Floating player', 'Sleep timer'],
      capture: true,
    },
    {
      id: 'clips', tab: 'Clips',
      title: 'Keep the good part.',
      body: 'Make a short clip or a GIF from any video. Trim it, crop it to 9:16 or 1:1, change the speed and add a caption.',
      points: ['Clip or GIF', 'Trim', '9:16 · 1:1', 'Speed', 'Caption'],
      capture: true,
    },
    {
      id: 'convert', tab: 'Convert',
      title: 'Smaller. Same story.',
      body: 'Shrink a video so it is easy to share, switch between MP4 and WebM, or keep just the sound.',
      points: ['Smaller for sharing', 'MP4 or WebM', 'GIF', 'Sound only'],
      capture: true,
    },
    {
      id: 'scenes', tab: 'Scenes',
      title: 'Every scene at a glance.',
      body: 'Kobra finds where the scenes change and lines them up as thumbnails. Jump to one, save its frame, or turn scenes into moments.',
      points: ['Scene detection', 'Jump to a scene', 'Save frames', 'Scenes to moments'],
      capture: true,
    },
    {
      id: 'listen', tab: 'Listen',
      title: 'Just the sound.',
      body: 'An audio mode with a visualizer and an equalizer, for concerts, lectures and anything you would rather hear than watch.',
      points: ['Audio mode', 'Visualizer', 'Equalizer'],
      capture: true,
    },
    {
      id: 'insights', tab: 'Insights',
      title: 'Your watching, at a glance.',
      body: 'How much you watch, and when. Watch-time stats are counted and kept on this device. Nothing is sent anywhere.',
      points: ['Watch time', 'By day', 'Kept on this device'],
      capture: true,
    },
  ] satisfies FeatureTab[],
};

export const editor = {
  eyebrow: 'Kobra Studio · Editor',
  title: 'Cut it together.',
  titleMuted: 'Make it move.',
  intro: 'A lightweight editor in the spirit of Premiere and After Effects, inside the player you already use. Everything renders on your device.',
  steps: [
    {
      label: 'Monitors',
      title: 'Source. Program. Timeline.',
      body: 'Mark in and out in the source monitor and watch the edit in the program monitor. Clips land on a multi-track timeline: V2 overlays, V1, titles, A1 and A2 for music.',
    },
    {
      label: 'Layers',
      title: 'Stack it up.',
      body: 'Overlays sit above your footage and titles above that. Give any clip one of eight colour looks in a click, then fine-tune exposure, blur, vignette and grain.',
    },
    {
      label: 'Cut',
      title: 'Trim. Razor. Ripple.',
      body: 'Trim an edge, razor at the playhead, ripple delete the gap closed. Crossfade, dip, slide, wipe or zoom between clips.',
    },
    {
      label: 'Shape',
      title: 'Any shape. Made here.',
      body: 'Sequences in 16:9, 9:16, 1:1 or 4:5, with speed, volume and fades for every clip. Export MP4, WebM or GIF without leaving your computer.',
    },
  ],
  keyframes: {
    title: 'Make it move.',
    body: 'Keyframe position, scale, rotation and opacity, then choose how each move eases. Text layers come with animation presets.',
  },
  capabilities: [
    { title: 'Trim, razor, ripple', body: 'Precise cuts that close the gap for you.' },
    { title: 'Transitions', body: 'Crossfade, dip, slide, wipe and zoom.' },
    { title: 'Text layers', body: 'Titles with animation presets.' },
    { title: 'Keyframes', body: 'Position, scale, rotation and opacity, with easing.' },
    { title: 'Looks and effects', body: 'Colour looks, blur, vignette and grain.' },
    { title: 'Speed, volume, fades', body: 'Set for every clip on the timeline.' },
    { title: 'Four shapes', body: '16:9, 9:16, 1:1 and 4:5 sequences.' },
    { title: 'MP4, WebM, GIF', body: 'Rendered on your device. Sources never change.' },
  ],
};

export const faq = [
  {
    question: 'What is the new feature bar?',
    answer: 'A row of tabs across the top of Kobra: Watch, Clips, Convert, Scenes, Listen and Insights. Watch is the player you know. The others make clips and GIFs, convert files, find scenes, play audio with an equalizer and show watch-time stats kept on your device.',
  },
  {
    question: 'Can I edit videos in Kobra?',
    answer: 'Yes. Kobra Studio’s Editor has source and program monitors, a multi-track timeline, transitions, text layers with animation presets, keyframes with easing, colour looks and effects, and renders an MP4 on your device. Your source files are never changed.',
  },
];
