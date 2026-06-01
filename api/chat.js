const SIM_API_KEY = "sk-sim-uomNsK1G1ZYnFy9HUOZrPPzYHaPlIBE4";
const WORKFLOW_ID = "226b0f12-d645-4051-8f3a-288a8e706cee";
const SIM_URL = `https://sim.ai/api/workflows/${WORKFLOW_ID}/execute`;

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
  }

  const payload = await req.json();
  if (!payload.messages) {
    return new Response(JSON.stringify({ error: { message: "messages is required" } }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const simBody = {
    messages: payload.messages,
    max_tokens: String(payload.max_tokens || 4096),
  };

  if (payload.stream) {
    simBody.stream = true;
    simBody.selectedOutputs = ["LLM.content"];

    const simRes = await fetch(SIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": SIM_API_KEY },
      body: JSON.stringify(simBody),
    });

    const model = payload.model || "claude-opus-4-6";
    const id = "chatcmpl-" + Date.now();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const writeChunk = (obj) => writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

    (async () => {
      const reader = simRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === '"[DONE]"' || raw === "[DONE]") {
            await writeChunk({ id, object: "chat.completion.chunk", created: Math.floor(Date.now()/1000), model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] });
            await writer.write(enc.encode("data: [DONE]\n\n"));
            await writer.close();
            return;
          }
          try {
            const evt = JSON.parse(raw);
            if (evt.chunk) {
              await writeChunk({ id, object: "chat.completion.chunk", created: Math.floor(Date.now()/1000), model, choices: [{ index: 0, delta: { content: evt.chunk }, finish_reason: null }] });
            } else if (evt.event === "final" || evt.event === "done") {
              await writeChunk({ id, object: "chat.completion.chunk", created: Math.floor(Date.now()/1000), model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] });
              await writer.write(enc.encode("data: [DONE]\n\n"));
              await writer.close();
              return;
            }
          } catch(e) {}
        }
      }
      if (!writable.locked) { try { await writer.close(); } catch(e) {} }
    })();

    return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" } });
  }

  const simRes = await fetch(SIM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": SIM_API_KEY },
    body: JSON.stringify(simBody),
  });
  const data = await simRes.json();
  if (data.output && data.output.result) {
    return new Response(JSON.stringify(data.output.result), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
  return new Response(JSON.stringify({ error: { message: "Unexpected Sim response" } }), { status: 502, headers: { "Content-Type": "application/json" } });
}
