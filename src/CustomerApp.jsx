import { useState, useEffect } from "react";
import {
  supabase,
  getCustomerByPhone,
  getCustomerTransactions,
  createCustomer,
} from "./supabase";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --char: #0f0d0b; --ash: #1c1916; --smoke: #2a2520;
    --ember: #c8420a; --glow: #e8651a; --flame: #f4963c;
    --gold: #d4a44c; --cream: #f5ede0; --muted: #8a7d6e;
    --line: rgba(255,255,255,0.07); --r: 12px; --r-sm: 8px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--char); color: var(--cream); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--ash); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 50; }
  .nav-logo { font-family: 'Noto Serif KR', serif; font-size: 18px; font-weight: 900; }
  .nav-logo span { color: var(--ember); }
  .nav-tabs { display: flex; gap: 4px; background: var(--smoke); border-radius: 30px; padding: 4px; }
  .nav-tab { padding: 7px 18px; border-radius: 26px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: all 0.2s; color: var(--muted); background: transparent; }
  .nav-tab.active { background: var(--ember); color: white; }
  .screen { flex: 1; padding: 20px; max-width: 420px; margin: 0 auto; width: 100%; }
  .card { background: var(--ash); border-radius: var(--r); border: 1px solid var(--line); padding: 20px; margin-bottom: 12px; }
  .card-glow { background: linear-gradient(135deg,#1e1a15,#241f18); border-radius: var(--r); border: 1px solid rgba(200,66,10,0.3); padding: 24px; margin-bottom: 12px; box-shadow: 0 0 40px rgba(200,66,10,0.08); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; border-radius: var(--r-sm); font-family: 'DM Sans', sans-serif; font-weight: 600; transition: all 0.15s; }
  .btn-primary { background: var(--ember); color: white; padding: 14px 24px; font-size: 15px; width: 100%; border-radius: var(--r); }
  .btn-primary:hover { background: var(--glow); transform: translateY(-1px); }
  .btn-secondary { background: var(--smoke); color: var(--cream); padding: 14px 24px; font-size: 15px; width: 100%; border-radius: var(--r); border: 1px solid var(--line); }
  .btn-ghost { background: transparent; color: var(--muted); padding: 10px 16px; font-size: 13px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .input-group { margin-bottom: 14px; }
  .input-label { font-size: 12px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
  .input { width: 100%; background: var(--smoke); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 12px 14px; color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 15px; transition: border-color 0.15s; outline: none; }
  .input:focus { border-color: var(--ember); }
  .input-big { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; text-align: center; padding: 16px; letter-spacing: 2px; }
  .input::placeholder { color: var(--muted); }
  .row { display: flex; align-items: center; justify-content: space-between; }
  .section-title { font-family: 'Noto Serif KR', serif; font-size: 15px; font-weight: 700; margin-bottom: 14px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .info-row:last-child { border-bottom: none; }
  .info-key { font-size: 13px; color: var(--muted); }
  .info-val { font-size: 13px; font-weight: 600; }
  .progress-track { background: var(--smoke); border-radius: 4px; height: 8px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg,var(--ember),var(--flame)); transition: width 0.6s ease; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-outlet-ss2 { background: rgba(100,140,220,0.12); color: #8aabf5; border: 1px solid rgba(100,140,220,0.2); }
  .badge-outlet-jojo { background: rgba(180,80,180,0.12); color: #d88af5; border: 1px solid rgba(180,80,180,0.2); }
  .tx-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); }
  .tx-item:last-child { border-bottom: none; }
  .tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .tx-earn { background: rgba(200,66,10,0.12); }
  .tx-redeem { background: rgba(212,164,76,0.12); }
  .tx-bonus { background: rgba(80,200,100,0.12); }
  .empty { text-align: center; padding: 40px 20px; color: var(--muted); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .qr-container { background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
  .spinner { width: 24px; height: 24px; border: 3px solid var(--line); border-top-color: var(--ember); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ember { 0%,100%{box-shadow:0 0 20px rgba(200,66,10,0.15)} 50%{box-shadow:0 0 40px rgba(200,66,10,0.35)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .anim-in { animation: fadeIn 0.35s ease forwards; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--smoke); border: 1px solid var(--line); border-radius: 30px; padding: 12px 24px; font-size: 14px; font-weight: 500; z-index: 999; animation: slideUp 0.3s ease; white-space: nowrap; max-width: 90vw; }
  .toast.success { border-color: rgba(80,200,100,0.3); color: #6ecf80; }
  .toast.error { border-color: rgba(200,80,80,0.3); color: #f08080; }

  /* WELCOME SCREEN */
  .welcome { min-height: 100vh; display: flex; flex-direction: column; background: var(--char); }
  .welcome-hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
  .welcome-fire { font-size: 80px; margin-bottom: 12px; animation: ember 3s ease-in-out infinite; }
  .welcome-title { font-family: 'Noto Serif KR', serif; font-size: 34px; font-weight: 900; line-height: 1.1; margin-bottom: 10px; }
  .welcome-sub { font-size: 13px; color: var(--muted); margin-bottom: 10px; letter-spacing: 2px; text-transform: uppercase; }
  .welcome-outlets { display: flex; gap: 8px; justify-content: center; margin-bottom: 40px; flex-wrap: wrap; }
  .outlet-chip { background: var(--smoke); border: 1px solid var(--line); border-radius: 20px; padding: 5px 14px; font-size: 12px; color: var(--muted); }
  .welcome-perks { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 320px; margin-bottom: 40px; }
  .perk-card { background: var(--ash); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 12px; text-align: center; }
  .perk-icon { font-size: 24px; margin-bottom: 6px; }
  .perk-val { font-family: 'Noto Serif KR', serif; font-size: 18px; font-weight: 900; color: var(--flame); }
  .perk-label { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .welcome-btns { width: 100%; max-width: 360px; }
`;

// ─── QR CODE ─────────────────────────────────────────────────────────────────
function QRCode({ value, size = 180 }) {
  const hash = [...value].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const cells = 21;
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if (r < 7 && c < 7) return (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4));
      if (r < 7 && c >= cells-7) return (r===0||r===6||c===cells-7||c===cells-1||(r>=2&&r<=4&&c>=cells-5&&c<=cells-3));
      if (r >= cells-7 && c < 7) return (r===cells-7||r===cells-1||c===0||c===6||(r>=cells-5&&r<=cells-3&&c>=2&&c<=4));
      return ((hash ^ (r*17+c*31)) & 1) === 1;
    })
  );
  return (
    <div className="qr-container" style={{ width:size+32, height:size+32 }}>
      <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} style={{ display:"block", imageRendering:"pixelated" }}>
        {grid.map((row, r) => row.map((filled, c) => filled
          ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#111"/>
          : null
        ))}
      </svg>
    </div>
  );
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return <div className={`toast ${type}`}>{msg}</div>;
}

const ptToRM  = pts => `RM ${(pts * 0.05).toFixed(2)}`;
const fmtRM   = v => `RM ${parseFloat(v||0).toFixed(2)}`;
const fmtDate = d => new Date(d).toLocaleString('en-MY', { dateStyle:'medium', timeStyle:'short' });

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER APP
// ═══════════════════════════════════════════════════════════════════
export default function CustomerApp() {
  const [screen, setScreen]   = useState("welcome"); // welcome | register | login | app
  const [custTab, setCustTab] = useState("home");
  const [me, setMe]           = useState(null);
  const [myTx, setMyTx]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  // Form fields
  const [regName, setRegName]     = useState("");
  const [regPhone, setRegPhone]   = useState("");
  const [loginPhone, setLoginPhone] = useState("");

  const showToast = (msg, type="success") => setToast({ msg, type });

  const refreshMe = async (id) => {
    const { data } = await supabase.from('customers').select('*').eq('id', id).single();
    if (data) setMe(data);
    const tx = await getCustomerTransactions(id);
    setMyTx(tx);
  };

  const handleRegister = async () => {
    if (!regName.trim()) return showToast("Please enter your name", "error");
    if (!regPhone.trim()) return showToast("Please enter your phone number", "error");
    setLoading(true);
    try {
      const c = await createCustomer({ name: regName.trim(), phone: regPhone.trim() });
      setMe(c);
      await refreshMe(c.id);
      setScreen("app");
      showToast("Welcome! 20 bonus points credited! 🎉");
    } catch(e) {
      showToast(e.message?.includes("unique") ? "Phone number already registered" : "Something went wrong", "error");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!loginPhone.trim()) return showToast("Please enter your phone number", "error");
    setLoading(true);
    const c = await getCustomerByPhone(loginPhone.trim());
    if (c) {
      setMe(c);
      await refreshMe(c.id);
      setScreen("app");
    } else {
      showToast("Phone number not found. Please register first.", "error");
    }
    setLoading(false);
  };

  const milePct = me ? Math.min((parseFloat(me.total_spend||0) / 750) * 100, 100) : 0;
  const mileLeft = me ? Math.max(0, 750 - parseFloat(me.total_spend||0)).toFixed(0) : 750;

  // ─── WELCOME SCREEN ───────────────────────────────────────────────
  if (screen === "welcome") return (
    <div className="welcome">
      <style>{styles}</style>
      <div className="welcome-hero">
        <div className="welcome-fire">🔥</div>
        <div className="welcome-title">Mugjar <span style={{ color:"var(--ember)" }}>Point</span></div>
        <div className="welcome-sub">Korean BBQ Loyalty</div>
        <div className="welcome-outlets">
          <span className="outlet-chip">🥩 DAORAE@SS2</span>
          <span className="outlet-chip">🍖 JOJO SIKDANG</span>
        </div>

        <div className="welcome-perks">
          <div className="perk-card">
            <div className="perk-icon">🎁</div>
            <div className="perk-val">20 pts</div>
            <div className="perk-label">Free on signup</div>
          </div>
          <div className="perk-card">
            <div className="perk-icon">🔥</div>
            <div className="perk-val">5%</div>
            <div className="perk-label">Earned per bill</div>
          </div>
          <div className="perk-card">
            <div className="perk-icon">💰</div>
            <div className="perk-val">RM0.05</div>
            <div className="perk-label">Per point value</div>
          </div>
          <div className="perk-card">
            <div className="perk-icon">🏆</div>
            <div className="perk-val">+200 pts</div>
            <div className="perk-label">At RM750 spent</div>
          </div>
        </div>

        <div className="welcome-btns">
          <button className="btn btn-primary" style={{ marginBottom:10, fontSize:16 }} onClick={()=>setScreen("register")}>
            🎉 Join & Get 20 Free Points
          </button>
          <button className="btn btn-secondary" style={{ fontSize:15 }} onClick={()=>setScreen("login")}>
            I'm Already a Member
          </button>
        </div>
      </div>
      {toast && <Toast {...toast} onDone={()=>setToast(null)}/>}
    </div>
  );

  // ─── REGISTER SCREEN ─────────────────────────────────────────────
  if (screen === "register") return (
    <div>
      <style>{styles}</style>
      <div className="screen" style={{ paddingTop:40 }}>
        <button className="btn btn-ghost" onClick={()=>setScreen("welcome")} style={{ marginBottom:24, padding:"8px 0" }}>← Back</button>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
          <div style={{ fontFamily:"Noto Serif KR,serif", fontSize:26, fontWeight:900, lineHeight:1.15 }}>Create Account</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginTop:6, lineHeight:1.6 }}>
            Join free and get <strong style={{ color:"var(--flame)" }}>20 bonus points</strong> (worth RM1.00) instantly.
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input className="input" placeholder="e.g. Lim Wei Ling" value={regName}
            onChange={e=>setRegName(e.target.value)} autoFocus/>
        </div>

        <div className="input-group">
          <label className="input-label">Mobile Number</label>
          <input className="input" placeholder="e.g. 012-3456789" type="tel"
            value={regPhone} onChange={e=>setRegPhone(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
        </div>

        <div className="card" style={{ background:"rgba(200,66,10,0.06)", border:"1px solid rgba(200,66,10,0.18)", marginBottom:20 }}>
          <div style={{ fontSize:13, color:"var(--flame)", fontWeight:700, marginBottom:6 }}>🎁 What you get on signup</div>
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.8 }}>
            ✓ 20 bonus points (RM1.00 value)<br/>
            ✓ Earn 5 pts per RM100 spent<br/>
            ✓ Redeem at both DAORAE & JOJO SIKDANG<br/>
            ✓ RM750 milestone → 200 bonus points
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? <div className="spinner" style={{ width:18, height:18, borderWidth:2 }}/> : "Create My Account →"}
        </button>

        <div style={{ marginTop:14, fontSize:12, color:"var(--muted)", textAlign:"center" }}>
          Already a member?{" "}
          <button className="btn btn-ghost" style={{ padding:"0 4px", fontSize:12, display:"inline", color:"var(--ember)" }}
            onClick={()=>setScreen("login")}>Sign in here</button>
        </div>
      </div>
      {toast && <Toast {...toast} onDone={()=>setToast(null)}/>}
    </div>
  );

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────
  if (screen === "login") return (
    <div>
      <style>{styles}</style>
      <div className="screen" style={{ paddingTop:40 }}>
        <button className="btn btn-ghost" onClick={()=>setScreen("welcome")} style={{ marginBottom:24, padding:"8px 0" }}>← Back</button>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🔥</div>
          <div style={{ fontFamily:"Noto Serif KR,serif", fontSize:26, fontWeight:900 }}>Welcome Back!</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>Enter your registered mobile number to sign in.</div>
        </div>

        <div className="input-group">
          <label className="input-label">Mobile Number</label>
          <input className="input input-big" placeholder="012-XXXXXXX" type="tel"
            value={loginPhone} onChange={e=>setLoginPhone(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
        </div>

        <button className="btn btn-primary" onClick={handleLogin} disabled={loading} style={{ marginTop:8 }}>
          {loading ? <div className="spinner" style={{ width:18, height:18, borderWidth:2 }}/> : "Sign In →"}
        </button>

        <div style={{ marginTop:14, fontSize:12, color:"var(--muted)", textAlign:"center" }}>
          New here?{" "}
          <button className="btn btn-ghost" style={{ padding:"0 4px", fontSize:12, display:"inline", color:"var(--ember)" }}
            onClick={()=>setScreen("register")}>Create an account</button>
        </div>
      </div>
      {toast && <Toast {...toast} onDone={()=>setToast(null)}/>}
    </div>
  );

  // ─── MAIN APP ─────────────────────────────────────────────────────
  if (screen === "app" && me) return (
    <div className="app anim-in">
      <style>{styles}</style>

      <nav className="nav">
        <div className="nav-logo">Mugjar <span>Point</span></div>
        <div className="nav-tabs">
          {[["home","Home"],["qr","My QR"],["history","History"]].map(([v,l]) => (
            <button key={v} className={`nav-tab ${custTab===v?"active":""}`}
              onClick={()=>{ setCustTab(v); refreshMe(me.id); }}>
              {l}
            </button>
          ))}
        </div>
      </nav>

      {/* ── HOME TAB ── */}
      {custTab === "home" && (
        <div className="screen">
          {/* Points Hero */}
          <div className="card-glow" style={{ animation:"ember 4s ease-in-out infinite", textAlign:"center" }}>
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:4 }}>
              Hello, {me.name.split(" ")[0]} 👋
            </div>
            <div style={{ fontFamily:"Noto Serif KR,serif", fontSize:72, fontWeight:900, color:"var(--flame)", lineHeight:1, letterSpacing:-2 }}>
              {me.points}
            </div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:4, textTransform:"uppercase", letterSpacing:1 }}>Mugjar Points</div>
            <div style={{ fontSize:24, fontWeight:700, color:"var(--gold)", marginTop:8 }}>
              ≈ {ptToRM(me.points)}
            </div>
            <div style={{ marginTop:14 }}>
              {me.points > 0
                ? <span style={{ background:"rgba(80,200,100,0.12)", color:"#6ecf80", border:"1px solid rgba(80,200,100,0.2)", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600 }}>
                    ✓ Points available to redeem
                  </span>
                : <span style={{ color:"var(--muted)", fontSize:12 }}>
                    Visit us to earn your first points!
                  </span>
              }
            </div>
          </div>

          {/* Milestone */}
          <div className="card">
            <div className="row" style={{ marginBottom:10 }}>
              <div style={{ fontFamily:"Noto Serif KR,serif", fontSize:14, fontWeight:700 }}>🏆 RM750 Milestone</div>
              <span style={{ fontSize:12, color:"var(--gold)", fontWeight:700 }}>{milePct.toFixed(0)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${milePct}%` }}/>
            </div>
            <div className="row" style={{ marginTop:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Spent: {fmtRM(me.total_spend)}</span>
              <span style={{ fontSize:12, color: me.milestone_awarded ? "#6ecf80" : "var(--muted)" }}>
                {me.milestone_awarded
                  ? "🎉 +200 pts Bonus Awarded!"
                  : `RM${mileLeft} to go → +200 pts`}
              </span>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <p className="section-title">How It Works</p>
            {[
              ["🔥", "Earn",      "Spend RM100 = 5 points at any visit"],
              ["🎁", "Redeem",    "Use points as cash (min. RM50 bill)"],
              ["🏆", "Milestone", "Spend RM750 total → 200 bonus points"],
              ["🔗", "Shared",    "Points work at both DAORAE & JOJO"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"11px 0", borderBottom:"1px solid var(--line)" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"var(--smoke)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:3, lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" style={{ width:"100%", marginTop:4, color:"var(--muted)", fontSize:12 }}
            onClick={()=>{ setMe(null); setScreen("welcome"); }}>
            Sign Out
          </button>
        </div>
      )}

      {/* ── QR TAB ── */}
      {custTab === "qr" && (
        <div className="screen" style={{ textAlign:"center" }}>
          <div className="card-glow" style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:1.5 }}>
              My Loyalty QR
            </div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>{me.name}</div>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <QRCode value={me.id + me.phone} size={180}/>
            </div>
            <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:13, color:"var(--muted)", letterSpacing:3 }}>
              {me.id}
            </div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <div className="info-row">
              <span className="info-key">Points Balance</span>
              <span className="info-val" style={{ color:"var(--flame)", fontSize:16, fontWeight:800 }}>{me.points} pts</span>
            </div>
            <div className="info-row">
              <span className="info-key">Cash Value</span>
              <span className="info-val" style={{ color:"var(--gold)" }}>{ptToRM(me.points)}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Total Spend</span>
              <span className="info-val">{fmtRM(me.total_spend)}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Milestone</span>
              <span className="info-val">{me.milestone_awarded ? <span style={{ color:"#6ecf80" }}>✓ Awarded</span> : `${milePct.toFixed(0)}% to RM750`}</span>
            </div>
          </div>

          <div style={{ background:"var(--ash)", border:"1px solid var(--line)", borderRadius:12, padding:"14px 16px", fontSize:13, color:"var(--muted)", lineHeight:1.8 }}>
            📲 Show this QR to staff to earn or redeem points.<br/>
            Works at <strong style={{ color:"var(--cream)" }}>DAORAE@SS2</strong> and <strong style={{ color:"var(--cream)" }}>JOJO SIKDANG</strong>.
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {custTab === "history" && (
        <div className="screen">
          <p className="section-title">Transaction History</p>
          {myTx.length === 0
            ? <div className="empty">
                <div className="empty-icon">📋</div>
                <div style={{ fontWeight:600, marginBottom:6 }}>No transactions yet</div>
                <div style={{ fontSize:12 }}>Visit us and show your QR to start earning!</div>
              </div>
            : myTx.map(tx => (
              <div className="tx-item" key={tx.id}>
                <div className={`tx-icon tx-${tx.type}`}>
                  {tx.type==="earn"?"🔥":tx.type==="redeem"?"🎁":"⭐"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>
                    {tx.type==="bonus" ? "Bonus Points" : tx.type==="earn" ? "Points Earned" : "Points Redeemed"}
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>
                    {tx.outlet !== "System" && (
                      <span className={`badge ${tx.outlet==="DAORAE@SS2"?"badge-outlet-ss2":"badge-outlet-jojo"}`}
                        style={{ fontSize:10, marginRight:6 }}>
                        {tx.outlet==="DAORAE@SS2"?"SS2":"JOJO"}
                      </span>
                    )}
                    {fmtDate(tx.created_at)}
                  </div>
                  {tx.amount > 0 && (
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Bill: {fmtRM(tx.amount)}</div>
                  )}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:tx.points_change>0?"var(--flame)":"var(--gold)" }}>
                    {tx.points_change>0?"+":""}{tx.points_change}
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>pts</div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      <div style={{ height:20 }}/>
      {toast && <Toast {...toast} onDone={()=>setToast(null)}/>}
    </div>
  );

  return null;
}
