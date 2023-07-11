import { ContextLookup } from "types/context";

export const parsePropString = (str: string): ContextLookup =>
  {
    const [p1, p2] = str?.match(/(\\.|[^.])+/g) ?? []
    if (p2) return {
      field: p1, property: p2
    }
    return {field: 'File', property: p1}

  }