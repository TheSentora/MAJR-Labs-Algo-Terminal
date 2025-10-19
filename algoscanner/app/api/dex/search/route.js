export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const chain = (searchParams.get("chain") || "algorand").toLowerCase();

    if (!q) {
      return new Response(JSON.stringify({ error: "Missing q" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const upstream = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
      { headers: { accept: "*/*" }, cache: "no-store" }
    );

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "DexScreener upstream error", status: upstream.status }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const json = await upstream.json();
    const pairs = Array.isArray(json?.pairs)
      ? json.pairs.filter((p) => (p.chainId || "").toLowerCase() === chain)
      : [];

    return new Response(JSON.stringify({ pairs, count: pairs.length }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
