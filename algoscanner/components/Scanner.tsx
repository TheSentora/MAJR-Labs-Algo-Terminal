
// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

/** TestNet algod (no API key) */
const ALGOD = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");

/** Valid Algorand zero address (revokes authorities) */
const ZERO_ADDR = algosdk.encodeAddress(new Uint8Array(32)); // "AAAAAAAA...Y5HFKQ"

/** Wait for confirmation */
async function waitForConfirmation(algod: algosdk.Algodv2, txId: string, rounds = 8) {
  let last = (await algod.status().do())["last-round"];
  while (rounds-- > 0) {
    const p = await algod.pendingTransactionInformation(txId).do();
    if (p["confirmed-round"] > 0) return p;
    last++;
    await algod.statusAfterBlock(last).do();
  }
  throw new Error("Transaction not confirmed in time");
}

export default function Page() {
  const pera = useMemo(() => new PeraWalletConnect(), []);
  const [addr, setAddr] = useState("");

  // minimal form
  const [assetName, setAssetName] = useState("My Token");
  const [unitName, setUnitName] = useState("MTK");
  const [decimals, setDecimals] = useState(6);
  const [supply, setSupply] = useState<number>(1_000_000);

  // ui
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");
  const [assetId, setAssetId] = useState<number | null>(null);

  /** Reconnect existing session */
  useEffect(() => {
    (async () => {
      try {
        const accts = await pera.reconnectSession();
        if (accts?.length) setAddr(accts[0]);
        pera.connector?.on("disconnect", () => setAddr(""));
      } catch {}
    })();
  }, [pera]);

  async function onConnect() {
    try {
      setConnecting(true);
      const accts = await pera.connect(); // opens QR modal
      if (!accts?.length) throw new Error("No accounts returned");
      setAddr(accts[0]);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Wallet connect failed");
    } finally {
      setConnecting(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setTxId(""); setAssetId(null);

    if (!addr || !algosdk.isValidAddress(addr)) return setError("Connect wallet first.");
    if (!assetName.trim() || !unitName.trim()) return setError("Asset Name and Ticker are required.");
    if (unitName.length > 8) return setError("Ticker (Unit) must be ≤ 8 chars.");
    if (decimals < 0 || decimals > 19) return setError("Decimals must be 0–19.");
    if (supply <= 0) return setError("Supply must be > 0.");

    try {
      setCreating(true);

      const sp = await ALGOD.getTransactionParams().do();
      const totalBase = Math.round(supply * Math.pow(10, decimals));

      // Minimal ASA: defaultFrozen=false; all admin roles explicitly set to ZERO_ADDR
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: addr.trim(),
        total: totalBase,
        decimals,
        defaultFrozen: false,
        unitName,
        assetName,
        manager: ZERO_ADDR,
        reserve: ZERO_ADDR,
        freeze: ZERO_ADDR,
        clawback: ZERO_ADDR,
        suggestedParams: sp,
      });

      // Sign (let Pera infer signer)
      const signed = await pera.signTransaction([{ txn: algosdk.encodeUnsignedTransaction(txn) }]);
      const blob = signed[0]?.blob ?? signed[0]; // handle both return shapes

      const { txId } = await ALGOD.sendRawTransaction(blob).do();
      setTxId(txId);

      const confirmed = await waitForConfirmation(ALGOD, txId, 8);
      const createdId = confirmed["asset-index"] as number | undefined;
      if (!createdId) throw new Error("Asset ID not found in confirmation.");
      setAssetId(createdId);
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  const explorerTx = txId ? `https://testnet.algoexplorer.io/tx/${txId}` : "";
  const explorerAsset = assetId ? `https://testnet.algoexplorer.io/asset/${assetId}` : "";

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Algorand Token Creator</h1>
            <p style={styles.subtitle}>Minimal · Pera Wallet (QR) · TestNet</p>
          </div>
          <span style={styles.badge}>TestNet</span>
        </header>

        <section style={styles.card}>
          <div style={styles.walletRow}>
            {!addr ? (
              <button style={styles.primaryBtn} onClick={onConnect} disabled={connecting}>
                {connecting ? "Opening WalletConnect…" : "Connect Pera (QR)"}
              </button>
            ) : (
              <div style={styles.addrBox}>
                <span style={{ opacity: 0.75, marginRight: 6 }}>Connected:</span>
                <code style={styles.code}>{addr.slice(0, 6)}…{addr.slice(-6)}</code>
              </div>
            )}
          </div>

          <form onSubmit={onCreate} style={styles.form}>
            <div style={styles.grid}>
              <L label="Asset Name">
                <input style={styles.input} value={assetName} onChange={(e) => setAssetName(e.target.value)} />
              </L>
              <L label="Ticker (≤8)">
                <input style={styles.input} value={unitName} onChange={(e) => setUnitName(e.target.value)} />
              </L>
              <L label="Decimals (0–19)">
                <input style={styles.input} type="number" min={0} max={19} value={decimals}
                       onChange={(e) => setDecimals(parseInt(e.target.value || "0"))} />
              </L>
              <L label="Total Supply (human units)">
                <input style={styles.input} type="number" min={1} value={supply}
                       onChange={(e) => setSupply(parseFloat(e.target.value || "0"))} />
              </L>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" style={styles.createBtn} disabled={!addr || creating}>
              {creating ? "Creating…" : "Create Token"}
            </button>

            {(txId || assetId) && (
              <div style={styles.resultBox}>
                {txId && (
                  <div>Tx: <a style={styles.link} href={explorerTx} target="_blank" rel="noreferrer">{txId.slice(0, 12)}… ↗</a></div>
                )}
                {assetId && (
                  <div>Asset ID: <a style={styles.link} href={explorerAsset} target="_blank" rel="noreferrer">{assetId} ↗</a></div>
                )}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={styles.label}>
      <div style={styles.labelText}>{label}</div>
      {children}
    </label>
  );
}

/* styles */
const styles = {
  wrap: {
    minHeight: "100vh",
    background:
      "radial-gradient(1100px 600px at 15% -20%, rgba(14,165,233,0.18), transparent), radial-gradient(900px 500px at 90% 10%, rgba(59,130,246,0.16), transparent), #07090d",
    color: "#e9f5ff",
    padding: "40px 16px",
  },
  container: { maxWidth: 980, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 32, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { opacity: 0.78, margin: 0 },
  badge: {
    fontSize: 12, padding: "6px 12px", borderRadius: 999,
    background: "rgba(14,165,233,0.16)", border: "1px solid rgba(14,165,233,0.45)",
  },
  card: {
    background: "rgba(8,12,20,0.85)", border: "1px solid rgba(96,165,250,0.10)",
    borderRadius: 18, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  },
  walletRow: { marginTop: 6, marginBottom: 12, display: "flex", gap: 10, alignItems: "center" },
  primaryBtn: {
    height: 42, borderRadius: 12, padding: "0 16px",
    background: "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(59,130,246,0.35))",
    border: "1px solid rgba(96,165,250,0.35)", color: "#e9f5ff",
    cursor: "pointer", boxShadow: "0 0 18px rgba(14,165,233,0.18)",
  },
  addrBox: {
    background: "rgba(2,6,12,0.75)", border: "1px solid rgba(96,165,250,0.25)",
    padding: "8px 10px", borderRadius: 10,
  },
  code: {
    background: "rgba(2,6,12,0.75)", padding: "2px 6px",
    borderRadius: 6, border: "1px solid rgba(96,165,250,0.18)",
  },
  form: { display: "grid", gap: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  label: { display: "grid", gap: 6 },
  labelText: { fontSize: 12, opacity: 0.75 },
  input: {
    height: 40, borderRadius: 10, border: "1px solid rgba(147,197,253,0.12)",
    background: "rgba(2,6,12,0.75)", color: "#e9f5ff", padding: "0 12px", outline: "none",
  },
  error: {
    background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.35)", padding: "10px 12px", borderRadius: 10,
  },
  createBtn: {
    height: 44, borderRadius: 12, padding: "0 16px",
    background: "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(59,130,246,0.35))",
    border: "1px solid rgba(96,165,250,0.35)", color: "#e9f5ff",
    cursor: "pointer", boxShadow: "0 0 18px rgba(14,165,233,0.18)",
  },
  resultBox: {
    marginTop: 10, background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.20)", padding: 10, borderRadius: 12,
    fontSize: 14, lineHeight: 1.35,
  },
  link: { color: "#cfeaff", textDecoration: "none" },
} as const;
