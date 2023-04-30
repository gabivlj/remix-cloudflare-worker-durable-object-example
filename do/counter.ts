import { Env } from '../env';

export class Counter {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(r: Request): Promise<Response> {
    const counter = ((await this.state.storage.get('COUNTER')) as number) || 0;
    await this.state.storage.put('COUNTER', counter + 1);
    return new Response(
      JSON.stringify({
        counter,
      }),
      { status: 200 }
    );
  }
}
