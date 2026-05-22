const fs = require('fs');
const p = 'src/app/app/activity/page.tsx';
const s = fs.readFileSync(p, 'utf8');
const m = s.match(/`/g) || [];
console.log('backticks:', m.length);
console.log('length:', s.length);
console.log('sample snippet around 250-280:');
console.log(s.split('\n').slice(240, 281).join('\n'));
