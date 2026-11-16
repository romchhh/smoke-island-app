#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import net from 'node:net';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'backend/package.json'));
const mongoose = require('mongoose');
const dataDir = path.join(root, '.data');
const mongoDir = path.join(dataDir, 'mongo');
fs.mkdirSync(mongoDir, { recursive: true });

function waitPort(port, host = '127.0.0.1', tries = 40) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const socket = net.connect({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (++n >= tries) reject(new Error(`Port ${port} not ready`));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

async function ensureMongo() {
  try {
    await waitPort(27017, '127.0.0.1', 2);
    console.log('MongoDB already listening on 27017');
  } catch {
    console.log('Starting local MongoDB replica set…');
    const child = spawn(
      'mongod',
      [
        '--dbpath', mongoDir,
        '--replSet', 'rs0',
        '--bind_ip', '127.0.0.1',
        '--port', '27017',
        '--logpath', path.join(dataDir, 'mongod.log'),
        '--fork',
      ],
      { stdio: 'inherit', cwd: root }
    );
    await new Promise((resolve, reject) => {
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`mongod exit ${code}`))));
    });
    await waitPort(27017);
  }

  await mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true');
  const admin = mongoose.connection.db.admin();
  try {
    await admin.command({ replSetGetStatus: 1 });
  } catch {
    console.log('Initiating replica set rs0…');
    await admin.command({
      replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] },
    });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const status = await admin.command({ replSetGetStatus: 1 });
        if (status.members?.[0]?.stateStr === 'PRIMARY') break;
      } catch {}
    }
  }
  await mongoose.disconnect();
}

function run(command, args, name, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    if (signal) console.error(`${name} stopped by ${signal}`);
    else if (code) console.error(`${name} exited with ${code}`);
  });
  return child;
}

await ensureMongo();
const apiPort = Number(process.env.API_PORT || 3010);
const webPort = Number(process.env.WEB_PORT || 8765);
const apiEnv = { ...process.env, PORT: String(apiPort) };
const webEnv = {
  ...process.env,
  PORT: String(webPort),
  API_ORIGIN: `http://127.0.0.1:${apiPort}`,
};
const api = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
  env: apiEnv,
});
api.on('exit', (code, signal) => {
  if (signal) console.error(`API stopped by ${signal}`);
  else if (code) console.error(`API exited with ${code}`);
});
await waitPort(apiPort);
const web = spawn(process.execPath, ['scripts/dev-static.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: webEnv,
});
web.on('exit', (code, signal) => {
  if (signal) console.error(`WEB stopped by ${signal}`);
  else if (code) console.error(`WEB exited with ${code}`);
});
await waitPort(webPort);

console.log('\nSmoke Island ready');
console.log(`  Storefront  http://127.0.0.1:${webPort}`);
console.log(`  API health  http://127.0.0.1:${apiPort}/api/health\n`);

const stop = () => {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
