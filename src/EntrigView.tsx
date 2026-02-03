import { requireNativeView } from 'expo';
import * as React from 'react';

import { EntrigViewProps } from './Entrig.types';

const NativeView: React.ComponentType<EntrigViewProps> =
  requireNativeView('Entrig');

export default function EntrigView(props: EntrigViewProps) {
  return <NativeView {...props} />;
}
