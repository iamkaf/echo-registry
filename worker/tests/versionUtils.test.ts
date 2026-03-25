import { describe, expect, it } from "vitest";
import { extractMinorVersion, matchesVersionPrefix } from "../utils/versionUtils";

describe("versionUtils", () => {
  it("extracts the expected NeoForge prefix from legacy Minecraft versions", () => {
    expect(extractMinorVersion("1.21.4")).toBe("21.4");
    expect(extractMinorVersion("1.21")).toBe("21");
  });

  it("extracts the expected NeoForge prefix from modern Minecraft versions", () => {
    expect(extractMinorVersion("26.1")).toBe("26.1");
    expect(extractMinorVersion("26.1.3")).toBe("26.1");
  });

  it("matches the available NeoForge beta for Minecraft 26.1", () => {
    const prefix = extractMinorVersion("26.1");

    expect(matchesVersionPrefix(prefix, "26.1.0.1-beta")).toBe(true);
    expect(matchesVersionPrefix(prefix, "21.11.40-beta")).toBe(false);
  });
});
