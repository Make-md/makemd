import {
  coerceStringToType,
  defaultValueForType,
  deriveSchemaFromValue,
  inferCellTypeForValue,
  tryParseJSON,
} from "../properties";

describe("inferCellTypeForValue", () => {
  test("text for null/undefined/empty string", () => {
    expect(inferCellTypeForValue(null)).toBe("text");
    expect(inferCellTypeForValue(undefined)).toBe("text");
    expect(inferCellTypeForValue("")).toBe("text");
  });

  test("boolean / number / date for primitives", () => {
    expect(inferCellTypeForValue(true)).toBe("boolean");
    expect(inferCellTypeForValue(false)).toBe("boolean");
    expect(inferCellTypeForValue(42)).toBe("number");
    expect(inferCellTypeForValue("2026-04-28")).toBe("date");
    expect(inferCellTypeForValue(new Date())).toBe("date");
  });

  test("link for [[...]] strings", () => {
    expect(inferCellTypeForValue("[[notes/foo.md]]")).toBe("link");
    expect(inferCellTypeForValue("[[foo|alias]]")).toBe("link");
  });

  test("text for plain strings", () => {
    expect(inferCellTypeForValue("plain text")).toBe("text");
  });

  test("link-multi for arrays of [[link]] strings", () => {
    expect(inferCellTypeForValue(["[[a.md]]", "[[b.md]]"])).toBe("link-multi");
  });

  test("option-multi for arrays of plain strings", () => {
    expect(inferCellTypeForValue(["red", "blue"])).toBe("option-multi");
  });

  test("object-multi for arrays of objects", () => {
    expect(inferCellTypeForValue([{ a: 1 }, { a: 2 }])).toBe("object-multi");
  });

  test("object for plain objects", () => {
    expect(inferCellTypeForValue({ a: 1, b: 2 })).toBe("object");
  });
});

describe("deriveSchemaFromValue", () => {
  test("flat object with mixed primitives", () => {
    const schema = deriveSchemaFromValue({
      name: "alpha",
      active: true,
      count: 7,
      due: "2026-04-28",
    });
    expect(schema.name.type).toBe("text");
    expect(schema.active.type).toBe("boolean");
    expect(schema.count.type).toBe("number");
    expect(schema.due.type).toBe("date");
  });

  test("recurses into nested objects, populating value.type", () => {
    const schema = deriveSchemaFromValue({
      outer: {
        inner: {
          deep: true,
        },
      },
    });
    expect(schema.outer.type).toBe("object");
    expect(schema.outer.value.type.inner.type).toBe("object");
    expect(schema.outer.value.type.inner.value.type.deep.type).toBe("boolean");
  });

  test("derives sub-schema for object-multi from first item", () => {
    const schema = deriveSchemaFromValue({
      items: [{ sku: "x", qty: 1 }, { sku: "y", qty: 2 }],
    });
    expect(schema.items.type).toBe("object-multi");
    expect(schema.items.value.type.sku.type).toBe("text");
    expect(schema.items.value.type.qty.type).toBe("number");
  });

  test("link arrays infer to link-multi without nested schema", () => {
    const schema = deriveSchemaFromValue({
      refs: ["[[a.md]]", "[[b.md]]"],
    });
    expect(schema.refs.type).toBe("link-multi");
    expect(schema.refs.value).toBeUndefined();
  });
});

describe("coerceStringToType", () => {
  test("boolean coercion", () => {
    expect(coerceStringToType("true", "boolean")).toBe(true);
    expect(coerceStringToType("false", "boolean")).toBe(false);
    expect(coerceStringToType("yes", "boolean")).toBe("yes");
  });

  test("number coercion", () => {
    expect(coerceStringToType("42", "number")).toBe(42);
    expect(coerceStringToType("3.14", "number")).toBe(3.14);
    expect(coerceStringToType("", "number")).toBe("");
    expect(coerceStringToType("abc", "number")).toBe("abc");
  });

  test("non-string passes through", () => {
    expect(coerceStringToType(true, "boolean")).toBe(true);
    expect(coerceStringToType(42, "number")).toBe(42);
    expect(coerceStringToType({ a: 1 }, "object")).toEqual({ a: 1 });
  });

  test("unknown type passes through", () => {
    expect(coerceStringToType("hi", "text")).toBe("hi");
    expect(coerceStringToType("hi", "link")).toBe("hi");
  });
});

describe("tryParseJSON", () => {
  test("parses valid JSON", () => {
    expect(tryParseJSON("[1,2,3]")).toEqual([1, 2, 3]);
    expect(tryParseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(tryParseJSON('"hi"')).toBe("hi");
  });

  test("returns undefined on failure", () => {
    expect(tryParseJSON("not json")).toBeUndefined();
    expect(tryParseJSON("{")).toBeUndefined();
  });
});

describe("defaultValueForType", () => {
  test("seeds object as {} and object-multi as []", () => {
    expect(defaultValueForType("object")).toEqual({});
    expect(defaultValueForType("object-multi")).toEqual([]);
  });

  test("primitives have sensible defaults", () => {
    expect(defaultValueForType("number")).toBe(0);
    expect(defaultValueForType("boolean")).toBe(true);
    expect(typeof defaultValueForType("date")).toBe("string");
  });
});
