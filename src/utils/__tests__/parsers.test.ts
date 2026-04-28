import { parseProperty } from "../parsers";

describe("parseProperty - object case", () => {
  test("serializes a flat object as JSON", () => {
    const result = parseProperty("settings", { a: 1, b: "two" }, "object");
    expect(JSON.parse(result)).toEqual({ a: 1, b: "two" });
  });

  test("recurses through nested objects without double-stringifying", () => {
    const result = parseProperty(
      "settings",
      { outer: { inner: { deep: true } } },
      "object",
    );
    const parsed = JSON.parse(result);
    expect(parsed.outer.inner.deep).toBe(true);
  });

  test("collapses {path: x} link shapes to the path string", () => {
    const result = parseProperty(
      "ref",
      { path: "notes/foo.md" } as any,
      "object",
    );
    // Single-key {path} → returns the path string itself, not a JSON object.
    expect(result).toBe("notes/foo.md");
  });

  test("formats Date values inside object as yyyy-MM-dd", () => {
    const result = parseProperty(
      "settings",
      { when: new Date("2026-04-28T00:00:00Z") },
      "object",
    );
    const parsed = JSON.parse(result);
    expect(parsed.when).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("handles arrays of objects", () => {
    const result = parseProperty(
      "items",
      [{ a: 1 }, { a: 2 }],
      "object-multi",
    );
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([{ a: 1 }, { a: 2 }]);
  });
});

describe("parseProperty - text/tag/option/image fallback for object values", () => {
  test("text-typed object value gets stringified to avoid [object Object]", () => {
    const result = parseProperty(
      "field",
      { a: 1 } as any,
      "text",
    );
    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  test("text-typed primitive passes through unchanged", () => {
    expect(parseProperty("field", "hello", "text")).toBe("hello");
  });
});
