// ─────────────────────────────────────────────────────────────
//  Cache-tag helpers for unstable_cache + revalidateTag.
//
//  Pattern:
//    - Reads are wrapped in unstable_cache keyed by [resource, userId]
//      and tagged with userTag(userId, resource).
//    - Writes call revalidateTag(userTag(userId, resource)) to bust just
//      that user's slice of cache.
//
//  Two scopes:
//    userTag      — only invalidates the listed user
//    globalTag    — invalidates all users (rarely needed)
// ─────────────────────────────────────────────────────────────

export type Resource =
  | "profile"
  | "ratings"
  | "games"
  | "puzzles"
  | "goals"
  | "journal"
  | "study"
  | "achievements";

export function userTag(userId: string, resource: Resource): string {
  return `u:${userId}:${resource}`;
}

// All tags for a single user — used after profile delete / mass writes.
export function allUserTags(userId: string): string[] {
  const resources: Resource[] = [
    "profile", "ratings", "games", "puzzles",
    "goals", "journal", "study", "achievements",
  ];
  return resources.map((r) => userTag(userId, r));
}
