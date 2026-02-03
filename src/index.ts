// Reexport the native module. On web, it will be resolved to EntrigModule.web.ts
// and on native platforms to EntrigModule.ts
export { default } from './EntrigModule';
export * from './Entrig.types';
