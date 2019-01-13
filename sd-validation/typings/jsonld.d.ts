declare module 'jsonld' {
  interface expansionCallbackType { (error: string, result: Object): void }

  export function expand(
    input: Object,
    configuration: Object,
    callback: expansionCallbackType
  ): void;
}
