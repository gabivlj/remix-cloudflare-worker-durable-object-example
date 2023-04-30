'use client';

import { useState } from 'react';

// Dummy component that has client code that show cases
// static javascript assets load fine
export function Repeat({ repeat }: { repeat: number }) {
  const elements = [];
  const [extra, setExtra] = useState([] as string[]);
  for (let i = 0; i < repeat; i++) {
    elements.push(<div key={i}>Repeat {i}</div>);
  }

  return (
    <>
      {[
        ...elements,
        ...extra.map((value, i) => (
          <div key={`${i}-${value}`}>
            extra: {value} {i}
          </div>
        )),
      ]}
      <button onClick={() => setExtra(prev => [...prev, 'hello'])}>Add</button>
    </>
  );
}
