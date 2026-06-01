const K = "sk-sim-uomNsK1G1ZYnFy9HUOZrPPzYHaPlIBE4";
const U = "https://sim.ai/api/workflows/226b0f12-d645-4051-8f3a-288a8e706cee/execute";
export const config = { runtime: "edge" };
export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" } });
  var p = await req.json();
  var r = await fetch(U, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": K }, body: JSON.stringify({ messages: p.messages, max_tokens: String(p.max_tokens || 4096) }) });
  var d = await r.json();
  var out = (d.output && d.output.result) ? d.output.result : { id: "err", object: "chat.completion", created: 0, model: "error", choices: [{ index: 0, message: { role: "assistant", content: "Error: " + JSON.stringify(d) }, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
