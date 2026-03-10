import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchAllDependencies = vi.fn();
const checkLoadersForProjects = vi.fn();
const fetchMinecraftVersions = vi.fn();

vi.mock("../services/dependencyService", () => ({
  DependencyService: class {
    fetchAllDependencies = fetchAllDependencies;
    checkLoadersForProjects = checkLoadersForProjects;
  },
}));

vi.mock("../services/minecraftService", () => ({
  MinecraftService: class {
    fetchMinecraftVersions = fetchMinecraftVersions;
  },
}));

import app from "../index";

function createCacheStub() {
  const store = new Map<string, Response>();

  return {
    default: {
      match: vi.fn(async (request: Request) => store.get(request.url)?.clone() ?? null),
      put: vi.fn(async (request: Request, response: Response) => {
        store.set(request.url, response.clone());
      }),
    },
    store,
  };
}

function createExecutionContext(): ExecutionContext & { flush: () => Promise<void> } {
  const pending: Promise<unknown>[] = [];

  return {
    props: {},
    passThroughOnException: () => {},
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
    flush: async () => {
      await Promise.all(pending.splice(0));
    },
  };
}

const env = {
  CACHE_TTL_DEPENDENCIES: "1800",
  CACHE_TTL_MINECRAFT: "43200",
  CACHE_TTL_COMPATIBILITY: "1800",
};

beforeEach(() => {
  fetchAllDependencies.mockReset();
  checkLoadersForProjects.mockReset();
  fetchMinecraftVersions.mockReset();

  const cacheStub = createCacheStub();
  Object.assign(globalThis, {
    caches: cacheStub,
  });
});

describe("worker response caching", () => {
  it("serves cached dependency responses for equivalent project orderings", async () => {
    fetchAllDependencies.mockResolvedValue([
      {
        name: "amber",
        loader: "universal",
        version: "1.0.0",
        mc_version: "1.21.4",
        source_url: "https://modrinth.com/mod/amber",
      },
    ]);

    const firstCtx = createExecutionContext();
    const firstResponse = await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=modmenu,amber"),
      env,
      firstCtx,
    );

    expect(firstResponse.status).toBe(200);
    await firstCtx.flush();
    expect(fetchAllDependencies).toHaveBeenCalledTimes(1);

    const secondCtx = createExecutionContext();
    const secondResponse = await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=amber,modmenu"),
      env,
      secondCtx,
    );

    expect(secondResponse.status).toBe(200);
    expect(fetchAllDependencies).toHaveBeenCalledTimes(1);
  });

  it("bypasses and refreshes the dependency cache when X-Echo-Refresh is set", async () => {
    fetchAllDependencies
      .mockResolvedValueOnce([
        {
          name: "amber",
          loader: "universal",
          version: "1.0.0",
          mc_version: "1.21.4",
          source_url: "https://modrinth.com/mod/amber",
        },
      ])
      .mockResolvedValueOnce([
        {
          name: "amber",
          loader: "universal",
          version: "2.0.0",
          mc_version: "1.21.4",
          source_url: "https://modrinth.com/mod/amber",
        },
      ]);

    const firstCtx = createExecutionContext();
    await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=amber"),
      env,
      firstCtx,
    );
    await firstCtx.flush();

    const refreshCtx = createExecutionContext();
    const refreshResponse = await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=amber", {
        headers: { "X-Echo-Refresh": "1" },
      }),
      env,
      refreshCtx,
    );
    await refreshCtx.flush();

    const refreshJson = (await refreshResponse.json()) as {
      data: { dependencies: Array<{ version: string | null }> };
    };
    expect(refreshJson.data.dependencies[0].version).toBe("2.0.0");
    expect(fetchAllDependencies).toHaveBeenCalledTimes(2);

    const finalCtx = createExecutionContext();
    const finalResponse = await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=amber"),
      env,
      finalCtx,
    );
    const finalJson = (await finalResponse.json()) as {
      data: { dependencies: Array<{ version: string | null }> };
    };
    expect(finalJson.data.dependencies[0].version).toBe("2.0.0");
    expect(fetchAllDependencies).toHaveBeenCalledTimes(2);
  });

  it("returns 200 for invalid custom projects and surfaces failed dependency entries", async () => {
    fetchAllDependencies.mockResolvedValue([
      {
        name: "bad-project",
        loader: "universal",
        version: null,
        mc_version: "1.21.4",
        source_url: "https://modrinth.com/mod/bad-project",
        notes: "Failed to fetch: Error: No bad-project versions available",
      },
    ]);

    const ctx = createExecutionContext();
    const response = await app.fetch(
      new Request("http://localhost/api/versions/dependencies/1.21.4?projects=bad-project"),
      env,
      ctx,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: { dependencies: Array<{ name: string; version: string | null; notes?: string }> };
    };
    expect(json.data.dependencies[0].name).toBe("bad-project");
    expect(json.data.dependencies[0].version).toBeNull();
    expect(json.data.dependencies[0].notes).toContain("Failed to fetch");
  });

  it("serves cached compatibility responses for equivalent ordering", async () => {
    checkLoadersForProjects.mockResolvedValue({
      amber: {
        "1.21.4": { forge: "1.0.0", neoforge: "1.0.0", fabric: "1.0.0" },
      },
    });

    const firstCtx = createExecutionContext();
    await app.fetch(
      new Request(
        "http://localhost/api/projects/compatibility?projects=fabric-api,amber&versions=1.21.4,1.20.1",
      ),
      env,
      firstCtx,
    );
    await firstCtx.flush();

    const secondCtx = createExecutionContext();
    const response = await app.fetch(
      new Request(
        "http://localhost/api/projects/compatibility?projects=amber,fabric-api&versions=1.20.1,1.21.4",
      ),
      env,
      secondCtx,
    );

    expect(response.status).toBe(200);
    expect(checkLoadersForProjects).toHaveBeenCalledTimes(1);
  });

  it("serves cached Minecraft version responses", async () => {
    fetchMinecraftVersions.mockResolvedValue([
      { id: "1.21.4", version_type: "release" },
      { id: "25w10a", version_type: "snapshot" },
    ]);

    const firstCtx = createExecutionContext();
    await app.fetch(new Request("http://localhost/api/versions/minecraft"), env, firstCtx);
    await firstCtx.flush();

    const secondCtx = createExecutionContext();
    const response = await app.fetch(
      new Request("http://localhost/api/versions/minecraft"),
      env,
      secondCtx,
    );

    expect(response.status).toBe(200);
    expect(fetchMinecraftVersions).toHaveBeenCalledTimes(1);
  });
});
