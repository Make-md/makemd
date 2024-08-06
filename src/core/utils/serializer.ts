import { ContextDef } from "core/types/context";
import { SelectOption } from "makemd-core";

//named serializers for converting values to string

export const serializeDefString = (def: ContextDef[]) => JSON.stringify(def);

export const serializeOptionValue = (
    newOptions: SelectOption[],
    value: Record<string, any>
  ) => {
    return JSON.stringify({
      ...value,
      options: newOptions.map((f) => ({
        name: f.name,
        value: f.value,
        color: f.color,
      })),
    });
  };