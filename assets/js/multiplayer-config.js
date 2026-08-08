window.K417_MULTIPLAYER_CONFIG = Object.freeze({
  // 部署 cloudflare-multiplayer 后，把下方地址改成 wrangler deploy 输出的 workers.dev 地址。
  // 例如：https://hongye-multiplayer.<你的子域>.workers.dev
  serverUrl: 'https://hongye-multiplayer.2936705959.workers.dev',
  maxPlayers: 3,
  protocolVersion: 1,
  reconnectDelay: 2200
});
