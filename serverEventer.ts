/**
 * Adaptation from https://github.com/remix-run/remix/pull/4676 to
 *  use Remix in Workers with any kind of binding you want
 */

import type { Options as KvAssetHandlerOptions } from '@cloudflare/kv-asset-handler';
import {
  getAssetFromKV,
  MethodNotAllowedError,
  NotFoundError,
} from '@cloudflare/kv-asset-handler';
import type { AppLoadContext, ServerBuild } from '@remix-run/cloudflare';
import { createRequestHandler as createRemixRequestHandler } from '@remix-run/cloudflare';
import moduleJSON from '__STATIC_CONTENT_MANIFEST';

type AssetManifest = Omit<KvAssetHandlerOptions['ASSET_MANIFEST'], string>;
type KvAssetHandlerEvent = Parameters<typeof getAssetFromKV>[0];
type WaitUntilCallback = KvAssetHandlerEvent['waitUntil'];

const module = JSON.parse(moduleJSON) as AssetManifest;

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction<Env = unknown> = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => AppLoadContext;

export type RequestHandler = ReturnType<typeof createRequestHandler>;

/**
 * Returns a request handler for the Cloudflare runtime that serves the
 * Remix SSR response.
 */
export function createRequestHandler<Env = unknown>({
  build,
  getLoadContext,
  mode,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction<Env>;
  mode?: string;
}) {
  let handleRequest = createRemixRequestHandler(build, mode);

  return (request: Request, env: Env, ctx: ExecutionContext) => {
    let loadContext = getLoadContext?.(request, env, ctx);

    return handleRequest(request, loadContext);
  };
}

export async function handleAsset(
  request: Request,
  waitUntil: WaitUntilCallback,
  assetNamespace: KVNamespace<string>,
  build: ServerBuild,
  options?: Partial<KvAssetHandlerOptions>
) {
  try {
    let mergedOptions = {
      ASSET_NAMESPACE: assetNamespace,
      ASSET_MANIFEST: module,
      ...options,
    };

    return await getAssetFromKV({ request, waitUntil } as FetchEvent, {
      cacheControl: {
        // for some reason, Worker keeps crashing if this is not set
        bypassCache: true,
      },
      ...mergedOptions,
    });
  } catch (error) {
    if (
      error instanceof MethodNotAllowedError ||
      error instanceof NotFoundError
    ) {
      return null;
    }

    throw error;
  }
}

export function createEventHandler<Env = unknown>({
  build,
  getLoadContext,
  mode,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction<Env>;
  mode?: string;
}): ExportedHandlerFetchHandler<
  Env & { __STATIC_CONTENT: KVNamespace<string> }
> {
  let handleRequest = createRequestHandler({
    build,
    getLoadContext,
    mode,
  });

  let handleEvent = async (
    request: Request,
    env: Env & { __STATIC_CONTENT: KVNamespace<string> },
    ctx: ExecutionContext
  ) => {
    let response = await handleAsset(
      request,
      ctx.waitUntil,
      env.__STATIC_CONTENT,
      build
    );

    if (!response) {
      response = await handleRequest(request, env, ctx);
    }

    return response;
  };

  return (
    request: Request,
    env: Env & { __STATIC_CONTENT: KVNamespace<string> },
    ctx: ExecutionContext
  ) => {
    try {
      return handleEvent(request, env, ctx);
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') {
        return new Response(e.message || e.toString(), {
          status: 500,
        });
      }

      return new Response('Internal Error', { status: 500 });
    }
  };
}
