import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { targetUrl, method = "POST", headers = {}, body, stream = false } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ error: "Target URL is required" }, { status: 400 });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (method !== "GET" && method !== "HEAD" && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Pass through streaming responses (e.g. Ollama NDJSON stream)
    if (stream && response.body) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "application/x-ndjson",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: error.message || "Internal Proxy Error" }, { status: 500 });
  }
}
