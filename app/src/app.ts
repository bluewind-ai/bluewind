'use strict';

import Fastify from 'fastify';
import autoLoad from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true,
});

// Pass --options via CLI arguments in command to enable these options.
const options = {};

fastify.register(autoLoad, {
  dir: join(__dirname, 'plugins'),
  options: Object.assign({}, options),
});

fastify.register(autoLoad, {
  dir: join(__dirname, 'routes'),
  options: Object.assign({}, options),
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
