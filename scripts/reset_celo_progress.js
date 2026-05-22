const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'private', 'scripts', 'state', 'celo-progress.json');
fs.mkdirSync(path.dirname(p), { recursive: true });
const state = {
  startedAt: new Date().toISOString(),
  walletsState: {},
  totalSucceeded: 0,
  totalFailed: 0,
  allGroupIds: [],
  lastShiftStartTime: Date.now(),
  isResting: false,
};
fs.writeFileSync(p, JSON.stringify(state, null, 2));
console.log('Reset state written to', p);
