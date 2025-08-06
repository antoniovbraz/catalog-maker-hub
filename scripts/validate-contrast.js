import fs from 'fs';
import path from 'path';

// Read root CSS variables from index.css (default theme)
const cssPath = path.join(process.cwd(), 'src', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Extract :root block before the first theme override
const rootBlock = css.split('.corporate')[0];
const vars = {};
const varRegex = /--([\w-]+):\s*([^;]+);/g;
let match;
while ((match = varRegex.exec(rootBlock))) {
  vars[match[1]] = match[2].trim();
}

function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m].map(v => Math.round(v * 255));
}

function luminance([r, g, b]) {
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrast(c1, c2) {
  const L1 = luminance(c1);
  const L2 = luminance(c2);
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

function parseHsl(str) {
  const [h, s, l] = str.split(' ').map((v, i) => i === 0 ? parseFloat(v) : parseFloat(v));
  return hslToRgb(h, s, l);
}

const pairs = [
  { name: 'background', bg: 'background', fg: 'foreground' },
  { name: 'primary', bg: 'primary', fg: 'primary-foreground' },
  { name: 'secondary', bg: 'secondary', fg: 'secondary-foreground' },
  { name: 'destructive', bg: 'destructive', fg: 'destructive-foreground' },
  { name: 'success', bg: 'success', fg: 'success-foreground' },
  { name: 'warning', bg: 'warning', fg: 'warning-foreground' },
  { name: 'muted', bg: 'muted', fg: 'muted-foreground' },
  { name: 'accent', bg: 'accent', fg: 'accent-foreground' },
  { name: 'popover', bg: 'popover', fg: 'popover-foreground' },
  { name: 'card', bg: 'card', fg: 'card-foreground' },
  { name: 'sidebar', bg: 'sidebar-background', fg: 'sidebar-foreground' },
  { name: 'sidebar-primary', bg: 'sidebar-primary', fg: 'sidebar-primary-foreground' },
  { name: 'sidebar-accent', bg: 'sidebar-accent', fg: 'sidebar-accent-foreground' }
];

const results = pairs.map(({ name, bg, fg }) => {
  const bgHsl = vars[bg];
  const fgHsl = vars[fg];
  if (!bgHsl || !fgHsl) return { name, ratio: 'N/A' };
  const ratio = contrast(parseHsl(bgHsl), parseHsl(fgHsl));
  return { name, ratio };
});

results.forEach(r => {
  console.log(`${r.name}: ${r.ratio.toFixed ? r.ratio.toFixed(2) : r.ratio}`);
});

