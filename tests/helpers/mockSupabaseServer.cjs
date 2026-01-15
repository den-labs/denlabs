const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { URL } = require("node:url");

const PORT = Number(process.env.MOCK_SUPABASE_PORT || 54321);
const MOCK_USER_ID = "test-user-id";

const mockProfile = {
  id: MOCK_USER_ID,
  handle: "playwright",
  display_name: "Playwright User",
  role: "player",
  wallet_address: "0x00000000000000000000000000000000000000aa",
  self_verified: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const jsonHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
};

const sprays = [];
const sprayEvents = [];

const readRequestBody = (req) =>
  new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
  });

const respondWithPayload = (res, accept, payload) => {
  const wantsSingle = accept.includes("application/vnd.pgrst.object+json");
  const data = wantsSingle ? (payload[0] ?? null) : payload;
  res.writeHead(200, {
    ...jsonHeaders,
    "content-range": `0-${Math.max(0, payload.length - 1)}/${payload.length}`,
  });
  res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (reqUrl.pathname === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (reqUrl.pathname === "/rest/v1/lab_users") {
    const accept = req.headers.accept || "";
    const idParam = reqUrl.searchParams.get("id");
    const isSingle = accept.includes("application/vnd.pgrst.object+json");
    const isMatch = idParam === `eq.${MOCK_USER_ID}`;

    if (!isMatch && isSingle) {
      res.writeHead(406, jsonHeaders);
      res.end(JSON.stringify({ message: "No rows found" }));
      return;
    }

    const payload = isSingle ? mockProfile : [mockProfile];
    res.writeHead(200, {
      ...jsonHeaders,
      "content-range": "0-0/1",
    });
    res.end(JSON.stringify(payload));
    return;
  }

  if (reqUrl.pathname === "/rest/v1/sprays") {
    const accept = req.headers.accept || "";
    const idParam = reqUrl.searchParams.get("id");
    const isSingle = accept.includes("application/vnd.pgrst.object+json");
    const idMatch = idParam?.startsWith("eq.") ? idParam.slice(3) : null;

    if (req.method === "POST") {
      const body = await readRequestBody(req);
      const payload = Array.isArray(body) ? body : body ? [body] : [];
      const now = new Date().toISOString();
      const created = payload.map((entry) => {
        const spray = {
          id: entry.id ?? randomUUID(),
          lab_user_id: entry.lab_user_id ?? MOCK_USER_ID,
          wallet_address: entry.wallet_address ?? mockProfile.wallet_address,
          status: entry.status ?? "draft",
          metadata: entry.metadata ?? {},
          created_at: now,
          updated_at: now,
        };
        sprays.push(spray);
        return spray;
      });
      respondWithPayload(res, accept, created);
      return;
    }

    if (req.method === "PATCH") {
      const body = await readRequestBody(req);
      const spray = sprays.find((entry) => entry.id === idMatch);
      if (!spray && isSingle) {
        res.writeHead(406, jsonHeaders);
        res.end(JSON.stringify({ message: "No rows found" }));
        return;
      }
      if (spray && body && typeof body === "object") {
        Object.assign(spray, body);
        spray.updated_at = new Date().toISOString();
      }
      respondWithPayload(res, accept, spray ? [spray] : []);
      return;
    }

    if (req.method === "GET") {
      const result = idMatch
        ? sprays.filter((entry) => entry.id === idMatch)
        : sprays;

      if (isSingle && result.length === 0) {
        res.writeHead(406, jsonHeaders);
        res.end(JSON.stringify({ message: "No rows found" }));
        return;
      }

      respondWithPayload(res, accept, result);
      return;
    }
  }

  if (reqUrl.pathname === "/rest/v1/spray_events") {
    const accept = req.headers.accept || "";
    const sprayIdParam = reqUrl.searchParams.get("spray_id");
    const orderParam = reqUrl.searchParams.get("order");
    const limitParam = reqUrl.searchParams.get("limit");
    const sprayIdMatch = sprayIdParam?.startsWith("eq.")
      ? sprayIdParam.slice(3)
      : null;

    if (req.method === "POST") {
      const body = await readRequestBody(req);
      const payload = Array.isArray(body) ? body : body ? [body] : [];
      const now = new Date().toISOString();
      const created = payload.map((entry) => {
        const event = {
          id: entry.id ?? randomUUID(),
          spray_id: entry.spray_id ?? sprayIdMatch ?? "",
          event_type: entry.event_type ?? "unknown",
          metadata: entry.metadata ?? {},
          created_at: now,
        };
        sprayEvents.push(event);
        return event;
      });
      respondWithPayload(res, accept, created);
      return;
    }

    if (req.method === "GET") {
      let result = sprayIdMatch
        ? sprayEvents.filter((entry) => entry.spray_id === sprayIdMatch)
        : sprayEvents;
      if (orderParam === "created_at.desc") {
        result = [...result].sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        );
      }
      if (limitParam) {
        const limit = Number(limitParam);
        if (Number.isFinite(limit)) {
          result = result.slice(0, Math.max(0, limit));
        }
      }
      respondWithPayload(res, accept, result);
      return;
    }
  }

  res.writeHead(404, jsonHeaders);
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-supabase] listening on http://127.0.0.1:${PORT}`);
});
