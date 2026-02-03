import { NativeModule, requireNativeModule } from 'expo';

import { EntrigModuleEvents, EntrigConfig, NotificationEvent } from './Entrig.types';

declare class EntrigModule extends NativeModule<EntrigModuleEvents> {
  init(config: EntrigConfig): Promise<void>;
  register(userId: string): Promise<void>;
  requestPermission(): Promise<boolean>;
  unregister(): Promise<void>;
  getInitialNotification(): Promise<NotificationEvent | null>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<EntrigModule>('Entrig');
