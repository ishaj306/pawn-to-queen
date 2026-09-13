// Empty stand-in for `server-only` / `client-only` in unit tests. Those
// packages throw when imported outside their intended runtime; under
// Vitest (plain Node) we alias them here so server modules can be
// imported and unit-tested directly.
export {};
