const json2csv = require('json-2-csv');
const fs = require('fs-extra');

const orderCaption = {
  PresentSync: '\\Storage',
  PresentAsync: '\\Req',
  PastSync: 'On-chain \\history',
  PastAsync: 'Off-chain \\history',
  FutureAsync: '\\Pub',
  PresentSyncCond: '\\Storage, cond.',
  PresentAsyncCond: '\\Req, cond.',
  PastSyncCond: 'On-chain \\history, cond.',
  PastAsyncCond: 'Off-chain \\history, cond.',
  FutureAsyncCond: '\\Pub, cond.'
}

/**
 * Calculate the sum of all object values whose keys start with the specified
 * start string.
 */
function sum(obj, start) {
  return Object.entries(obj)
    .filter(([key, _]) => key.startsWith(start))
    .reduce((sum, [_, value]) => sum + (value ? value : 0), 0);
}

/**
 * Return a color on the spectrum of the heatmap-palette by wistia
 * (https://github.com/wistia/heatmap-palette) based on the percentage given.
 * Output will be a pgf list literal for use in LaTeX.
 */
function cellColor(p) {
  const steps = [
    [228,255,122],
    [255,232,26],
    [255,189,0],
    [255,160,0],
    [255,127,0]
  ];

  let col;
  if (p >= 1) {
    col = steps[steps.length - 1]
  } else {
    const pos = p * (steps.length - 1);
    const i = Math.floor(pos);
    const delta = pos % 1;
    col = steps[i].map((val, j) => (val + (steps[i+1][j] - val) * delta).toFixed());
  }

  return `{rgb,255:red,${col[0]};green,${col[1]};blue,${col[2]}}`;
}

/**
 * Main generation function for the heatmaps.
 */
async function run() {
  // Load the data from a previous experiment run
  const csv = (await fs.readFile('results/cost.csv')).toString('utf8');
  const json = await json2csv.csv2jsonAsync(csv);

  // Calculate cost sums
  for (let row of json) {
    row.oracleDeploy = sum(row.gd, 'o');
    row.choiceDeploy = sum(row.gd, 'c');
    row.oracleTxs = sum(row.gt, 'o');
    row.choiceTxs = sum(row.gt, 'c');
    row.oracleTotal = row.oracleDeploy + row.oracleTxs;
    row.choiceTotal = row.choiceDeploy + row.choiceTxs;
    row.oraclePer = row.oracleTotal / row.counts.c;
    row.choicePer = row.choiceTotal / row.counts.o;
    
    row.total = row.oracleTotal + row.choiceTotal;
    row.totalPerChoice = row.total / row.counts.c;

    row.totalTxs = row.oracleTxs + row.choiceTxs;
    row.totalTxsPerChoice = row.totalTxs / row.counts.c;
  }

  // Configure the axis we want to have in the charts
  const x = 'u';
  const y = 'c';
  const z = 'totalTxsPerChoice';
  let ticksX = [];
  let ticksY = [];
  for (const row of json) {
    ticksX.push(row.counts[x]);
    ticksY.push(row.counts[y]);
  }
  ticksX = [...new Set(ticksX)].sort((a, b) => a - b);
  ticksY = [...new Set(ticksY)].sort((a, b) => a - b);

  const minZ = Math.min(...json.map(row => row[z]));
  const maxZ = Math.max(...json.map(row => row[z]));

  // Create heatmap data for each provider
  for (const name of Object.keys(orderCaption)) {

    // Get relevant rows
    const rows = json.filter(row => row.clazz == name);
    if (!rows || rows.length == 0) {
      continue;
    }

    // Create cells
    let cells = rows.map(row => {
      const cx = ticksX.indexOf(row.counts[x]);
      const cy = ticksY.indexOf(row.counts[y]);
      const cz = ((row[z] - minZ) / (maxZ - minZ)).toFixed(2);
      const color = cellColor(cz);
      return [cx, cy, cz, color];
    });

    // Create axis labels
    const lx = ticksX.slice();
    const ly = ticksY.slice();
    lx[lx.length - 1] += `\\makebox[0pt][l]{~~\\emph{${ x }}}`;
    ly[ly.length - 1] = `\\makebox[0pt][r]{\\emph{${ y }}~~}` + ly[ly.length - 1];

    // Output TikZ code on console
    console.log();
    console.log(`\\subfloat[${ orderCaption[name] }]{\\heatmap{{${
      lx.join(',')
    }}}{{${
      ly.join(',')
    }}}{{${
      cells.map(cell => cell.join('/')).join(',')
    }}}\\label{subfig:${ name }}}`);
  }

  process.exit();
}

run();
