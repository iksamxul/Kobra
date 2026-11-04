import { editor, faq, featureBar, upcoming, type FeatureTab } from './content';

// Renders src/content.ts into index.html at dev and build time (see vite.config.ts), so the
// claims stay in one file while the page remains complete without JavaScript.
const esc = (text: string) => text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);
const screens = './assets/screens/';
// The Editor section is always Midnight, so it uses the dark captures.
const editorShot = (shot: string, alt: string, className: string, name = '') => `<img class="${className}"${name ? ` data-shot="${name}"` : ''} src="${screens}${shot}-dark-1440.webp" srcset="${screens}${shot}-dark-1440.webp 1440w, ${screens}${shot}-dark-2880.webp 2880w" sizes="(max-width: 760px) 92vw, min(1180px, 92vw)" width="1440" height="900" loading="lazy" decoding="async" alt="${esc(alt)}"/>`;
const film = './assets/film/';

const icons: Record<FeatureTab['id'], string> = {
  watch: '<rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M8.5 20.5h7M12 17v3.5"/><path d="m10.5 8.2 4.2 2.3-4.2 2.3Z"/>',
  clips: '<circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.6 8.3 20 16.5M8.6 15.7 20 7.5"/>',
  convert: '<path d="M4 8.5h14.5L15 5M20 15.5H5.5L9 19"/>',
  scenes: '<rect x="3" y="4" width="7.5" height="7" rx="1.6"/><rect x="13.5" y="4" width="7.5" height="7" rx="1.6"/><rect x="3" y="13" width="7.5" height="7" rx="1.6"/><rect x="13.5" y="13" width="7.5" height="7" rx="1.6"/>',
  listen: '<path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
  insights: '<path d="M3 20.5h18"/><path d="M6.5 17v-5M11 17V6.5M15.5 17v-3.5M20 17V9.5"/>',
};
const icon = (paths: string) => `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">${paths}</svg>`;
const segments = (items: string[], on: number) => `<span class="fx-seg">${items.map((item, i) => `<b${i === on ? ' class="on"' : ''}>${esc(item)}</b>`).join('')}</span>`;

// Illustrated panels: honest stand-ins built from sample films and plain UI shapes until
// the real feature-bar captures exist. Each is labeled as an illustration.
const compositions: Record<FeatureTab['id'], () => string> = {
  watch: () => `<div class="fx fx-watch"><img data-themed src="${screens}watch-light-1440.webp" srcset="${screens}watch-light-1440.webp 1440w, ${screens}watch-light-2880.webp 2880w" sizes="(max-width: 760px) 84vw, 600px" width="1440" height="900" loading="lazy" decoding="async" alt="Kobra's Watch view today: a film playing above the glass control bar"/></div>`,
  clips: () => `<div class="fx fx-clips">
    <div class="clip-frame"><img src="${film}bunny-meadow.webp" width="854" height="480" loading="lazy" decoding="async" alt=""/><div class="clip-crop"><span class="clip-caption">Not today.</span><i></i><i></i><i></i><i></i></div></div>
    <div class="clip-strip">${Array.from({ length: 8 }, (_, i) => `<span style="--i:${i};background-image:url(${film}bunny-meadow.webp)"></span>`).join('')}<b class="clip-range"><i></i><i></i></b></div>
    <div class="fx-row">${segments(['Clip', 'GIF'], 0)}${segments(['9:16', '1:1', 'Original'], 0)}<span class="fx-chip">1.5×</span></div>
  </div>`,
  convert: () => `<div class="fx fx-convert">
    <div class="cv-file"><img src="${film}flower.webp" width="960" height="540" loading="lazy" decoding="async" alt=""/><span><b>Garden walk.mp4</b><small>Ready to share</small></span><span class="cv-ring" aria-hidden="true"></span></div>
    <div class="cv-bars"><div class="cv-bar"><span>Original</span><i style="--w:1"></i></div><div class="cv-bar is-new"><span>For sharing</span><i style="--w:.3"></i></div></div>
    <div class="fx-row">${segments(['MP4', 'WebM', 'Audio only'], 0)}</div>
  </div>`,
  scenes: () => `<div class="fx fx-scenes">
    <div class="sc-grid">${['0:06', '0:15', '0:21', '0:24', '0:30', '0:39'].map((time, i) => `<figure style="--i:${i}"><img src="${film}scene-${i + 1}.webp" width="320" height="180" loading="lazy" decoding="async" alt=""/><figcaption>${time}</figcaption></figure>`).join('')}</div>
    <div class="sc-track">${[.12, .29, .4, .46, .58, .75].map(at => `<i style="--at:${at}"></i>`).join('')}<b></b></div>
    <div class="fx-row"><span class="fx-chip">Save frame</span><span class="fx-chip">Make moments</span></div>
  </div>`,
  listen: () => `<div class="fx fx-listen">
    <div class="ls-viz">${Array.from({ length: 36 }, (_, i) => `<i style="--i:${i};--h:${(.25 + .75 * Math.abs(Math.sin(i * 1.7) * Math.sin(i * .37 + 1))).toFixed(2)}"></i>`).join('')}</div>
    <div class="ls-now"><b>Sintel</b><small>Audio mode</small></div>
    <div class="ls-eq">${[['60', .62], ['250', .5], ['1k', .42], ['4k', .58], ['8k', .66], ['16k', .48]].map(([band, value], i) => `<span style="--v:${value};--i:${i}"><i></i><small>${band}</small></span>`).join('')}</div>
  </div>`,
  insights: () => `<div class="fx fx-insights">
    <div class="in-head"><b>This week</b><small>Kept on this device</small></div>
    <div class="in-chart">${[['M', .35], ['T', .2], ['W', .55], ['T', .4], ['F', .8], ['S', 1], ['S', .7]].map(([day, value], i) => `<span style="--h:${value};--i:${i}"><i></i><small>${day}</small></span>`).join('')}</div>
    <div class="in-tiles"><span><small>Most watched</small><b>Sintel</b></span><span><small>Finished</small><b>3 videos</b></span></div>
  </div>`,
};

const capture = (tab: FeatureTab) => `<img data-themed src="${screens}featurebar-${tab.id}-light-1440.webp" srcset="${screens}featurebar-${tab.id}-light-1440.webp 1440w, ${screens}featurebar-${tab.id}-light-2880.webp 2880w" sizes="(max-width: 760px) 84vw, 600px" width="1440" height="900" loading="lazy" decoding="async" alt="Kobra's ${esc(tab.tab)} tab"/>`;

const badge = () => upcoming.show ? `<span class="badge">${esc(upcoming.label)}</span>` : '';

function featureBarHtml() {
  const tabs = featureBar.tabs;
  return `<div class="wrap features-head">
      <p class="eyebrow">${esc(featureBar.eyebrow)}</p>${badge()}
      <h2 id="features-title">${esc(featureBar.title)}<br/> <span>${esc(featureBar.titleMuted)}</span></h2>
      <p class="section-description">${esc(featureBar.intro)}</p>
      <nav class="fb-tabs segmented" aria-label="Kobra's feature bar"><span class="seg-thumb" aria-hidden="true"></span>${tabs.map((tab, i) => `<a href="#fb-${tab.id}" data-fb="${i}"${i === 0 ? ' aria-current="true"' : ''}>${icon(icons[tab.id])}<span>${esc(tab.tab)}</span></a>`).join('')}</nav>
    </div>
    <div class="fb-viewport">
      <ol class="fb-track">${tabs.map((tab, i) => `
        <li class="fb-panel${i === 0 ? ' is-active' : ''}" id="fb-${tab.id}" data-index="${i}">
          <article class="fb-card" aria-labelledby="fb-${tab.id}-title">
            <div class="fb-copy">
              <span class="fb-label">${icon(icons[tab.id])}${esc(tab.tab)}</span>
              <h3 id="fb-${tab.id}-title">${esc(tab.title)}</h3>
              <p>${esc(tab.body)}</p>
              <ul class="fb-points">${tab.points.map(point => `<li>${esc(point)}</li>`).join('')}</ul>
            </div>
            <div class="fb-visual">${tab.capture ? capture(tab) : `${compositions[tab.id]()}<span class="fx-note">${tab.id === 'watch' ? 'Watch today' : 'Illustration'}</span>`}</div>
          </article>
        </li>`).join('')}
      </ol>
    </div>
    <div class="fb-progress wrap" aria-hidden="true"><i></i></div>`;
}

const capabilityIcons = [
  '<path d="M6 4v16M18 4v16"/><path d="m9 12 6 0M12 9l3 3-3 3"/>',
  '<rect x="3" y="6" width="9" height="12" rx="2"/><rect x="12" y="6" width="9" height="12" rx="2" opacity=".45"/>',
  '<path d="M5 6h14M12 6v13M9 19h6"/>',
  '<path d="m12 4 3 8-3 8-3-8Z"/><path d="M3 12h3M18 12h3"/>',
  '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/>',
  '<path d="M4 15c3 0 3-6 6-6s3 6 6 6 3-4 4-4"/>',
  '<rect x="3" y="7" width="10" height="7" rx="1.5"/><rect x="15" y="4" width="6" height="11" rx="1.5"/><rect x="9" y="16" width="5" height="5" rx="1.2"/>',
  '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
];

export function renderContent(slot: string): string {
  switch (slot) {
    case 'feature-bar': return featureBarHtml();
    case 'editor-head': return `<p class="eyebrow">${esc(editor.eyebrow)}</p>${badge()}
        <h2 id="editor-title">${esc(editor.title)}<br/> <span>${esc(editor.titleMuted)}</span></h2>
        <p class="section-description">${esc(editor.intro)}</p>`;
    case 'editor-steps': return editor.steps.map((step, i) => `<li class="ed-step${i === 0 ? ' is-active' : ''}" data-step="${i}">${editorShot(step.shot, step.alt, 'ed-step-shot')}<span class="step-index">0${i + 1} · ${esc(step.label)}</span><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p></li>`).join('');
    case 'editor-shots': return [...editor.steps.map(step => [step.shot, step.alt]), ['editor-export', 'The Export sheet: MP4, WebM or GIF, rendered on this computer']].map(([shot, alt], i) => editorShot(shot, alt, `ed-shot${i === 0 ? ' is-active' : ''}`, shot)).join('');
    case 'keyframes-copy': return `<h3 id="kf-title">${esc(editor.keyframes.title)}</h3><p>${esc(editor.keyframes.body)}</p>`;
    case 'editor-capabilities': return editor.capabilities.map((item, i) => `<li class="reveal" style="--d:${i % 4}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${capabilityIcons[i] || ''}</svg><h4>${esc(item.title)}</h4><p>${esc(item.body)}</p></li>`).join('');
    case 'faq-upcoming': return faq.map(item => `<details><summary>${esc(item.question)}<span aria-hidden="true">+</span></summary><p>${esc(item.answer)}</p></details>`).join('');
    default: throw new Error(`Unknown content slot: ${slot}`);
  }
}
