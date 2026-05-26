(() => {
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  window.MUSHROOM_BOOP_ONLINE = {
    leaderboardEndpoint: localHost ? "" : "https://idle-shroom-api-production.up.railway.app/api/leaderboard"
  };
})();
