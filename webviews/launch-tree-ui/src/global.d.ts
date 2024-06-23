// global.d.ts
export {};

declare global {
  interface Window {
    jsonResponse: string; // Declaring that window has a property fileUri of type string
  }
}
