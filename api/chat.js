const SIM_API_KEY = "sk-sim-uomNsK1G1ZYnFy9HUOZrPPzYHaPlIBE4";
const WORKFLOW_ID = "226b0f12-d645-4051-8f3a-288a8e706cee";
const SIM_URL = `https://sim.ai/api/workflows/${WORKFLOW_ID}/execute`;

export const config = { runtime: "edge", maxDuration: 60 };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" },
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: "Invalid JSON" } }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  if (!payload.messages) {
    return new Response(JSON.stringify({ error: { message: "messages is required" } }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  const simBody = {
    messages: payload.messages,
    max_tokens: String(payload.max_tokens || 4096),
  };

  // 非流式：直接请求 Sim 并透传结果
  const simRes = await fetch(SIM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": SIM_API_KEY },
    body: JSON.stringify(simBody),
  });

  const data = await simRes.json();

  if (data.output && data.output.result) {
    return new Response(JSON.stringify(data.output.result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*
