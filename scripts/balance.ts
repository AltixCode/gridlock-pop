/**
 * Difficulty tuning harness. Prints how long runs last under a careless and a competent
 * player, so the shape weights in src/game/shapes.ts can be judged against the 2-4 minute
 * target rather than by feel.
 *
 * Run: npm run balance
 */
import {
  estimatedMinutes,
  greedyStrategy,
  measurePacing,
  randomStrategy,
  SECONDS_PER_MOVE,
  type PacingStats,
} from '../src/game/simulate';

const RUNS = Number(process.env.RUNS ?? 2000);

function report(label: string, stats: PacingStats) {
  const row = (name: string, value: string) => console.log(`  ${name.padEnd(22)} ${value}`);
  console.log(`\n${label}  (${stats.runs} runs)`);
  row('mean moves', stats.meanMoves.toFixed(1));
  row('median moves', String(stats.medianMoves));
  row('p10 / p90 moves', `${stats.p10Moves} / ${stats.p90Moves}`);
  row('median session', `${estimatedMinutes(stats.medianMoves).toFixed(1)} min`);
  row('mean session', `${estimatedMinutes(stats.meanMoves).toFixed(1)} min`);
  row('median score', String(stats.medianScore));
  row('mean lines cleared', stats.meanLines.toFixed(1));
  row('runs <= 10 moves', `${(stats.shareVeryShort * 100).toFixed(1)}%`);
  row('runs >= 300 moves', `${(stats.shareVeryLong * 100).toFixed(1)}%`);
}

console.log(`Assuming ${SECONDS_PER_MOVE}s per placement.`);
report('CARELESS player (lower bound)', measurePacing(RUNS, randomStrategy));
report('COMPETENT player (upper bound)', measurePacing(RUNS, greedyStrategy));
console.log('\nReal players sit between the two.\n');
