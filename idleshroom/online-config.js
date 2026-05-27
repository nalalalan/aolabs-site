(() => {
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  window.IDLE_SHROOM_ONLINE = {
    leaderboardEndpoint: localHost ? "" : "https://idle-shroom-api-production.up.railway.app/api/leaderboard"
  };
  window.MUSHROOM_BOOP_ONLINE = window.IDLE_SHROOM_ONLINE;
})();
