import { mergeObjectSchema } from "../context";

describe("mergeObjectSchema", () => {
  test("adds new keys with derived schema", () => {
    const { merged, changed } = mergeObjectSchema(
      { a: { type: "text", label: "a" } },
      { a: "hi", b: 42 },
    );
    expect(changed).toBe(true);
    expect(merged.b.type).toBe("number");
    expect(merged.a.type).toBe("text");
  });

  test("does not modify when sample brings nothing new", () => {
    const existing = {
      a: { type: "text", label: "a" },
      b: { type: "boolean", label: "b" },
    };
    const { merged, changed } = mergeObjectSchema(existing, {
      a: "hi",
      b: true,
    });
    expect(changed).toBe(false);
    expect(merged).toEqual(existing);
  });

  test("upgrades text placeholder to specific inferred type", () => {
    const { merged, changed } = mergeObjectSchema(
      { verified: { type: "text", label: "verified" } },
      { verified: true },
    );
    expect(changed).toBe(true);
    expect(merged.verified.type).toBe("boolean");
  });

  test("upgrades option-multi to link-multi when values are wikilinks", () => {
    const { merged, changed } = mergeObjectSchema(
      { refs: { type: "option-multi", label: "refs" } },
      { refs: ["[[a.md]]", "[[b.md]]"] },
    );
    expect(changed).toBe(true);
    expect(merged.refs.type).toBe("link-multi");
  });

  test("preserves explicit non-generic types", () => {
    const { merged, changed } = mergeObjectSchema(
      { count: { type: "number", label: "count" } },
      { count: "not-a-number" },
    );
    expect(changed).toBe(false);
    expect(merged.count.type).toBe("number");
  });

  test("recurses into nested object schemas, adding deeper sub-keys", () => {
    const existing = {
      outer: {
        type: "object",
        label: "outer",
        value: {
          type: { a: { type: "text", label: "a" } },
          typeName: "outer",
        },
      },
    };
    const { merged, changed } = mergeObjectSchema(existing, {
      outer: { a: "hi", b: true },
    });
    expect(changed).toBe(true);
    expect(merged.outer.value.type.b.type).toBe("boolean");
    expect(merged.outer.value.type.a.type).toBe("text");
  });

  test("recursive upgrade: nested text leaf upgrades to its specific type", () => {
    const existing = {
      outer: {
        type: "object",
        label: "outer",
        value: {
          type: { flag: { type: "text", label: "flag" } },
          typeName: "outer",
        },
      },
    };
    const { merged, changed } = mergeObjectSchema(existing, {
      outer: { flag: true },
    });
    expect(changed).toBe(true);
    expect(merged.outer.value.type.flag.type).toBe("boolean");
  });
});
