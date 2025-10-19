"use client";
// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";

// swap widget + wallet
import { WidgetController } from "@tinymanorg/tinyman-swap-widget-sdk";
import { PeraWalletConnect } from "@perawallet/connect";
import * as algosdk from "algosdk";

// --- TestNet ---
const ALGOD_URL = "https://testnet-api.algonode.cloud";
const TRADE_APP_ID = 748019055;

/** DexScreener types (relaxed so we can show everything they return) */
type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  labels?: string[];
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceNative?: string;
  priceUsd?: string;
  txns?: { [k: string]: { buys?: number; sells?: number } };
  volume?: { [k: string]: number };
  priceChange?: { [k: string]: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { platform?: string; handle?: string }[];
  };
  boosts?: { active?: number };
};

// --- risk helpers ---
const NETWORK = "testnet"; // change to "mainnet" when you switch

type RiskItem = { level: "danger" | "warn" | "info"; text: string };

function computeRisk(pair: DexPair): { items: RiskItem[]; overall: "HIGH" | "MEDIUM" | "LOW" } {
  const items: RiskItem[] = [];
  const liq = pair.liquidity?.usd ?? 0;
  const ageH = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3.6e6 : undefined;
  const h24 = pair.txns?.h24;
  const buys24 = h24?.buys ?? 0;
  const sells24 = h24?.sells ?? 0;
  const pct24 = pair.priceChange?.h24 ?? 0;
  const labels = (pair.labels ?? []).join(" ").toLowerCase();
  const noWeb = !(pair.info?.websites?.length);
  const noSoc = !(pair.info?.socials?.length);

  if (/honeypot|scam|rug|blacklist/.test(labels)) items.push({ level: "danger", text: "Flagged label (honeypot/scam)" });
  if (liq > 0 && liq < 2_000) items.push({ level: "danger", text: "Very low liquidity (< $2k)" });
  if (ageH !== undefined && ageH < 24) items.push({ level: "warn", text: "New pair (< 24h)" });
  if (sells24 > buys24 * 2 && sells24 >= 10) items.push({ level: "warn", text: "Heavy sell pressure (24h)" });
  if (Math.abs(pct24) >= 60) items.push({ level: "warn", text: "Extreme 24h volatility" });
  if (noWeb && noSoc) items.push({ level: "info", text: "No website/socials" });

  const hasDanger = items.some(i => i.level === "danger");
  const warningCount = items.filter(i => i.level !== "info").length;

  return { items, overall: hasDanger ? "HIGH" : warningCount >= 2 ? "MEDIUM" : "LOW" };
}

const riskStyles = {
  box: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    background: "rgba(12,18,30,0.85)",
    border: "1px solid rgba(239,68,68,0.18)",
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 14, fontWeight: 800, letterSpacing: 0.2 },
  overall: (lvl: "HIGH" | "MEDIUM" | "LOW") => ({
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    background:
      lvl === "HIGH" ? "rgba(239,68,68,0.15)" : lvl === "MEDIUM" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
    borderColor:
      lvl === "HIGH" ? "rgba(239,68,68,0.45)" : lvl === "MEDIUM" ? "rgba(245,158,11,0.45)" : "rgba(34,197,94,0.45)",
  }),
  chips: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
  chip: (lvl: "danger" | "warn" | "info") => ({
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid",
    background:
      lvl === "danger" ? "rgba(239,68,68,0.12)" : lvl === "warn" ? "rgba(245,158,11,0.1)" : "rgba(148,163,184,0.1)",
    borderColor:
      lvl === "danger" ? "rgba(239,68,68,0.45)" : lvl === "warn" ? "rgba(245,158,11,0.45)" : "rgba(148,163,184,0.35)",
  }),
  meterWrap: { marginTop: 10 },
  meterBar: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(2,6,12,0.6)",
    border: "1px solid rgba(96,165,250,0.15)",
  },
  meterRow: { display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6, opacity: 0.9 },
  linksRow: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" as const },
  link: {
    fontSize: 12,
    textDecoration: "none",
    color: "#e9f5ff",
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.25)",
    padding: "6px 8px",
    borderRadius: 999,
  },
};

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<DexPair[]>([]);
  const [main, setMain] = useState<DexPair | null>(null);
  const [error, setError] = useState("");

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPairs([]);
    setMain(null);
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/dex/search?q=${encodeURIComponent(q)}&chain=algorand`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch");
      const list = (data?.pairs ?? []) as DexPair[];
      if (!list.length) {
        setError("No Algorand markets found for this query.");
      } else {
        const best = [...list].sort(
          (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
        )[0];
        setMain(best);
        setPairs(list);
      }
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <div>
<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
  <img 
    src="/logo.png" 
    alt="MAJR Labs Logo" 
    style={{ width: 90, height: 90, borderRadius: 8 }}
  />
  <span style={{ fontSize: 35, fontWeight: 700, color: "#e9f5ff", letterSpacing: 0.3 }}>
    MAJR Labs
  </span>
</div>

<h1 style={styles.title}>Algorand Token Scanner</h1>
<p style={styles.subtitle}>Security Scanner for Algo Tokens</p>

  </div>

  <a
    href="http://localhost:5173/"
    target="_blank"
    rel="noreferrer"
    style={{
      textDecoration: "none",
      background: "rgba(2,6,12,0.75)",
      border: "1px solid rgba(96,165,250,0.25)",
      padding: "10px 14px",
      borderRadius: 10,
      color: "#cfeaff",
      fontSize: 20,
      boxShadow: "0 0 12px rgba(59,130,246,0.18)",
      fontWeight: 600,
    }}
  >
    Liquidity
  </a>

<a
  href="/whitepaper"
  style={{
    textDecoration: "none",
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.25)",
    padding: "10px 14px",
    borderRadius: 10,
    color: "#cfeaff",
    fontSize: 20,
    boxShadow: "0 0 12px rgba(59,130,246,0.18)",
    fontWeight: 600,
  }}
>
  Whitepaper
</a>

</div>



        <form onSubmit={onSearch} style={styles.form}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Pair Address"
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}

        {main && <MainPairCard pair={main} />}

        {!loading && !error && !main && (
          <div style={styles.hint}>
            Tip: search by <b>address</b> (e.g., <code>12345678</code>).
          </div>
        )}
      </div>
      <style>{globalCss}</style>
    </div>
  );
}

/* ---------- Main Pair Card (all info) ---------- */

function MainPairCard({ pair }: { pair: DexPair }) {
  const horizons = ["h1", "h6", "h24"] as const;

  const usd = (v?: number | string) =>
    v === undefined || v === null || v === "" ? "—" : `$${Number(v).toLocaleString()}`;
  const num = (v?: number | string) =>
    v === undefined || v === null || v === "" ? "—" : `${Number(v).toLocaleString()}`;
  const pct = (v?: number) =>
    v === undefined || v === null ? "—" : `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
  const dt = (ms?: number) => (ms ? new Date(ms).toLocaleString() : "—");

  const title =
    `${pair.baseToken?.symbol || pair.baseToken?.name || "—"} / ` +
    `${pair.quoteToken?.symbol || pair.quoteToken?.name || "—"}`;

  // --- Tinyman widget + Pera wallet integration ---
  const peraRef = useRef<PeraWalletConnect | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const controllerRef = useRef<WidgetController | null>(null);

  const [algoAddr, setAlgoAddr] = useState<string | undefined>();
  const [swapUrl, setSwapUrl] = useState<string>("");
  const [swapOpen, setSwapOpen] = useState(false);
  const [amountIn, setAmountIn] = useState<string>("");

  // Asset IDs from DexScreener result (Algorand uses ASA IDs; ALGO = 0)
  const baseId = useMemo(() => Number(pair.baseToken?.address ?? 0), [pair.baseToken?.address]);
  const quoteId = useMemo(() => Number(pair.quoteToken?.address ?? 0), [pair.quoteToken?.address]);

  useEffect(() => {
    peraRef.current = new PeraWalletConnect();
    controllerRef.current = new WidgetController({
      onTxnSignRequest: async ({ txGroups }: any) => {
        try {
          if (!peraRef.current || !algoAddr) throw new Error("Wallet not connected");
          const signedTxns = await (peraRef.current as any).signTransaction(txGroups);
          WidgetController.sendMessageToWidget({
            data: { message: { type: "TXN_SIGN_RESPONSE", signedTxns } },
            targetWindow: iframeRef.current?.contentWindow,
          });
        } catch (error) {
          WidgetController.sendMessageToWidget({
            data: { message: { type: "FAILED_TXN_SIGN", error } },
            targetWindow: iframeRef.current?.contentWindow,
          });
        }
      },
      onTxnSignRequestTimeout() {},
      onSwapSuccess() {
        setSwapOpen(false);
      },
    });

    controllerRef.current.addWidgetEventListeners();
    return () => controllerRef.current?.removeWidgetEventListeners();
  }, [algoAddr]);

  const connectPera = async () => {
    try {
      const accounts = await peraRef.current!.connect();
      setAlgoAddr(accounts?.[0]);
      peraRef.current?.connector?.on("disconnect", () => setAlgoAddr(undefined));
    } catch {}
  };

  // base64 helper
  function toBase64(u8: Uint8Array) {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return typeof window !== "undefined" ? btoa(s) : Buffer.from(u8).toString("base64");
  }

  // call our smart contract
  async function callTradeApp(
    mode: "buy" | "sell",
    walletAddr: string,
    baseAssetId: number,
    quoteAssetId: number,
    amountStr: string
  ) {
    const algod = new algosdk.Algodv2("", ALGOD_URL, "");
    const sp = await algod.getTransactionParams().do();

    const enc = new TextEncoder();
    const appArgs: Uint8Array[] = [
      enc.encode(mode.toUpperCase()),
      algosdk.encodeUint64(baseAssetId),
      algosdk.encodeUint64(quoteAssetId),
      enc.encode(amountStr || "0"),
    ];

    const txn = (algosdk as any).makeApplicationNoOpTxnFromObject({
      from: walletAddr,
      appIndex: Number(TRADE_APP_ID),
      suggestedParams: sp,
      appArgs,
    } as any);

    const unsignedBytes = algosdk.encodeUnsignedTransaction(txn);
    const txnB64 = toBase64(unsignedBytes);

    const signed = await (peraRef.current as any).signTransaction([{ txn: txnB64 } as any]);
    const sendRes: any = await algod.sendRawTransaction(signed[0] as Uint8Array).do();
    const txId: string = sendRes.txId || sendRes.txid;
    await algosdk.waitForConfirmation(algod, txId, 4);
    return txId;
  }

  // Build + open widget set to the correct asset pair
  const openSwap = async (mode: "buy" | "sell") => {
    if (!algoAddr) {
      alert("Connect Pera first");
      return;
    }
    if (!Number.isFinite(baseId) || !Number.isFinite(quoteId)) {
      alert("This pair is missing Algorand asset IDs.");
      return;
    }

    try {
      await callTradeApp(mode, algoAddr!, Number(baseId), Number(quoteId), amountIn);
    } catch {
      alert("Trade contract call failed. Check App ID / network.");
      return;
    }

    const assetIds = mode === "buy" ? [quoteId, baseId] : [baseId, quoteId];

    const opts: any = {
      platformName: "Algorand Scanner",
      useParentSigner: true,
      accountAddress: algoAddr,
      network: "testnet",
      parentOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
      assetIds,
      themeVariables: {
        primaryColor: "#3B82F6",
        secondaryColor: "#0EA5E9",
        textColor: "#E9F5FF",
        backgroundColor: "#0b1220",
      },
    };

    const url = (WidgetController as any).generateWidgetIframeUrl(opts) as string;
    setSwapUrl(url);
    setSwapOpen(true);
  };

  return (
    <section style={styles.mainCard}>
      <header style={styles.mainHeader}>
        <div style={styles.badgesRow}>
          {pair.dexId && <span style={styles.dexBadge}>{pair.dexId}</span>}
          {pair.chainId && <span style={styles.chainBadge}>{pair.chainId}</span>}
          {(pair.labels ?? []).map((x) => (
            <span key={x} style={styles.labelBadge}>{x}</span>
          ))}
        </div>

        <div style={styles.titleRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {pair.info?.imageUrl && (
              <img
                src={pair.info.imageUrl}
                alt="token"
                width={40}
                height={40}
                style={{ borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.07)" }}
              />
            )}
            <h2 style={styles.mainTitle}>{title}</h2>
          </div>
          {pair.url && (
            <a href={pair.url} target="_blank" rel="noreferrer" style={styles.openLink}>
              Open pair ↗
            </a>
          )}
        </div>

        <div style={styles.addrRow}>
          <div><span style={styles.addrLabel}>Pair:</span> <code style={styles.code}>{pair.pairAddress || "—"}</code></div>
          <div><span style={styles.addrLabel}>Base:</span> <code style={styles.code}>{pair.baseToken?.address || "—"}</code></div>
          <div><span style={styles.addrLabel}>Quote:</span> <code style={styles.code}>{pair.quoteToken?.address || "—"}</code></div>
        </div>
 </header>

{/* --- Risk / Signals --- */}
{(() => {
  const risk = computeRisk(pair);
  const buys = pair.txns?.h24?.buys ?? 0;
  const sells = pair.txns?.h24?.sells ?? 0;
  const total = buys + sells || 1;
  const buyPct = Math.round((buys / total) * 100);

  const baseIdNum = Number(pair.baseToken?.address ?? 0);
  const quoteIdNum = Number(pair.quoteToken?.address ?? 0);
  const explorer = (id: number) =>
    `https://${NETWORK === "testnet" ? "testnet." : ""}algoexplorer.io/asset/${id}`;

  return (
    <div style={riskStyles.box}>
      <div style={riskStyles.headerRow}>
        <div style={riskStyles.title}>Risk / Signals</div>
        <div style={riskStyles.overall(risk.overall)}>{risk.overall} RISK</div>
      </div>

      <div style={riskStyles.chips}>
        {risk.items.length ? (
          risk.items.map((r, i) => (
            <span key={i} style={riskStyles.chip(r.level)}>{r.text}</span>
          ))
        ) : (
          <span style={riskStyles.chip("info")}>No obvious red flags</span>
        )}
      </div>

      {/* Buys vs Sells (24h) */}
      <div style={riskStyles.meterWrap}>
        <div style={riskStyles.meterBar}>
          <div style={{ width: `${buyPct}%`, height: "100%", background: "rgba(34,197,94,0.6)" }} />
        </div>
        <div style={riskStyles.meterRow}>
          <span>Buys 24h: {buys}</span>
          <span>Sells 24h: {sells}</span>
        </div>
      </div>

      {/* Quick links */}
      <div style={riskStyles.linksRow}>
        {pair.url && (
          <a href={pair.url} target="_blank" rel="noreferrer" style={riskStyles.link}>
            Open on DexScreener ↗
          </a>
        )}
        {Number.isFinite(baseIdNum) && baseIdNum >= 0 && (
          <a href={explorer(baseIdNum)} target="_blank" rel="noreferrer" style={riskStyles.link}>
            Base on Explorer ↗
          </a>
        )}
        {Number.isFinite(quoteIdNum) && quoteIdNum >= 0 && (
          <a href={explorer(quoteIdNum)} target="_blank" rel="noreferrer" style={riskStyles.link}>
            Quote on Explorer ↗
          </a>
        )}
      </div>
    </div>
  );
})()}

<div style={styles.detailsGrid}>

        <Card title="Price (USD)">{pair.priceUsd ? Number(pair.priceUsd).toLocaleString() : "—"}</Card>
        <Card title="Price (Native)">{pair.priceNative || "—"}</Card>
        <Card title="FDV">{usd(pair.fdv)}</Card>
        <Card title="Market Cap">{usd(pair.marketCap)}</Card>
        <Card title="Pair Created">{dt(pair.pairCreatedAt)}</Card>
        <Card title="Boosts Active">{num(pair.boosts?.active)}</Card>

        {["h1", "h6", "h24"].map((h) => (
          <Card key={`vol-${h}`} title={`Volume ${h.toUpperCase()}`}>
            {usd(pair.volume?.[h as keyof typeof pair.volume])}
          </Card>
        ))}

        {horizons.map((h) => (
          <Card key={`tx-${h}`} title={`Tx ${h.toUpperCase()}`}>
            {pair.txns?.[h] ? `${pair.txns[h].buys ?? 0} buys / ${pair.txns[h].sells ?? 0} sells` : "—"}
          </Card>
        ))}

        {horizons.map((h) => (
          <Card key={`chg-${h}`} title={`Price Change ${h.toUpperCase()}`}>
            {pct(pair.priceChange?.[h])}
          </Card>
        ))}
      </div>

      {(pair.info?.websites?.length || pair.info?.socials?.length) ? (
        <div style={styles.linksWrap}>
          {pair.info?.websites?.length ? (
            <div>
              <div style={styles.linksTitle}>Websites</div>
              <div style={styles.linksRow}>
                {pair.info.websites.map((w, i) => (
                  <a key={i} href={w.url} target="_blank" rel="noreferrer" style={styles.linkChip}>
                    {w.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {pair.info?.socials?.length ? (
            <div>
              <div style={styles.linksTitle}>Socials</div>
              <div style={styles.linksRow}>
                {pair.info.socials.map((s, i) => (
                  <span key={i} style={styles.socialChip}>
                    {s.platform}: <b>{s.handle}</b>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------- Trading UI ---------- */}
      <div style={tradeStyles.box}>
        <div style={tradeStyles.rowHeader}>
          <h3 style={tradeStyles.title}>Trade</h3>
          {!algoAddr ? (
            <button onClick={connectPera} style={tradeStyles.connectBtn}>
              Connect Pera
            </button>
          ) : (
            <div style={tradeStyles.addrBadge}>
              {algoAddr.slice(0, 6)}...{algoAddr.slice(-4)}
            </div>
          )}
        </div>

        <div style={tradeStyles.rows}>
          <div>
            <div style={tradeStyles.label}>Amount (optional)</div>
            <input
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="Enter amount you want to swap"
              style={tradeStyles.input}
              inputMode="decimal"
            />
            <div style={tradeStyles.hint}>
              Buy = pay <b>{pair.quoteToken?.symbol || "QUOTE"}</b>, receive{" "}
              <b>{pair.baseToken?.symbol || "BASE"}</b> · Sell = opposite.
            </div>
          </div>

          <div style={tradeStyles.btnRow}>
            <button onClick={() => openSwap("buy")} style={{ ...tradeStyles.actionBtn, ...tradeStyles.buyBtn }}>
              Buy {pair.baseToken?.symbol || "BASE"}
            </button>
            <button onClick={() => openSwap("sell")} style={{ ...tradeStyles.actionBtn, ...tradeStyles.sellBtn }}>
              Sell {pair.baseToken?.symbol || "BASE"}
            </button>
          </div>
        </div>
      </div>

      {swapOpen && (
        <div style={tradeStyles.modalBackdrop} onClick={() => setSwapOpen(false)}>
          <div style={tradeStyles.modalBody} onClick={(e) => e.stopPropagation()}>
            <div style={tradeStyles.modalHeader}>
              <div style={{ fontWeight: 700 }}>Tinyman Swap</div>
              <button onClick={() => setSwapOpen(false)} style={tradeStyles.closeX}>✕</button>
            </div>
            <iframe
              ref={iframeRef}
              title="tinyman swap widget"
              src={swapUrl}
              style={tradeStyles.iframe}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- UI Bits ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiLabel}>{title}</div>
      <div style={styles.kpiValue}>{children}</div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background:
      "radial-gradient(1100px 600px at 15% -20%, rgba(14,165,233,0.18), transparent), radial-gradient(900px 500px at 90% 10%, rgba(59,130,246,0.16), transparent), #07090d",
    color: "#e9f5ff",
    padding: "40px 16px",
  },
  container: { maxWidth: 980, margin: "0 auto" },
  title: { fontSize: 34, fontWeight: 800, letterSpacing: 0.3, margin: "0 0 8px" },
  subtitle: { opacity: 0.75, marginBottom: 24 },
  form: { display: "flex", gap: 12, alignItems: "center", marginBottom: 20 },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(147,197,253,0.12)",
    background: "rgba(2,6,12,0.75)",
    color: "#e9f5ff",
    padding: "0 14px",
  },
  button: {
    height: 44,
    borderRadius: 12,
    padding: "0 16px",
    background: "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(59,130,246,0.35))",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#e9f5ff",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(14,165,233,0.18)",
  },
  error: {
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.35)",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 12,
  },
  hint: { marginTop: 18, opacity: 0.8 },
  mainCard: {
    background: "rgba(8,12,20,0.85)",
    border: "1px solid rgba(96,165,250,0.10)",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  },
  mainHeader: { display: "grid", gap: 10, marginBottom: 10 },
  badgesRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  dexBadge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(59,130,246,0.45)",
  },
  chainBadge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(14,165,233,0.16)",
    border: "1px solid rgba(14,165,233,0.45)",
  },
  labelBadge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(148,163,184,0.14)",
    border: "1px solid rgba(148,163,184,0.28)",
  },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  mainTitle: { fontSize: 22, margin: 0 },
  openLink: {
    textDecoration: "none",
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.25)",
    padding: "8px 10px",
    borderRadius: 10,
    color: "#cfeaff",
    fontSize: 13,
    boxShadow: "0 0 12px rgba(59,130,246,0.18)",
  },
  addrRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 10,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    opacity: 0.95,
  },
  addrLabel: { opacity: 0.7, marginRight: 6 },
  code: {
    background: "rgba(2,6,12,0.75)",
    padding: "2px 6px",
    borderRadius: 6,
    border: "1px solid rgba(96,165,250,0.18)",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  kpi: {
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.14)",
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: 700 },
  linksWrap: { marginTop: 16, display: "grid", gap: 8 },
  linksTitle: { fontSize: 13, opacity: 0.85, marginBottom: 6 },
  linksRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  linkChip: {
    fontSize: 12,
    textDecoration: "none",
    color: "#e9f5ff",
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.25)",
    padding: "6px 8px",
    borderRadius: 999,
  },
  socialChip: {
    fontSize: 12,
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.25)",
    padding: "6px 8px",
    borderRadius: 999,
  },
} as const;

const tradeStyles = {
  box: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    background: "linear-gradient(180deg, rgba(11,18,32,.85), rgba(5,10,20,.85))",
    border: "1px solid rgba(59,130,246,0.18)",
    boxShadow: "0 10px 30px rgba(2,6,12,0.6)",
  },
  rowHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { margin: 0, fontSize: 16, fontWeight: 800 },
  connectBtn: {
    borderRadius: 10,
    padding: "8px 12px",
    border: "1px solid rgba(96,165,250,0.5)",
    background: "linear-gradient(135deg, rgba(14,165,233,.35), rgba(59,130,246,.35))",
    color: "#e9f5ff",
  },
  addrBadge: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(59,130,246,0.45)",
  },
  rows: { display: "grid", gap: 10 },
  label: { fontSize: 12, opacity: 0.8, marginBottom: 6 },
  input: {
    width: "100%",
    height: 42,
    borderRadius: 10,
    border: "1px solid rgba(147,197,253,0.2)",
    background: "rgba(2,6,12,0.75)",
    color: "#e9f5ff",
    padding: "0 12px",
    outline: "none",
  },
  hint: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  btnRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
  actionBtn: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(96,165,250,0.35)",
    background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(59,130,246,0.25))",
    color: "#e9f5ff",
    fontWeight: 800 as const,
    letterSpacing: 0.3,
    boxShadow: "0 0 20px rgba(59,130,246,0.25)",
  },
  buyBtn: { filter: "drop-shadow(0 0 12px rgba(14,165,233,.25))" },
  sellBtn: { filter: "drop-shadow(0 0 12px rgba(239,68,68,.25))", borderColor: "rgba(239,68,68,0.35)" },
  modalBackdrop: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.6)",
    display: "grid", placeItems: "center", zIndex: 9999,
  },
  modalBody: {
    width: 430, maxWidth: "90vw", borderRadius: 16, overflow: "hidden",
    background: "rgba(8,12,20,0.95)", border: "1px solid rgba(96,165,250,0.2)",
    boxShadow: "0 20px 60px rgba(0,0,0,.6)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", borderBottom: "1px solid rgba(96,165,250,0.14)",
  },
  closeX: {
    background: "transparent", border: "none", color: "#cfeaff", cursor: "pointer", fontSize: 16,
  },
  iframe: { width: 415, height: 440, border: "none" },
} as const;

const globalCss = `
  * { box-sizing: border-box }
  a:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.35) }
  ::placeholder { color: rgba(207,234,255,.5) }
  button:not(:disabled):hover {
    filter: brightness(1.05);
    box-shadow: 0 0 20px rgba(59,130,246,0.25);
  }
`;
