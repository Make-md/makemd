/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  // tsconfig.json sets baseUrl to "src" — mirror that here so the same
  // src-relative imports work in tests.
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: { jsx: "react", esModuleInterop: true, target: "es2018" },
        diagnostics: false,
      },
    ],
  },
};
