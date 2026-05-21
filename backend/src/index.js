'use strict';

const { app, httpServer } = require('./app');
const config = require('./config/env');
const { ping } = require('./config/db');

async function start() {
  try {
    await ping();
    console.log(`[db] terhubung ke MySQL ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (err) {
    console.warn('[db] WARNING: tidak bisa connect ke MySQL saat startup -',
      err && err.message ? err.message : err);
    console.warn('[db] Server tetap berjalan; permintaan yang butuh DB akan mengembalikan error.');
  }

  const server = httpServer.listen(config.port, () => {
    console.log(`[server] Smart Canteen API listening on port ${config.port} (env=${config.env})`);
    console.log(`[socket.io] WebSocket server siap`);
  });

  function shutdown(signal) {
    console.log(`[server] ${signal} diterima, menutup...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
