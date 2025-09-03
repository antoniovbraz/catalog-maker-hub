import { readFile } from 'node:fs/promises';

async function verifyCoverage() {
  try {
    const data = await readFile('coverage/coverage-summary.json', 'utf8');
    const summary = JSON.parse(data);
    const pct = summary.total.lines.pct;
    const threshold = 90;

    if (pct < threshold) {
      console.error(`Coverage ${pct}% is below ${threshold}%`);
      process.exit(1);
    }

    console.log(`Coverage ${pct}% meets threshold ${threshold}%`);
  } catch (error) {
    console.error('Failed to verify coverage:', error);
    process.exit(1);
  }
}

verifyCoverage();
