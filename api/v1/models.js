export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
  }
  return new Response(JSON.stringify({
    object: "list",
    data: [
      { id: "claude-opus-4-6", object: "model", created: 1700000000, owned_by: "sim-ai" },
      { id: "claude-sonnet-4", object: "model", created: 1700000000, owned_by: "sim-ai" },
      { id: "claude-3.5-sonnet", object: "model", created: 1700000000, owned_by: "sim-ai" }
    ]
  }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
