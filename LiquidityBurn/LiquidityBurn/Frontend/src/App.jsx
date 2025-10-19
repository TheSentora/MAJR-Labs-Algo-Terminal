import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import algosdk from "algosdk";
import appSpec from "./contracts/LiquidBurnApp.arc56.json";
import "./App.css";

const buttonBase = {
  height: 44,
  borderRadius: 12,
  padding: "0 18px",
  background:
    "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(59,130,246,0.35))",
  border: "1px solid rgba(96,165,250,0.35)",
  color: "#e9f5ff",
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(14,165,233,0.18)",
  fontWeight: 600,
  letterSpacing: 0.2,
};

const styles = {
  wrap: {
    minHeight: "100vh",
    background:
      "radial-gradient(1100px 600px at 15% -20%, rgba(14,165,233,0.18), transparent), radial-gradient(900px 500px at 90% 10%, rgba(59,130,246,0.16), transparent), #07090d",
    color: "#e9f5ff",
    padding: "40px 16px",
  },
  container: { maxWidth: 1020, margin: "0 auto" },
  title: {
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: 0.3,
    margin: "0 0 8px",
  },
  subtitle: { opacity: 0.75, marginBottom: 24 },
  button: buttonBase,
  secondaryButton: {
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.35)",
  },
  smallButton: {
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    fontSize: 13,
  },
  outlineButton: {
    background: "transparent",
    border: "1px solid rgba(148,163,184,0.35)",
    boxShadow: "none",
  },
  form: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(147,197,253,0.12)",
    background: "rgba(2,6,12,0.75)",
    color: "#e9f5ff",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 12,
    border: "1px solid rgba(147,197,253,0.12)",
    background: "rgba(2,6,12,0.75)",
    color: "#e9f5ff",
    padding: "12px 14px",
    outline: "none",
    fontSize: 14,
  },
  error: {
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.35)",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 12,
    color: "#fecaca",
    fontSize: 13,
  },
  status: {
    background: "rgba(14,165,233,0.16)",
    border: "1px solid rgba(14,165,233,0.35)",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 12,
    color: "#bae6fd",
    fontSize: 13,
  },
  hint: { marginTop: 18, opacity: 0.8 },
  mainCard: {
    background: "rgba(8,12,20,0.88)",
    border: "1px solid rgba(96,165,250,0.14)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 16px 40px rgba(7,9,13,0.45)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  tabsRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 24,
  },
  tabButton: (active) => ({
    ...buttonBase,
    height: 40,
    padding: "0 16px",
    background: active
      ? "linear-gradient(135deg, rgba(59,130,246,0.5), rgba(14,165,233,0.5))"
      : "rgba(8,12,20,0.8)",
    border: active
      ? "1px solid rgba(96,165,250,0.55)"
      : "1px solid rgba(96,165,250,0.28)",
    boxShadow: active ? "0 0 18px rgba(59,130,246,0.35)" : "none",
  }),
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
    marginTop: 14,
  },
  kpi: {
    background: "rgba(2,6,12,0.75)",
    border: "1px solid rgba(96,165,250,0.18)",
    borderRadius: 14,
    padding: 14,
  },
  kpiLabel: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
  kpiValue: { fontSize: 18, fontWeight: 700 },
  fieldStack: { display: "grid", gap: 12 },
  label: { fontSize: 13, opacity: 0.85, marginBottom: 6 },
  gridTwo: { display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" },
  gridAuto: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(2,6,12,0.7)",
    fontSize: 14,
  },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  badge: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.18)",
  },
  mono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
};

const globalCss = `
  * { box-sizing: border-box; transition: all .15s ease; }
  button:disabled { opacity: .55; cursor: not-allowed; box-shadow: none !important; }
  button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59,130,246,0.35);
  }
  input:focus, textarea:focus {
    border-color: rgba(59,130,246,0.45) !important;
    box-shadow: 0 0 12px rgba(59,130,246,0.25);
  }
`;

const DEFAULT_APP_ID = Number(import.meta.env.VITE_APP_ID ?? 1013);
const DEFAULT_ASA_ID = Number(import.meta.env.VITE_ASA_ID ?? 0);
const ALGOD_CONFIG = {
  server: import.meta.env.VITE_ALGOD_SERVER ?? "http://localhost",
  token:
    import.meta.env.VITE_ALGOD_TOKEN ??
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  port: Number(import.meta.env.VITE_ALGOD_PORT ?? 4001),
};
const TEST_MNEMONIC = import.meta.env.VITE_TEST_MNEMONIC ?? "";

function decodeKey(encoded) {
  try {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(encoded);
    }
  } catch (_) {
    // ignore
  }
  if (typeof atob === "function") {
    try {
      return atob(encoded);
    } catch (_) {
      // ignore
    }
  }
  if (typeof globalThis !== "undefined" && globalThis.Buffer) {
    return globalThis.Buffer.from(encoded, "base64").toString("utf-8");
  }
  return encoded;
}

function decodeState(entries = []) {
  const out = {};
  entries.forEach((entry) => {
    const key = decodeKey(entry.key);
    if (entry.value.type === 2) {
      out[key] = Number(entry.value.uint ?? 0);
    } else if (entry.value.bytes) {
      out[key] = entry.value.bytes;
    }
  });
  return out;
}

function useLocalAccount() {
  const [account, setAccount] = useState(null);

  const connect = useCallback(() => {
    if (!TEST_MNEMONIC) {
      alert("Please set VITE_TEST_MNEMONIC in .env.local (LocalNet mnemonic).");
      return;
    }
    try {
      const baseAccount = algosdk.mnemonicToSecretKey(TEST_MNEMONIC.trim());
      const signer = algosdk.makeBasicAccountTransactionSigner(baseAccount);
      setAccount({ ...baseAccount, signer });
    } catch (error) {
      console.error(error);
      alert("Failed to parse mnemonic. Check VITE_TEST_MNEMONIC.");
    }
  }, []);

  const disconnect = useCallback(() => setAccount(null), []);

  return { account, connect, disconnect };
}

export default function App() {
  const { account, connect, disconnect } = useLocalAccount();
  const algod = useMemo(
    () => new algosdk.Algodv2(ALGOD_CONFIG.token, ALGOD_CONFIG.server, ALGOD_CONFIG.port),
    []
  );
  const contract = useMemo(() => new algosdk.ABIContract(appSpec), []);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = globalCss;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const tabs = [
    { key: "burn", label: "Burn & Reward" },
  ];

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        <header>
          <h1 style={styles.title}>AlgoForge Control Panel</h1>
          <p style={styles.subtitle}>
            Connect your Algorand LocalNet contracts and walk through the full lifecycle:
            create, distribute, burn, and reward a single ASA.
          </p>
        </header>

        <div style={styles.badgeRow}>
          <span style={styles.badge}>Algorand LocalNet</span>
          <span style={{ ...styles.badge, border: "1px solid rgba(14,165,233,0.45)" }}>
            ARC-56 ABI Ready
          </span>
          <span style={{ ...styles.badge, border: "1px solid rgba(239,68,68,0.45)" }}>
            Burn Incentives
          </span>
          <span style={{ ...styles.badge, border: "1px solid rgba(74,222,128,0.45)" }}>
            Rewards Pool
          </span>
        </div>

        <div style={styles.sectionHeader}>
          <div>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Connected account</span>
            <div style={{ ...styles.mono, fontSize: 15, marginTop: 4 }}>
              {account?.addr ?? "Not connected"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <UiButton
              label={account ? "Disconnect" : "Connect LocalNet Wallet"}
              onClick={account ? disconnect : connect}
            />
            <UiButton
              label="Export Layout"
              variant="secondary"
              onClick={() => window.print()}
            />
          </div>
        </div>

        <div style={styles.tabsRow}>
          {tabs.map((item) => (
            <button
              key={item.key}
              style={styles.tabButton(tab === item.key)}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewSection />}
        {tab === "creator" && <CreatorSection />}
        {tab === "airdrop" && <AirdropSection />}
        {tab === "burn" && (
          <BurnRewardSection account={account} algod={algod} contract={contract} />
        )}
      </div>
    </div>
  );
}

function UiButton({ label, onClick, variant = "primary", size = "md", disabled }) {
  const base = {
    ...styles.button,
    ...(variant === "secondary" ? styles.secondaryButton : {}),
    ...(variant === "outline" ? styles.outlineButton : {}),
    ...(size === "sm" ? styles.smallButton : {}),
  };
  return (
    <button style={base} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function OverviewSection() {
  return (
    <div style={styles.mainCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Project Snapshot</h2>
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          Summaries and deliverables for AlgoForge
        </span>
      </div>

      <div style={styles.gridAuto}>
        <FieldBlock label="Short Summary">
          <input
            style={styles.input}
            defaultValue="Create, airdrop, and incentivize burns for a single Algorand ASA."
          />
        </FieldBlock>
        <FieldBlock label="Presentation Link">
          <div style={{ display: "flex", gap: 10 }}>
            <input style={styles.input} placeholder="https://www.canva.com/..." />
            <UiButton label="Open" variant="secondary" size="sm" />
          </div>
        </FieldBlock>
      </div>

      <FieldBlock label="Description">
        <textarea
          style={styles.textarea}
          placeholder="Describe the problem, the solution, and how Algorand features (ASA, AVM, atomic groups, low fees) make it possible."
        />
      </FieldBlock>

      <FieldBlock label="Technical Summary">
        <textarea
          style={styles.textarea}
          placeholder="SDKs (algosdk, algokit), smart contracts, event flows, and deployment strategy."
        />
      </FieldBlock>

      <FieldBlock label="Explorer Links">
        <textarea
          style={styles.textarea}
          placeholder="List the ASA ID, app ID, Asset Hub link, and transaction references."
        />
      </FieldBlock>

      <div style={styles.kpiGrid}>
        <KpiCard title="Custom Smart Contract" value="Required" />
        <KpiCard title="Demo Video" value="Pending" />
        <KpiCard title="README" value="Work in Progress" />
        <KpiCard title="Open Source" value="Public" />
        <KpiCard title="Slides" value="Missing" />
      </div>
    </div>
  );
}

function CreatorSection() {
  const [form, setForm] = useState({
    name: "MyToken",
    unit: "MTK",
    total: "100000000",
    decimals: 6,
    defaultFreeze: false,
    manager: "",
    reserve: "",
    freeze: "",
    clawback: "",
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={styles.mainCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Token Creator</h2>
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          Capture ASA parameters before calling on-chain scripts.
        </span>
      </div>

      <div style={styles.gridTwo}>
        <FieldBlock label="Asset Name">
          <input
            style={styles.input}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Unit Symbol">
          <input
            style={styles.input}
            value={form.unit}
            onChange={(event) => updateField("unit", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Total Supply">
          <input
            style={styles.input}
            type="number"
            value={form.total}
            onChange={(event) => updateField("total", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Decimals">
          <input
            style={styles.input}
            type="number"
            value={form.decimals}
            onChange={(event) =>
              updateField("decimals", Number(event.target.value))
            }
          />
        </FieldBlock>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          marginTop: 10,
          borderRadius: 12,
          border: "1px solid rgba(96,165,250,0.18)",
          background: "rgba(2,6,12,0.7)",
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.8 }}>Default Freeze</span>
        <ToggleSwitch
          checked={form.defaultFreeze}
          onChange={(value) => updateField("defaultFreeze", value)}
        />
      </div>

      <div style={styles.gridTwo}>
        <FieldBlock label="Manager Address">
          <input
            style={styles.input}
            placeholder="optional"
            value={form.manager}
            onChange={(event) => updateField("manager", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Reserve Address">
          <input
            style={styles.input}
            placeholder="optional"
            value={form.reserve}
            onChange={(event) => updateField("reserve", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Freeze Address">
          <input
            style={styles.input}
            placeholder="optional"
            value={form.freeze}
            onChange={(event) => updateField("freeze", event.target.value)}
          />
        </FieldBlock>
        <FieldBlock label="Clawback Address">
          <input
            style={styles.input}
            placeholder="optional"
            value={form.clawback}
            onChange={(event) => updateField("clawback", event.target.value)}
          />
        </FieldBlock>
      </div>

      <div style={{ marginTop: 16 }}>
        <UiButton label="Deploy ASA (script placeholder)" onClick={() => {}} />
        <p style={{ ...styles.hint, fontSize: 13 }}>
          After deployment, capture the ASA ID and share it with your team and documentation.
        </p>
      </div>
    </div>
  );
}

function AirdropSection() {
  const [rows, setRows] = useState([]);
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    const text = await file.text();
    const parsed = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [addr, amount] = line.split(/,|;|\s+/);
        return { addr, amount: Number(amount) };
      })
      .filter((row) => row.addr && Number.isFinite(row.amount));
    setRows(parsed);
  }, []);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  return (
    <div style={styles.mainCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Airdrop Planner</h2>
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          Upload CSV data or configure claim-based campaigns.
        </span>
      </div>

      <div style={styles.gridTwo}>
        <div style={{ ...styles.fieldStack, background: "rgba(2,6,12,0.55)", padding: 16, borderRadius: 16, border: "1px solid rgba(96,165,250,0.14)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Direct Distribution</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            CSV format: <code style={styles.mono}>address,amount</code>. Review totals before executing your distribution script.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="file"
              accept=".csv,.txt"
              ref={fileRef}
              style={styles.input}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <UiButton
              label="Upload"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            />
          </div>
          <div
            style={{
              border: "1px solid rgba(96,165,250,0.18)",
              borderRadius: 12,
              padding: 12,
              background: "rgba(2,6,12,0.6)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Rows</span>
              <span style={styles.mono}>{rows.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span>Total Amount</span>
              <span style={styles.mono}>{total}</span>
            </div>
          </div>
          <UiButton label="Batch Send (placeholder)" disabled={!rows.length} />
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            For larger lists, consider a claim approach to offload fees to recipients.
          </p>
        </div>

        <div style={{ ...styles.fieldStack, background: "rgba(2,6,12,0.55)", padding: 16, borderRadius: 16, border: "1px solid rgba(96,165,250,0.14)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Claim Campaign</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Configure a claimable airdrop backed by local state or a Merkle proof.
          </p>
          <FieldBlock label="Campaign ID">
            <input style={styles.input} placeholder="airdrop-2025-01" />
          </FieldBlock>
          <FieldBlock label="ASA ID">
            <input style={styles.input} placeholder="12345678" />
          </FieldBlock>
          <FieldBlock label="Claim Amount">
            <input style={styles.input} placeholder="1000" />
          </FieldBlock>
          <UiButton label="Publish Eligibility (placeholder)" />
          <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "12px 0" }} />
          <FieldBlock label="Recipient Address">
            <input style={styles.input} placeholder="ADDR..." />
          </FieldBlock>
          <UiButton label="Claim (placeholder)" variant="secondary" />
        </div>
      </div>
    </div>
  );
}

function BurnRewardSection({ account, algod, contract }) {
  const [asaId, setAsaId] = useState(DEFAULT_ASA_ID ? String(DEFAULT_ASA_ID) : "");
  const [burnAmt, setBurnAmt] = useState(0);
  const [fundAmt, setFundAmt] = useState(100000);
  const [totalBurned, setTotalBurned] = useState(0);
  const [myShares, setMyShares] = useState(0);
  const [pool, setPool] = useState(0);
  const [optedIn, setOptedIn] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const burnMethod = useMemo(() => contract.getMethodByName("burn"), [contract]);
  const fundMethod = useMemo(() => contract.getMethodByName("fund"), [contract]);
  const claimMethod = useMemo(() => contract.getMethodByName("claim"), [contract]);

  const refresh = useCallback(async () => {
    if (!DEFAULT_APP_ID) {
      setError("Please set VITE_APP_ID before interacting with the contract.");
      return;
    }
    try {
      const appInfo = await algod.getApplicationByID(DEFAULT_APP_ID).do();
      const global = decodeState(appInfo.params["global-state"] ?? []);
      setTotalBurned(Number(global.total_burned ?? 0));
      setPool(Number(global.reward_pool ?? 0));
      if (account) {
        try {
          const localInfo = await algod
            .accountApplicationInformation(account.addr, DEFAULT_APP_ID)
            .do();
          const local = decodeState(localInfo["app-local-state"]?.["key-value"] ?? []);
          setMyShares(Number(local.shares ?? 0));
          setOptedIn(true);
        } catch (accountErr) {
          if (accountErr?.response?.status === 404) {
            setOptedIn(false);
            setMyShares(0);
          } else {
            throw accountErr;
          }
        }
      } else {
        setMyShares(0);
        setOptedIn(false);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Failed to refresh application state.");
    }
  }, [account, algod]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (label, fn) => {
    try {
      setBusyAction(label);
      setStatus(label);
      setError(null);
      await fn();
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Transaction failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleBurn = () => {
    if (!DEFAULT_APP_ID) {
      setError("Please set VITE_APP_ID before burning.");
      return;
    }
    if (!account) {
      setError("Connect a LocalNet account first.");
      return;
    }
    if (!burnAmt || burnAmt <= 0) {
      setError("Enter a burn amount greater than zero.");
      return;
    }
    const targetAsaId = Number(asaId || DEFAULT_ASA_ID);
    if (!Number.isFinite(targetAsaId) || targetAsaId <= 0) {
      setError("Set a valid ASA ID before burning.");
      return;
    }

    run("Submitting burn group…", async () => {
      const params = await algod.getTransactionParams().do();
      params.flatFee = true;
      params.fee = Math.max(params.minFee, 1000);

      const appAddress = algosdk.getApplicationAddress(DEFAULT_APP_ID);
      const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: appAddress,
        amount: burnAmt,
        assetIndex: targetAsaId,
        suggestedParams: params,
      });

      const composer = new algosdk.AtomicTransactionComposer();
      composer.addTransaction({ txn: assetTxn, signer: account.signer });
      composer.addMethodCall({
        appID: DEFAULT_APP_ID,
        method: burnMethod,
        methodArgs: [BigInt(burnAmt)],
        sender: account.addr,
        signer: account.signer,
        suggestedParams: params,
        appForeignAssets: [targetAsaId],
      });

      const result = await composer.execute(algod, 2);
      const newShares = result.methodResults[0]?.returnValue ?? 0n;
      setStatus(`Burn recorded successfully. Updated shares: ${newShares.toString()}.`);
      setBurnAmt(0);
      await refresh();
    });
  };

  const handleFund = () => {
    if (!DEFAULT_APP_ID) {
      setError("Please set VITE_APP_ID before funding.");
      return;
    }
    if (!account) {
      setError("Connect a LocalNet account first.");
      return;
    }
    if (!fundAmt || fundAmt <= 0) {
      setError("Enter a positive microAlgo amount.");
      return;
    }

    run("Funding rewards pool…", async () => {
      const params = await algod.getTransactionParams().do();
      params.flatFee = true;
      params.fee = Math.max(params.minFee, 1000);

      const appAddress = algosdk.getApplicationAddress(DEFAULT_APP_ID);
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: appAddress,
        amount: fundAmt,
        suggestedParams: params,
      });

      const composer = new algosdk.AtomicTransactionComposer();
      composer.addTransaction({ txn: payTxn, signer: account.signer });
      composer.addMethodCall({
        appID: DEFAULT_APP_ID,
        method: fundMethod,
        methodArgs: [],
        sender: account.addr,
        signer: account.signer,
        suggestedParams: params,
      });

      await composer.execute(algod, 2);
      setStatus(`Pool funded with ${fundAmt} microAlgos.`);
      await refresh();
    });
  };

  const handleClaim = () => {
    if (!DEFAULT_APP_ID) {
      setError("Please set VITE_APP_ID before claiming.");
      return;
    }
    if (!account) {
      setError("Connect a LocalNet account first.");
      return;
    }
    if (myShares <= 0) {
      setError("You have no shares to claim.");
      return;
    }

    run("Claiming rewards…", async () => {
      const params = await algod.getTransactionParams().do();
      params.flatFee = true;
      params.fee = Math.max(params.minFee, 1000);

      const composer = new algosdk.AtomicTransactionComposer();
      composer.addMethodCall({
        appID: DEFAULT_APP_ID,
        method: claimMethod,
        methodArgs: [],
        sender: account.addr,
        signer: account.signer,
        suggestedParams: params,
      });

      const result = await composer.execute(algod, 2);
      const payout = result.methodResults[0]?.returnValue ?? 0n;
      setStatus(`Claimed ${payout.toString()} microAlgos.`);
      await refresh();
    });
  };

  const handleOptIn = () => {
    if (!DEFAULT_APP_ID) {
      setError("Please set VITE_APP_ID before opting in.");
      return;
    }
    if (!account) {
      setError("Connect a LocalNet account first.");
      return;
    }
    if (optedIn) {
      setStatus("Account is already opted in.");
      return;
    }

    run("Opting in to application…", async () => {
      const params = await algod.getTransactionParams().do();
      params.flatFee = true;
      params.fee = Math.max(params.minFee, 1000);

      const optTxn = algosdk.makeApplicationOptInTxnFromObject({
        from: account.addr,
        appIndex: DEFAULT_APP_ID,
        suggestedParams: params,
      });

      const txId = optTxn.txID().toString();
      const signed = optTxn.signTxn(account.sk);
      await algod.sendRawTransaction(signed).do();
      await algosdk.waitForConfirmation(algod, txId, 2);
      setStatus("Opt-in completed.");
      setOptedIn(true);
      await refresh();
    });
  };

  return (
    <div style={styles.mainCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Burn & Reward Console</h2>
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          Execute pooled reward logic against the LiquidBurnApp smart contract.
        </span>
      </div>

      <div style={styles.gridTwo}>
        <div style={{ ...styles.fieldStack, background: "rgba(2,6,12,0.55)", padding: 16, borderRadius: 18, border: "1px solid rgba(59,130,246,0.18)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Burn Token</h3>
          <FieldBlock label="ASA ID">
            <input
              style={styles.input}
              value={asaId}
              onChange={(event) => setAsaId(event.target.value)}
              placeholder="Designated ASA for the contract"
            />
          </FieldBlock>
          <FieldBlock label="Burn Amount">
            <input
              style={styles.input}
              type="number"
              value={String(burnAmt)}
              onChange={(event) => setBurnAmt(Number(event.target.value))}
            />
          </FieldBlock>
          <UiButton
            label={busyAction === "Submitting burn group…" ? "Processing…" : "Send Burn Group"}
            onClick={handleBurn}
            disabled={Boolean(busyAction)}
          />
          <p style={{ fontSize: 12, opacity: 0.75 }}>
            This submits an ASA transfer to the app escrow followed by an ABI call to record your shares.
          </p>
          <div style={styles.statsRow}>
            <span>Connected account</span>
            <span style={styles.mono}>{account?.addr ?? "Not connected"}</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <UiButton
              label="Refresh State"
              onClick={refresh}
              variant="outline"
              size="sm"
              disabled={Boolean(busyAction)}
            />
            <UiButton
              label={optedIn ? "Opted In" : busyAction === "Opting in to application…" ? "Processing…" : "Opt In"}
              onClick={handleOptIn}
              variant="outline"
              size="sm"
              disabled={optedIn || Boolean(busyAction)}
            />
          </div>
        </div>

        <div style={{ ...styles.fieldStack, background: "rgba(2,6,12,0.55)", padding: 16, borderRadius: 18, border: "1px solid rgba(59,130,246,0.18)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Rewards Pool</h3>
          <StatRow label="Total Burned (units)" value={totalBurned} />
          <StatRow label="Your Shares" value={myShares} />
          <StatRow label="Pool Balance (microAlgos)" value={pool} />
          <FieldBlock label="Fund Amount (microAlgos)">
            <input
              style={styles.input}
              type="number"
              value={String(fundAmt)}
              onChange={(event) => setFundAmt(Number(event.target.value))}
            />
          </FieldBlock>
          <div style={{ display: "flex", gap: 10 }}>
            <UiButton
              label={busyAction === "Funding rewards pool…" ? "Processing…" : "Fund Pool"}
              onClick={handleFund}
              disabled={Boolean(busyAction) || fundAmt <= 0}
              variant="secondary"
            />
            <UiButton
              label={busyAction === "Claiming rewards…" ? "Processing…" : "Claim Rewards"}
              onClick={handleClaim}
              disabled={Boolean(busyAction) || myShares <= 0}
            />
          </div>
          <p style={{ fontSize: 12, opacity: 0.75 }}>
            Payout = (your shares / total shares) × pool balance. Claiming resets your share count.
          </p>
        </div>
      </div>

      {status && <div style={styles.status}>{status}</div>}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={styles.label}>{label}</span>
      {children}
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiLabel}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      style={{
        width: 56,
        height: 26,
        borderRadius: 999,
        border: "1px solid rgba(96,165,250,0.35)",
        background: checked ? "rgba(59,130,246,0.45)" : "rgba(2,6,12,0.6)",
        position: "relative",
        cursor: "pointer",
      }}
      type="button"
      onClick={() => onChange?.(!checked)}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 32 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#e9f5ff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={styles.statsRow}>
      <span>{label}</span>
      <span style={styles.mono}>{String(value ?? 0)}</span>
    </div>
  );
}
