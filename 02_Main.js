
// === 毎日自動実行のメイン関数 ===
function dailyPokeSleepBot() {
  const summary = generatePokeSleepSummary();

  Logger.log('=== summary length === ' + (summary ? summary.length : 0));
  Logger.log('=== summary head ===\n' + (summary ? summary.slice(0, 200) : '(null)'));

  if (!summary || !summary.trim()) return;
  if (summary.includes('エラー')) return;

  postToXAsThread(summary);
}
