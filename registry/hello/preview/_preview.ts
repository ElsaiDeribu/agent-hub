import { createServer, IncomingMessage } from "node:http";
import { agent } from "./agent";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.url === "/chat" && req.method === "POST") {
    let body: { message?: string; history?: { role: string; content: string }[] };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    if (!body.message) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "message is required" }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    try {
      for await (const chunk of agent.stream(body.message, {
        history: body.history,
      })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (err: unknown) {
      const content = err instanceof Error ? err.message : String(err);
      res.write(`data: ${JSON.stringify({ type: "error", content })}\n\n`);
    }

    res.end();
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Agent preview server ready on :3000");
});
