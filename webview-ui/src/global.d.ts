// global.d.ts
export {};

declare global {
  interface Window {
    fileUri: string; // Declaring that window has a property fileUri of type string
  }
}
