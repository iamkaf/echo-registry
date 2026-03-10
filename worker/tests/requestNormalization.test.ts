import { describe, expect, it } from "vitest";
import {
  createCompatibilityCacheKey,
  createDependencyCacheKey,
  normalizeCompatibilityInputs,
  normalizeDependencyProjects,
} from "../utils/requestNormalization";

describe("requestNormalization", () => {
  it("normalizes dependency projects without changing request order", () => {
    const normalized = normalizeDependencyProjects(["modmenu", " amber ", "modmenu"]);

    expect(normalized.requestProjects).toEqual(["modmenu", "amber", "fabric-api"]);
    expect(normalized.cacheProjects).toEqual(["amber", "fabric-api", "modmenu"]);
  });

  it("produces the same dependency cache key for reordered projects", () => {
    const a = normalizeDependencyProjects(["amber", "modmenu"]);
    const b = normalizeDependencyProjects(["modmenu", "amber", "amber"]);

    expect(createDependencyCacheKey("1.21.4", a.cacheProjects)).toBe(
      createDependencyCacheKey("1.21.4", b.cacheProjects),
    );
  });

  it("produces the same compatibility cache key for reordered inputs", () => {
    const a = normalizeCompatibilityInputs(["fabric-api", "amber"], ["1.21.4", "1.20.1"]);
    const b = normalizeCompatibilityInputs(["amber", "fabric-api", "amber"], ["1.20.1", "1.21.4"]);

    expect(createCompatibilityCacheKey(a.cacheProjects, a.cacheVersions)).toBe(
      createCompatibilityCacheKey(b.cacheProjects, b.cacheVersions),
    );
  });
});
