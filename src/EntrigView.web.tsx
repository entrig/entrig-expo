import * as React from 'react';

import { EntrigViewProps } from './Entrig.types';

export default function EntrigView(props: EntrigViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
