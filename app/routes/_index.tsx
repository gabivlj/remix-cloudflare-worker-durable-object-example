import type { LoaderArgs, V2_MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { json } from 'react-router';
import { Repeat } from '../components/repeat';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }];
};

export const loader = async ({ context }: LoaderArgs): Promise<Response> => {
  const counter = context.COUNTER as DurableObjectNamespace;
  try {
    const response = await counter
      .get(counter.idFromName('counter'))
      .fetch('http://ws', {
        body: JSON.stringify('{"hello": "world"}'),
        method: 'POST',
      });

    return json(await response.json());
  } catch (err) {
    return json({ error: err });
  }
};

type ResponseBody = { counter: number } | { error: unknown };

function hasError(response: ResponseBody): response is { error: unknown } {
  return (response as { error: unknown }).error != null;
}

export default function Index() {
  const response = useLoaderData<typeof loader>() as ResponseBody;
  if (hasError(response)) {
    console.error(response.error);
    return <h1>There has been an error :(</h1>;
  }

  const { counter } = response;
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Counter: {counter}</h1>
      <Repeat repeat={counter}></Repeat>
    </div>
  );
}
