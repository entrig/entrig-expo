import { registerWebModule, NativeModule } from 'expo';

import { EntrigModuleEvents } from './Entrig.types';

class EntrigModule extends NativeModule<EntrigModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(EntrigModule, 'EntrigModule');
