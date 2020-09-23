const json2csv = require('json-2-csv');
const chartist = require('node-chartist');
const fs = require('fs-extra');

const util = require('./util.js');

/**
 * Calculate the sum of all object values whose keys start with the specified
 * start string.
 */
function sum(obj, start) {
  return Object.entries(obj)
    .filter(([key, _]) => key.startsWith(start))
    .reduce((sum, [_, value]) => sum + (value ? value : 0), 0);
}

async function run() {
  const svgPattern = new RegExp('^[\\S\\s]*?(<svg[\\S\\s]*?)>([\\S\\s]*?</svg>)[\\S\\s]*$', 'u');

  // Load the data from a previous experiment run
  const csv = (await fs.readFile('results_1600799640284.csv')).toString('utf8');
  const json = await json2csv.csv2jsonAsync(csv);

  // Legacy: split name into count values
  if (!json[0].count) {
    const pattern = new RegExp('^o([0-9]+)xc([0-9]+)xu([0-9]+)$', 'u');
    for (let row of json) {
      const result = row.name.match(pattern);
      row.counts = {
        o: parseInt(result[1]),
        c: parseInt(result[2]),
        u: parseInt(result[3]) || 100
      };
    }
  }

  // Calculate cost sums
  for (let row of json) {
    row.oracleDeploy = sum(row.gd, 'o');
    row.choiceDeploy = sum(row.gd, 'c');
    row.oracleTxs = sum(row.gt, 'o');
    row.choiceTxs = sum(row.gt, 'c');
    row.oracleTotal = row.oracleDeploy + row.oracleTxs;
    row.choiceTotal = row.choiceDeploy + row.choiceTxs;
  }

  // Configure the axis we want to have in the charts
  const x = 'u';
  const z = 'o';
  let ticksX = [];
  let ticksZ = [];
  for (const row of json) {
    ticksX.push(row.counts[x]);
    ticksZ.push(row.counts[z]);
  }
  ticksX = [...new Set(ticksX)].sort();
  ticksZ = [...new Set(ticksZ)].sort();

  // Create a chart for each provider
  for (const provider of util.getProviders()) {
    // Get relevant rows
    const rows = json.filter(row => row.clazz == provider.getContractPrefix());
    if (!rows || rows.length == 0) {
      continue;
    }

    // Create a series for each z value
    let series = [];
    for (const curZ of ticksZ) {
      let coords = [];
      for (const row of rows) {
        if (row.counts[z] == curZ) {
          coords.push({
            x: row.counts[x],
            y: row.choiceTotal / curZ
          });
        }
      }
      coords.sort((a, b) => b.x < a.x);
      series.push(coords);
    }

    // Configure the Chartist output
    const options = (Chartist) => ({
      width: 200,
      height: 200,
      lineSmooth: Chartist.Interpolation.none({
        fillHoles: true
      }),
      axisX: {
        type: Chartist.FixedScaleAxis,
        low: Math.min(...ticksX),
        high: Math.max(...ticksX),
        ticks: ticksX
      },
      axisY: {
        type: Chartist.FixedScaleAxis,
        low: 0,
        high: 5000000,
        divisor: 10
      }
    });
    const data = {
      labels: ticksX,
      series
    };
    let svg = await chartist('line', options, data);

    // Inject the CSS into the created svg, and get rid of enclosing <div> tags
    const css = (await fs.readFile('node_modules/node-chartist/dist/main.css')).toString('utf8');
    svg = svg.replace(svgPattern,
      (_, p1, p2) => p1 + ' xmlns="http://www.w3.org/2000/svg"><style type="text/css">' + css + '</style>' + p2
    );

    // Write chart to file
    await fs.outputFile('chart' + provider.getContractPrefix() + '.svg', svg);
  }

  process.exit();
}

run();
