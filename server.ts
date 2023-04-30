import {
  createRequestHandler,
  handleAsset,
} from '@remix-run/cloudflare-workers';
import * as build from '@remix-run/dev/server-build';
import { Env } from './env';
import { createEventHandler } from './serverEventer';

export { Counter } from './do/counter';

export default {
  fetch: createEventHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext: function (request, env: Env, ctx) {
      return {
        ...env,
      };
    },
  }),
};
