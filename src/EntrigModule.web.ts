import { registerWebModule, NativeModule } from 'expo';

import { EntrigModuleEvents, EntrigConfig, NotificationEvent } from './Entrig.types';

class EntrigModule extends NativeModule<EntrigModuleEvents> {
  async init(config: EntrigConfig): Promise<void> {
    console.warn('Entrig push notifications are not supported on web');
  }

  async register(userId: string): Promise<void> {
    console.warn('Entrig push notifications are not supported on web');
  }

  async requestPermission(): Promise<boolean> {
    console.warn('Entrig push notifications are not supported on web');
    return false;
  }

  async unregister(): Promise<void> {
    console.warn('Entrig push notifications are not supported on web');
  }

  async getInitialNotification(): Promise<NotificationEvent | null> {
    return null;
  }
}

export default registerWebModule(EntrigModule, 'EntrigModule');
