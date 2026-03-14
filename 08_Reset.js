function resetAuth() {
  var service = getXService();
  service.reset();
  Logger.log('トークンリセット完了！ 次にauthorizeX()を実行してね');
}