'use strict';

const { env } = require('../config/env');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function stamp() {
  return new Date().toISOString();
}

function write(level, color, args) {
  const text = args
    .map((a) =>
      typeof a === 'string' ? a : a instanceof Error ? a.stack || a.message : JSON.stringify(a),
    )
    .join(' ');
  // eslint-disable-next-line no-console
  console.log(`${COLORS[color]}${stamp()} ${level.toUpperCase().padEnd(5)}${COLORS.reset} ${text}`);
}

const logger = {
  info: (...args) => write('info', 'green', args),
  warn: (...args) => write('warn', 'yellow', args),
  error: (...args) => write('error', 'red', args),
  debug: (...args) => {
    if (!env.IS_PROD) write('debug', 'cyan', args);
  },
  /** morgan target - keeps access logs out of the leveled logger */
  stream: {
    write: (msg) => process.stdout.write(`${msg.trim()}\n`),
  },
};

module.exports = logger;
