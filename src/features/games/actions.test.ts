import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────
//  These tests guard the single security invariant of the app:
//  the admin Supabase client bypasses RLS, so every server action
//  MUST (a) refuse when there is no signed-in user, and (b) scope
//  every query to that user's id. If either breaks, users can read
//  or delete each other's data.
// ─────────────────────────────────────────────────────────────────

// All shared mock state lives in vi.hoisted so it is initialized before
// the (hoisted) vi.mock factories run. `h.state` holds the configurable
// query results; `h.recorded` captures every chained call.
const h = vi.hoisted(() => {
  const recorded: { method: string; args: unknown[] }[] = [];
  type Result = { data: unknown; error: unknown };
  const state: { queryResult: Result; singleResult: Result } = {
    queryResult: { data: [], error: null },
    singleResult: { data: { id: "g1" }, error: null },
  };
  // Chainable Supabase stub: records each call and is awaitable.
  function makeBuilder(): Record<string, unknown> {
    const builder: Record<string, unknown> = {};
    const record =
      (method: string) =>
      (...args: unknown[]) => {
        recorded.push({ method, args });
        return builder;
      };
    for (const m of ["from", "insert", "select", "delete", "eq", "order"]) {
      builder[m] = record(m);
    }
    builder.single = () => Promise.resolve(state.singleResult);
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(state.queryResult).then(resolve);
    return builder;
  }
  return {
    recorded,
    state,
    makeBuilder,
    authMock: vi.fn(),
    adminSpy: vi.fn(() => makeBuilder()),
    // createReadClient is awaited, so it must resolve to a NON-thenable
    // client (the builder itself is thenable to support `await query`).
    // Expose a plain entry object whose .from() returns the real builder.
    readSpy: vi.fn(() =>
      Promise.resolve({
        from: (...a: unknown[]) =>
          (makeBuilder().from as (...args: unknown[]) => unknown)(...a),
      }),
    ),
  };
});

vi.mock("@clerk/nextjs/server", () => ({ auth: () => h.authMock() }));

// unstable_cache should just invoke the wrapped fn; updateTag is a noop.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
  updateTag: vi.fn(),
}));

// createGame kicks off recomputeGoals fire-and-forget — stub it.
vi.mock("@/features/goals/actions", () => ({
  recomputeGoals: vi.fn().mockResolvedValue({ success: true }),
}));

// Writes use the admin client; reads go through createReadClient. Point
// both at the same recording builder so scoping is observable either way.
vi.mock("@/supabase/admin", () => ({ createAdminClient: () => h.adminSpy() }));
vi.mock("@/supabase/read", () => ({ createReadClient: () => h.readSpy() }));

import { createGame, getGames, deleteGame } from "./actions";

const authMock = h.authMock;
const recorded = h.recorded;
const adminSpy = h.adminSpy;
const readSpy = h.readSpy;

beforeEach(() => {
  recorded.length = 0;
  h.state.queryResult = { data: [], error: null };
  h.state.singleResult = { data: { id: "g1" }, error: null };
  authMock.mockReset();
  adminSpy.mockClear();
  readSpy.mockClear();
});

describe("auth gate — no signed-in user", () => {
  beforeEach(() => authMock.mockResolvedValue({ userId: null }));

  it("getGames returns an empty list and never touches the DB", async () => {
    const games = await getGames();
    expect(games).toEqual([]);
    expect(readSpy).not.toHaveBeenCalled();
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it("createGame refuses without hitting the DB", async () => {
    const res = await createGame({
      opponent: "Magnus",
      played_at: "2026-01-15",
      platform: "Chess.com",
      result: "win",
      opening: "Sicilian Defense",
      format: "Rapid",
    });
    expect(res.success).toBe(false);
    expect(adminSpy).not.toHaveBeenCalled();
  });

  it("deleteGame refuses without hitting the DB", async () => {
    const res = await deleteGame("g1");
    expect(res.success).toBe(false);
    expect(adminSpy).not.toHaveBeenCalled();
  });
});

describe("user scoping — signed-in user", () => {
  beforeEach(() => authMock.mockResolvedValue({ userId: "user_abc" }));

  it("getGames filters by the caller's user_id", async () => {
    await getGames();
    const eqCalls = recorded.filter((r) => r.method === "eq");
    expect(eqCalls).toContainEqual({ method: "eq", args: ["user_id", "user_abc"] });
  });

  it("createGame writes rows owned by the caller", async () => {
    await createGame({
      opponent: "Magnus",
      played_at: "2026-01-15",
      platform: "Chess.com",
      result: "win",
      opening: "Sicilian Defense",
      format: "Rapid",
    });
    const insert = recorded.find((r) => r.method === "insert");
    expect(insert).toBeDefined();
    expect((insert!.args[0] as { user_id: string }).user_id).toBe("user_abc");
  });

  it("deleteGame scopes the delete to both id and user_id", async () => {
    await deleteGame("g1");
    const eqCalls = recorded.filter((r) => r.method === "eq");
    expect(eqCalls).toContainEqual({ method: "eq", args: ["id", "g1"] });
    expect(eqCalls).toContainEqual({ method: "eq", args: ["user_id", "user_abc"] });
  });

  it("createGame rejects input that fails validation before writing", async () => {
    const res = await createGame({
      opponent: "", // required, must be non-empty
      played_at: "2026-01-15",
      platform: "Chess.com",
      result: "win",
      opening: "Sicilian Defense",
      format: "Rapid",
    });
    expect(res.success).toBe(false);
    expect(recorded.find((r) => r.method === "insert")).toBeUndefined();
  });
});
