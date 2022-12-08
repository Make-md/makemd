import MakeMDPlugin from "main";

export {};

declare global {
  interface Window {
    make: MakeMDPlugin;
  }
}
