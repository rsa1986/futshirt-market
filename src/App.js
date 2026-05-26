import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

/* ── TOKENS ── */
const C = {
  green:"#16a34a", greenLight:"#dcfce7", greenDark:"#14532d",
  gray50:"#f9fafb", gray100:"#f3f4f6", gray200:"#e5e7eb",
  gray400:"#9ca3af", gray600:"#4b5563", gray900:"#111827",
  white:"#ffffff", red:"#ef4444", redLight:"#fef2f2",
  amber:"#f59e0b", amberLight:"#fffbeb",
  purple:"#7c3aed", purpleLight:"#f5f3ff",
  blue:"#2563eb", blueLight:"#eff6ff",
};
const rCol = { "Comum":C.blue,"Rara":C.purple,"Muito Rara":C.amber,"Lendária":C.red };
const rBg  = { "Comum":C.blueLight,"Rara":C.purpleLight,"Muito Rara":C.amberLight,"Lendária":C.redLight };
const badgeIcon = { "Top Vendedor":"🏆","Verificado":"✅","Colecionador Lendário":"👑","100+ Vendas":"💯","Membro Fundador":"⭐" };

/* ── FILTER TAXONOMY ── */
const SPORTS = [{ id:"futebol",label:"⚽ Futebol" },{ id:"basquete",label:"🏀 Basquete",soon:true },{ id:"americano",label:"🏈 Futebol Americano",soon:true }];
const TYPES  = [{ id:"times",label:"🏟️ Times" },{ id:"selecoes",label:"🌎 Seleções" }];
const REGIONS = {
  times:   [{ id:"nacional",label:"🇧🇷 Nacional (Brasil)" },{ id:"europa",label:"🌍 Europa" },{ id:"america_sul",label:"🌎 América do Sul" },{ id:"america_norte",label:"🌐 América do Norte" },{ id:"africa",label:"🌍 África" },{ id:"asia",label:"🌏 Ásia" }],
  selecoes:[{ id:"america_sul",label:"🌎 América do Sul" },{ id:"europa",label:"🌍 Europa" },{ id:"africa",label:"🌍 África" },{ id:"america_norte",label:"🌐 América do Norte" },{ id:"asia",label:"🌏 Ásia" }],
};
const CONDITIONS = ["Nova","Usada"];
const RARITIES   = ["Comum","Rara","Muito Rara","Lendária"];
const SIZES      = ["PP","P","M","G","GG"];
const PRICES     = [{ id:"all",label:"Qualquer preço" },{ id:"0-300",label:"Até R$ 300" },{ id:"300-800",label:"R$ 300–800" },{ id:"800-2000",label:"R$ 800–2000" },{ id:"2000+",label:"Acima de R$ 2000" }];
const EMOJI_OPTS = ["🔴","🔵","🟡","⚫","⚪","🟢","🟣","🟠","⚽","🏆","🌟","📸","👑","🌍","🌎","🇧🇷","🇦🇷","🇮🇹","🇪🇸","🏟️"];
const BANNERS = [
  { id:1,label:"LANÇAMENTO",title:"Camisetas Lendárias",sub:"Peças raras dos anos 80 e 90 com procedência garantida",cta:"Explorar coleção",grad:"linear-gradient(120deg,#14532d 0%,#166534 60%,#15803d 100%)",accent:"#4ade80",img:"👑" },
  { id:2,label:"PROMOÇÃO",title:"Até 40% OFF",sub:"Colecionadores verificados com descontos exclusivos esta semana",cta:"Ver ofertas",grad:"linear-gradient(120deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)",accent:"#93c5fd",img:"🏷️" },
  { id:3,label:"DESTAQUE",title:"Copa do Mundo 2002",sub:"Reviva a glória do pentacampeonato com réplicas originais",cta:"Ver camisetas",grad:"linear-gradient(120deg,#78350f 0%,#b45309 60%,#d97706 100%)",accent:"#fcd34d",img:"🏆" },
];

/* ── HELPERS ── */
function Avatar({ name, size=40 }) {
  const colors = ["#dbeafe","#fce7f3","#dcfce7","#fef3c7","#f3e8ff","#fee2e2"];
  const fgs    = ["#1d4ed8","#be185d","#15803d","#b45309","#7c3aed","#991b1b"];
  const i = (name||"?").charCodeAt(0) % colors.length;
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{ width:size,height:size,borderRadius:"50%",background:colors[i],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:size*.28,color:fgs[i],flexShrink:0 }}>{initials}</div>;
}
function Tag({ rarity }) {
  return <span style={{ display:"inline-flex",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,background:rBg[rarity],color:rCol[rarity] }}>{rarity}</span>;
}
function Star({ v }) { return <span style={{ color:C.amber,fontSize:12 }}>{"★".repeat(Math.floor(v||0))}{"☆".repeat(5-Math.floor(v||0))}</span>; }
function Pill({ active,onClick,children,disabled,soon }) {
  return <button onClick={disabled?undefined:onClick} style={{ padding:"6px 14px",borderRadius:99,border:`1.5px solid ${active?C.green:C.gray200}`,background:active?C.greenLight:C.white,color:active?C.greenDark:disabled?"#c4c4c4":C.gray600,fontSize:13,fontWeight:active?600:400,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:disabled?.6:1,display:"inline-flex",alignItems:"center",gap:5 }}>{children}{soon&&<span style={{ fontSize:10,background:C.gray100,color:C.gray400,borderRadius:4,padding:"1px 5px" }}>em breve</span>}</button>;
}
function SectionHead({ icon,title,sub,action,onAction }) {
  return <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16 }}><div><p style={{ margin:"0 0 2px",fontSize:11,fontWeight:600,letterSpacing:1,color:C.green,textTransform:"uppercase" }}>{icon} {sub}</p><h3 style={{ margin:0,fontSize:19,fontWeight:700,color:C.gray900 }}>{title}</h3></div>{action&&<span onClick={onAction} style={{ fontSize:13,color:C.green,cursor:"pointer",fontWeight:500 }}>{action} →</span>}</div>;
}
function Spinner() {
  return <div style={{ textAlign:"center",padding:"3rem",color:C.gray400 }}><div style={{ fontSize:32,marginBottom:8 }}>⏳</div><p>Carregando...</p></div>;
}

/* ── BANNER ── */
function BannerCarousel({ onCta }) {
  const [idx,setIdx] = useState(0);
  const timer = useRef(null);
  const go = i => setIdx((i+BANNERS.length)%BANNERS.length);
  useEffect(()=>{ timer.current=setInterval(()=>go(idx+1),4000); return()=>clearInterval(timer.current); },[idx]);
  const b = BANNERS[idx];
  return (
    <div style={{ borderRadius:18,overflow:"hidden",marginBottom:28,position:"relative",background:b.grad,minHeight:180 }}>
      <div style={{ padding:"2rem 2rem 1.75rem",position:"relative",zIndex:1 }}>
        <span style={{ display:"inline-flex",padding:"3px 10px",borderRadius:99,background:"rgba(255,255,255,.18)",color:C.white,fontSize:11,fontWeight:600,letterSpacing:1.5,marginBottom:10 }}>{b.label}</span>
        <h2 style={{ margin:"0 0 6px",fontSize:24,fontWeight:800,color:C.white }}>{b.title}</h2>
        <p style={{ margin:"0 0 18px",fontSize:13,color:"rgba(255,255,255,.8)",maxWidth:320,lineHeight:1.6 }}>{b.sub}</p>
        <button onClick={onCta} style={{ padding:"9px 18px",borderRadius:10,border:"none",background:b.accent,color:C.greenDark,fontWeight:700,fontSize:13,cursor:"pointer" }}>{b.cta} →</button>
      </div>
      <div style={{ position:"absolute",right:24,top:"50%",transform:"translateY(-50%)",fontSize:72,opacity:.2 }}>{b.img}</div>
      <div style={{ position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6 }}>
        {BANNERS.map((_,i)=><div key={i} onClick={()=>{ clearInterval(timer.current); go(i); }} style={{ width:i===idx?20:7,height:7,borderRadius:99,background:i===idx?"rgba(255,255,255,.95)":"rgba(255,255,255,.35)",cursor:"pointer",transition:"all .3s" }} />)}
      </div>
      {["←","→"].map((a,d)=><button key={a} onClick={()=>{ clearInterval(timer.current); go(idx+(d?1:-1)); }} style={{ position:"absolute",top:"50%",transform:"translateY(-50%)",[d?"right":"left"]:10,background:"rgba(255,255,255,.2)",border:"none",color:C.white,borderRadius:"50%",width:30,height:30,fontSize:14,cursor:"pointer" }}>{a}</button>)}
    </div>
  );
}

/* ── SHIRT CARD ── */
function ShirtCard({ s,wishlist,toggleWishlist,onOpen }) {
  const disc = s.price_old ? Math.round((1-s.price/s.price_old)*100) : 0;
  const photo = (s.photos||[])[0] || "⚽";
  return (
    <div onClick={()=>onOpen(s.id)} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column" }}>
      <div style={{ background:C.gray50,padding:"1.25rem 1rem 1rem",textAlign:"center",fontSize:44,position:"relative" }}>
        {photo}
        {(s.photos||[]).length>1&&<span style={{ position:"absolute",bottom:6,right:8,fontSize:10,color:C.gray400,background:C.white,borderRadius:5,padding:"1px 5px",border:`1px solid ${C.gray200}` }}>+{s.photos.length-1}</span>}
        {disc>0&&<span style={{ position:"absolute",top:8,left:8,background:C.red,color:C.white,fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6 }}>-{disc}%</span>}
        <button onClick={e=>{ e.stopPropagation(); toggleWishlist(s.id); }} style={{ position:"absolute",top:8,right:8,background:"rgba(255,255,255,.85)",border:"none",width:28,height:28,borderRadius:"50%",fontSize:15,cursor:"pointer",color:wishlist.includes(s.id)?C.red:C.gray400 }}>
          {wishlist.includes(s.id)?"♥":"♡"}
        </button>
      </div>
      <div style={{ padding:"10px 12px 13px",flex:1,display:"flex",flexDirection:"column",gap:5 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <p style={{ margin:0,fontWeight:600,fontSize:13,color:C.gray900 }}>{s.team}</p>
          <Tag rarity={s.rarity} />
        </div>
        <p style={{ margin:0,color:C.gray400,fontSize:11 }}>{s.year} · {s.edition}</p>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}><Star v={s.rating}/><span style={{ fontSize:11,color:C.gray400 }}>({s.reviews||0})</span></div>
        <div style={{ display:"flex",alignItems:"baseline",gap:7,marginTop:"auto" }}>
          <span style={{ fontWeight:700,color:C.green,fontSize:15 }}>R$ {Number(s.price).toLocaleString("pt-BR")}</span>
          {s.price_old&&<span style={{ fontSize:11,color:C.gray400,textDecoration:"line-through" }}>R$ {Number(s.price_old).toLocaleString("pt-BR")}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── FILTER BAR ── */
function FilterBar({ filters,setFilters,search,setSearch }) {
  const { sport,type,region,condition,rarity,size,price } = filters;
  const set = (key,val) => setFilters(f=>({ ...f,[key]:f[key]===val?null:val }));
  const regionList = type ? REGIONS[type] : [];
  const activeCount = [sport,type,region,condition,rarity,size,price&&price!=="all"?price:null].filter(Boolean).length;
  return (
    <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"14px 16px",marginBottom:18 }}>
      <div style={{ position:"relative",marginBottom:14 }}>
        <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:16 }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar time, seleção, edição, país..." style={{ width:"100%",padding:"10px 14px 10px 40px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",outline:"none" }} />
        {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:16 }}>×</button>}
      </div>
      <div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Esporte</p>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{SPORTS.map(s=><Pill key={s.id} active={sport===s.id} onClick={()=>set("sport",s.id)} disabled={s.soon} soon={s.soon}>{s.label}</Pill>)}</div>
      </div>
      {sport&&<div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Tipo</p>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{TYPES.map(t=><Pill key={t.id} active={type===t.id} onClick={()=>{ set("type",t.id); setFilters(f=>({...f,region:null})); }}>{t.label}</Pill>)}</div>
      </div>}
      {sport&&type&&<div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Região</p>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{regionList.map(r=><Pill key={r.id} active={region===r.id} onClick={()=>set("region",r.id)}>{r.label}</Pill>)}</div>
      </div>}
      <div style={{ height:1,background:C.gray100,margin:"10px 0" }} />
      <div style={{ display:"flex",flexWrap:"wrap",gap:14 }}>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Condição</p><div style={{ display:"flex",gap:6 }}>{CONDITIONS.map(c=><Pill key={c} active={condition===c} onClick={()=>set("condition",c)}>{c}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Raridade</p><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{RARITIES.map(r=><Pill key={r} active={rarity===r} onClick={()=>set("rarity",r)}><span style={{ color:rCol[r] }}>●</span>{r}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Tamanho</p><div style={{ display:"flex",gap:6 }}>{SIZES.map(s=><Pill key={s} active={size===s} onClick={()=>set("size",s)}>{s}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Preço</p><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{PRICES.map(p=><Pill key={p.id} active={price===p.id&&p.id!=="all"} onClick={()=>set("price",p.id==="all"?null:p.id)}>{p.label}</Pill>)}</div></div>
      </div>
      {activeCount>0&&<div style={{ display:"flex",alignItems:"center",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.gray100}` }}>
        <span style={{ fontSize:12,color:C.gray400 }}>{activeCount} filtro{activeCount>1?"s":""} ativo{activeCount>1?"s":""}:</span>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",flex:1 }}>
          {sport&&<ActiveTag label={SPORTS.find(s=>s.id===sport)?.label} onRemove={()=>setFilters(f=>({...f,sport:null,type:null,region:null}))} />}
          {type&&<ActiveTag label={TYPES.find(t=>t.id===type)?.label} onRemove={()=>setFilters(f=>({...f,type:null,region:null}))} />}
          {region&&<ActiveTag label={regionList.find(r=>r.id===region)?.label} onRemove={()=>setFilters(f=>({...f,region:null}))} />}
          {condition&&<ActiveTag label={condition} onRemove={()=>setFilters(f=>({...f,condition:null}))} />}
          {rarity&&<ActiveTag label={rarity} onRemove={()=>setFilters(f=>({...f,rarity:null}))} />}
          {size&&<ActiveTag label={`Tam. ${size}`} onRemove={()=>setFilters(f=>({...f,size:null}))} />}
          {price&&price!=="all"&&<ActiveTag label={PRICES.find(p=>p.id===price)?.label} onRemove={()=>setFilters(f=>({...f,price:null}))} />}
        </div>
        <button onClick={()=>setFilters({sport:null,type:null,region:null,condition:null,rarity:null,size:null,price:null})} style={{ fontSize:12,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:500,whiteSpace:"nowrap" }}>Limpar tudo</button>
      </div>}
    </div>
  );
}
function ActiveTag({ label,onRemove }) {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,background:C.greenLight,color:C.greenDark,fontSize:12,fontWeight:500 }}>{label}<button onClick={onRemove} style={{ background:"none",border:"none",color:C.green,cursor:"pointer",fontSize:14,padding:0,lineHeight:1 }}>×</button></span>;
}

/* ══ MAIN APP ══ */
export default function App() {
  const [user,setUser]           = useState(null);
  const [profile,setProfile]     = useState(null);
  const [loading,setLoading]     = useState(true);
  const [authStep,setAuthStep]   = useState("login"); // login | register
  const [authError,setAuthError] = useState("");
  const [authLoading,setAuthLoading] = useState(false);
  const [page,setPage]           = useState("home");
  const [shirts,setShirts]       = useState([]);
  const [shirtsLoading,setShirtsLoading] = useState(true);
  const [wishlist,setWishlist]   = useState([]);
  const [following,setFollowing] = useState([]);
  const [selectedId,setSelectedId] = useState(null);
  const [selectedShirt,setSelectedShirt] = useState(null);
  const [sellerSlug,setSellerSlug] = useState(null);
  const [sellerProfile,setSellerProfile] = useState(null);
  const [photoIdx,setPhotoIdx]   = useState(0);
  const [search,setSearch]       = useState("");
  const [filters,setFilters]     = useState({ sport:null,type:null,region:null,condition:null,rarity:null,size:null,price:null });
  const [sortBy,setSortBy]       = useState("relevancia");
  const [formStep,setFormStep]   = useState(1);
  const [formDone,setFormDone]   = useState(false);
  const [formSaving,setFormSaving] = useState(false);
  const emptyForm = { team:"",country:"",year:"",edition:"",condition:"Nova",price:"",price_old:"",size:"M",rarity:"Comum",type:"times",region:"nacional",description:"",photos:[] };
  const [form,setForm]           = useState(emptyForm);
  const [reg,setReg]             = useState({ name:"",email:"",password:"",city:"",bio:"" });
  const [loginData,setLoginData] = useState({ email:"",password:"" });

  // ── load session ──
  useEffect(()=>{
    supabase.auth.getSession().then(({ data:{ session } })=>{
      setUser(session?.user || null);
      if(session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user || null);
      if(session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // ── load shirts ──
  useEffect(()=>{
    loadShirts();
  },[]);

  async function loadShirts() {
    setShirtsLoading(true);
    const { data } = await supabase.from("shirts").select("*, profiles(name, rating)").order("created_at",{ ascending:false });
    setShirts(data||[]);
    setShirtsLoading(false);
  }

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(data);
    setLoading(false);
  }

  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email:loginData.email, password:loginData.password });
    if(error) setAuthError("Email ou senha incorretos.");
    setAuthLoading(false);
  }

  async function handleRegister() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({
      email:reg.email, password:reg.password,
      options:{ data:{ full_name:reg.name } }
    });
    if(error) setAuthError(error.message);
    else {
      // update profile with extra info
      const { data:{ session } } = await supabase.auth.getSession();
      if(session) await supabase.from("profiles").update({ location:reg.city, bio:reg.bio }).eq("id",session.user.id);
      setAuthError("✅ Conta criada! Verifique seu email para confirmar.");
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setPage("home");
  }

  async function toggleWishlist(shirtId) {
    if(!user) return;
    if(wishlist.includes(shirtId)) {
      setWishlist(w=>w.filter(x=>x!==shirtId));
      await supabase.from("wishlist").delete().eq("user_id",user.id).eq("shirt_id",shirtId);
    } else {
      setWishlist(w=>[...w,shirtId]);
      await supabase.from("wishlist").insert({ user_id:user.id, shirt_id:shirtId });
    }
  }

  async function handleAddShirt() {
    setFormSaving(true);
    const { error } = await supabase.from("shirts").insert({
      team:form.team, country:form.country, year:parseInt(form.year)||2024,
      edition:form.edition, condition:form.condition, price:parseFloat(form.price)||0,
      price_old:parseFloat(form.price_old)||null, size:form.size, rarity:form.rarity,
      type:form.type, region:form.region, description:form.description,
      photos:form.photos, seller_id:user.id, featured:false,
    });
    if(!error) { await loadShirts(); setFormDone(true); }
    else alert("Erro ao salvar: "+error.message);
    setFormSaving(false);
  }

  async function openShirt(id) {
    setSelectedId(id);
    setPhotoIdx(0);
    const { data } = await supabase.from("shirts").select("*, profiles(*)").eq("id",id).single();
    setSelectedShirt(data);
  }

  async function openSeller(sellerId) {
    setSellerSlug(sellerId);
    const { data } = await supabase.from("profiles").select("*").eq("id",sellerId).single();
    setSellerProfile(data);
  }

  // apply filters
  function applyFilters(list) {
    return list.filter(s=>{
      if(search && !`${s.team} ${s.edition} ${s.country} ${s.year}`.toLowerCase().includes(search.toLowerCase())) return false;
      if(filters.type      && s.type      !== filters.type)      return false;
      if(filters.region    && s.region    !== filters.region)    return false;
      if(filters.condition && s.condition !== filters.condition) return false;
      if(filters.rarity    && s.rarity    !== filters.rarity)    return false;
      if(filters.size      && s.size      !== filters.size)      return false;
      if(filters.price && filters.price!=="all") {
        const [mn,mx] = filters.price==="2000+"?[2000,Infinity]:filters.price.split("-").map(Number);
        if(s.price<mn||s.price>mx) return false;
      }
      return true;
    }).sort((a,b)=>sortBy==="preco_asc"?a.price-b.price:sortBy==="preco_desc"?b.price-a.price:sortBy==="avaliacao"?(b.rating||0)-(a.rating||0):0);
  }

  const filtered = applyFilters(shirts);
  const promos   = shirts.filter(s=>s.price_old);
  const featured = shirts.filter(s=>s.featured&&!s.price_old);

  // ── LOADING ──
  if(loading) return <div style={{ fontFamily:"system-ui,sans-serif",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;

  // ── AUTH ──
  if(!user) return (
    <div style={{ fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:C.gray50,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
      <div style={{ width:"100%",maxWidth:400 }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ width:60,height:60,borderRadius:16,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px" }}>⚽</div>
          <h1 style={{ margin:0,fontSize:22,fontWeight:800,color:C.gray900 }}>FutShirt Market</h1>
          <p style={{ margin:"4px 0 0",color:C.gray400,fontSize:13 }}>O marketplace dos colecionadores</p>
        </div>
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:20,padding:"1.75rem" }}>
          {authStep==="login" ? <>
            <h3 style={{ margin:"0 0 1.25rem",fontWeight:700,fontSize:17,textAlign:"center" }}>Entrar na conta</h3>
            {authError&&<p style={{ margin:"0 0 12px",padding:"10px 14px",background:authError.startsWith("✅")?C.greenLight:C.redLight,color:authError.startsWith("✅")?C.greenDark:C.red,borderRadius:8,fontSize:13 }}>{authError}</p>}
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:"1.25rem" }}>
              {[["Email","email","email"],["Senha","password","password"]].map(([l,k,t])=>(
                <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label><input type={t} value={loginData[k]} onChange={e=>setLoginData(d=>({...d,[k]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} /></div>
              ))}
            </div>
            <button onClick={handleLogin} disabled={authLoading||!loginData.email||!loginData.password} style={{ width:"100%",padding:"12px 0",background:C.green,color:C.white,border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,opacity:authLoading?.7:1 }}>{authLoading?"Entrando...":"Entrar"}</button>
            <div style={{ display:"flex",alignItems:"center",gap:8,margin:"1rem 0" }}><div style={{ flex:1,height:1,background:C.gray200 }}/><span style={{ fontSize:12,color:C.gray400 }}>ou</span><div style={{ flex:1,height:1,background:C.gray200 }}/></div>
            <p style={{ textAlign:"center",fontSize:13,color:C.gray600,margin:0 }}>Não tem conta? <span onClick={()=>{ setAuthStep("register"); setAuthError(""); }} style={{ color:C.green,cursor:"pointer",fontWeight:600 }}>Criar conta grátis</span></p>
          </> : <>
            <button onClick={()=>{ setAuthStep("login"); setAuthError(""); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:13,cursor:"pointer",padding:"0 0 1rem" }}>← Voltar</button>
            <h3 style={{ margin:"0 0 1.1rem",fontWeight:700,fontSize:17 }}>Criar conta</h3>
            {authError&&<p style={{ margin:"0 0 12px",padding:"10px 14px",background:authError.startsWith("✅")?C.greenLight:C.redLight,color:authError.startsWith("✅")?C.greenDark:C.red,borderRadius:8,fontSize:13 }}>{authError}</p>}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {[["Nome completo *","name","text"],["Email *","email","email"],["Senha *","password","password"],["Cidade / Estado","city","text"]].map(([l,k,t])=>(
                <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>{l}</label><input type={t} value={reg[k]} onChange={e=>setReg(r=>({...r,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} /></div>
              ))}
              <div><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>Sobre você</label><textarea value={reg.bio} onChange={e=>setReg(r=>({...r,bio:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
            </div>
            <button onClick={handleRegister} disabled={authLoading||!reg.name||!reg.email||!reg.password} style={{ marginTop:"1rem",width:"100%",padding:"12px 0",background:C.green,color:C.white,border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,opacity:authLoading?.7:1 }}>{authLoading?"Criando conta...":"Criar conta"}</button>
          </>}
        </div>
      </div>
    </div>
  );

  // ── ADD PRODUCT ──
  if(page==="addProduct") {
    const addPhoto = em => { if(form.photos.length<6&&!form.photos.includes(em)) setForm(f=>({...f,photos:[...f.photos,em]})); };
    const removePhoto = em => setForm(f=>({...f,photos:f.photos.filter(p=>p!==em)}));
    if(formDone) return (
      <div style={{ fontFamily:"system-ui,sans-serif",textAlign:"center",padding:"4rem 1rem" }}>
        <div style={{ fontSize:56,marginBottom:12 }}>🎉</div>
        <h2 style={{ fontWeight:700 }}>Anúncio publicado!</h2>
        <p style={{ color:C.gray400 }}>Sua camiseta já está visível no catálogo.</p>
        <button onClick={()=>{ setPage("catalog"); setForm(emptyForm); setFormStep(1); setFormDone(false); }} style={{ marginTop:12,padding:"10px 24px",background:C.green,color:C.white,border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>Ver catálogo →</button>
      </div>
    );
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:560,margin:"0 auto",padding:"0 0 3rem" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"1rem 0 1.5rem" }}>
          <button onClick={()=>setPage("home")} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer" }}>←</button>
          <h2 style={{ margin:0,fontWeight:700,fontSize:18 }}>Cadastrar camiseta</h2>
        </div>
        <div style={{ display:"flex",gap:6,marginBottom:6 }}>{[1,2,3].map(n=><div key={n} style={{ flex:1,height:4,borderRadius:4,background:formStep>=n?C.green:C.gray200 }} />)}</div>
        <p style={{ margin:"0 0 1.5rem",fontSize:12,color:C.gray400 }}>Passo {formStep} de 3 — {["","Dados da camiseta","Fotos do produto","Revisão e publicação"][formStep]}</p>
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,padding:"1.5rem" }}>
          {formStep===1&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[["Time *","team","text"],["País *","country","text"],["Ano","year","number"],["Edição","edition","text"],["Preço (R$) *","price","number"],["Preço original","price_old","number"]].map(([l,k,t])=>(
              <div key={k} style={{ gridColumn:k==="price_old"?"1/-1":"auto" }}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label><input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} /></div>
            ))}
            {[["Tipo","type",[["times","Times"],["selecoes","Seleções"]]],["Região","region",[["nacional","Nacional"],["europa","Europa"],["america_sul","Am. Sul"],["america_norte","Am. Norte"],["africa","África"],["asia","Ásia"]]],["Condição","condition",[["Nova","Nova"],["Usada","Usada"]]],["Tamanho","size",[["PP","PP"],["P","P"],["M","M"],["G","G"],["GG","GG"]]],["Raridade","rarity",[["Comum","Comum"],["Rara","Rara"],["Muito Rara","Muito Rara"],["Lendária","Lendária"]]]].map(([l,k,opts])=>(
              <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label><select value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>{opts.map(([v,lbl])=><option key={v} value={v}>{lbl}</option>)}</select></div>
            ))}
            <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Descrição</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
          </div>}
          {formStep===2&&<div>
            <p style={{ margin:"0 0 1rem",fontSize:14 }}>Selecione até <b>6 fotos</b>.</p>
            {form.photos.length>0&&<div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 }}>{form.photos.map((em,i)=><div key={i} style={{ position:"relative",background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"8px 12px",fontSize:28 }}>{em}{i===0&&<span style={{ position:"absolute",bottom:-1,left:4,fontSize:9,background:C.green,color:C.white,borderRadius:4,padding:"1px 4px" }}>capa</span>}<button onClick={()=>removePhoto(em)} style={{ position:"absolute",top:-6,right:-6,background:C.red,border:"none",borderRadius:"50%",width:16,height:16,fontSize:9,color:C.white,cursor:"pointer" }}>✕</button></div>)}</div>}
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>{EMOJI_OPTS.map(em=><button key={em} onClick={()=>addPhoto(em)} disabled={form.photos.includes(em)||form.photos.length>=6} style={{ fontSize:22,padding:"6px 10px",border:`1px solid ${form.photos.includes(em)?C.green:C.gray200}`,borderRadius:8,background:form.photos.includes(em)?C.greenLight:C.white,cursor:"pointer",opacity:form.photos.length>=6&&!form.photos.includes(em)?.4:1 }}>{em}</button>)}</div>
          </div>}
          {formStep===3&&<div>
            <div style={{ display:"flex",gap:14,marginBottom:16,alignItems:"flex-start" }}>
              <div style={{ background:C.gray50,borderRadius:12,padding:"1rem",fontSize:38 }}>{form.photos[0]||"❓"}</div>
              <div style={{ flex:1 }}><h3 style={{ margin:"0 0 3px",fontWeight:700,fontSize:16 }}>{form.team||"—"}</h3><p style={{ margin:"0 0 6px",fontSize:13,color:C.gray600 }}>{form.edition} · {form.year} · {form.country}</p><Tag rarity={form.rarity} /></div>
              <div style={{ textAlign:"right" }}><p style={{ margin:0,fontWeight:700,color:C.green,fontSize:20 }}>R$ {parseFloat(form.price||0).toLocaleString("pt-BR")}</p>{form.price_old&&<p style={{ margin:0,fontSize:12,color:C.gray400,textDecoration:"line-through" }}>R$ {parseFloat(form.price_old).toLocaleString("pt-BR")}</p>}</div>
            </div>
            {form.photos.length>0&&<div style={{ display:"flex",gap:6,marginBottom:12 }}>{form.photos.map((em,i)=><span key={i} style={{ fontSize:20,background:C.gray50,borderRadius:8,padding:"4px 8px" }}>{em}</span>)}</div>}
            {form.description&&<p style={{ fontSize:13,color:C.gray600,background:C.gray50,borderRadius:10,padding:"10px 14px",margin:0 }}>{form.description}</p>}
          </div>}
        </div>
        <div style={{ display:"flex",gap:10,marginTop:14 }}>
          {formStep>1&&<button onClick={()=>setFormStep(s=>s-1)} style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:14 }}>← Anterior</button>}
          {formStep<3
            ?<button onClick={()=>setFormStep(s=>s+1)} disabled={formStep===1&&(!form.team||!form.price)} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:formStep===1&&(!form.team||!form.price)?C.gray200:C.green,color:C.white,cursor:formStep===1&&(!form.team||!form.price)?"not-allowed":"pointer",fontSize:14,fontWeight:600 }}>Próximo →</button>
            :<button onClick={handleAddShirt} disabled={formSaving} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600 }}>{formSaving?"Salvando...":"Publicar anúncio ✓"}</button>
          }
        </div>
      </div>
    );
  }

  // ── SELLER PROFILE ──
  if(sellerSlug) {
    const sellerShirts = shirts.filter(sh=>sh.seller_id===sellerSlug);
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
        <button onClick={()=>{ setSellerSlug(null); setSellerProfile(null); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"1rem 0" }}>← Voltar</button>
        {!sellerProfile ? <Spinner /> : <>
          <div style={{ background:`linear-gradient(120deg,${C.greenDark},${C.green})`,borderRadius:18,height:90 }} />
          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 4px",marginTop:-32,marginBottom:14 }}>
            <div style={{ border:`3px solid ${C.white}`,borderRadius:"50%" }}><Avatar name={sellerProfile.name} size={64} /></div>
            <button style={{ padding:"6px 14px",border:`1px solid ${C.gray200}`,borderRadius:9,background:C.white,cursor:"pointer",fontSize:13,marginBottom:4 }}>Mensagem</button>
          </div>
          <h2 style={{ margin:"0 0 2px",fontWeight:700,fontSize:20 }}>{sellerProfile.name}</h2>
          <p style={{ margin:"0 0 8px",color:C.gray400,fontSize:13 }}>📍 {sellerProfile.location||"—"}</p>
          <p style={{ margin:"0 0 14px",fontSize:14,color:C.gray600,lineHeight:1.6 }}>{sellerProfile.bio||""}</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14 }}>
            {[["Vendas",sellerProfile.sales||0],["Seguidores",sellerProfile.followers||0],["Avaliação",sellerProfile.rating||5.0],["Desde",sellerProfile.joined||"—"]].map(([l,v])=>(
              <div key={l} style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"0.7rem",textAlign:"center" }}><p style={{ margin:0,fontSize:18,fontWeight:700 }}>{v}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.gray400 }}>{l}</p></div>
            ))}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:18 }}>
            {(sellerProfile.badges||[]).map(b=><span key={b} style={{ background:"#fefce8",color:"#854d0e",border:"1px solid #fde68a",borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:500 }}>{badgeIcon[b]||"🏅"} {b}</span>)}
          </div>
          <SectionHead icon="🏷️" sub="anúncios" title={`${sellerShirts.length} itens à venda`} />
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:12 }}>
            {sellerShirts.map(sh=><ShirtCard key={sh.id} s={sh} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={id=>{ setSellerSlug(null); openShirt(id); }} />)}
          </div>
        </>}
      </div>
    );
  }

  // ── ITEM DETAIL ──
  if(selectedId) {
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
        <button onClick={()=>{ setSelectedId(null); setSelectedShirt(null); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"1rem 0" }}>← Voltar</button>
        {!selectedShirt ? <Spinner /> : (()=>{
          const s = selectedShirt;
          const sl = s.profiles;
          return (
            <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:20,overflow:"hidden" }}>
              <div style={{ background:C.gray50,padding:"3rem 1rem 2rem",textAlign:"center",fontSize:88 }}>{(s.photos||[])[photoIdx]||"⚽"}</div>
              {(s.photos||[]).length>1&&<div style={{ display:"flex",justifyContent:"center",gap:8,padding:"10px",borderBottom:`1px solid ${C.gray100}` }}>
                {s.photos.map((em,i)=><button key={i} onClick={()=>setPhotoIdx(i)} style={{ fontSize:20,padding:"6px 10px",borderRadius:9,border:i===photoIdx?`2px solid ${C.green}`:`1px solid ${C.gray200}`,background:i===photoIdx?C.greenLight:C.gray50,cursor:"pointer" }}>{em}</button>)}
              </div>}
              <div style={{ padding:"1.5rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div><h2 style={{ margin:"0 0 4px",fontSize:21,fontWeight:700 }}>{s.team}</h2><p style={{ margin:0,color:C.gray400,fontSize:13 }}>{s.edition} · {s.year} · {s.country}</p></div>
                  <Tag rarity={s.rarity} />
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:14 }}><Star v={s.rating}/><span style={{ fontSize:13,color:C.gray400 }}>({s.reviews||0} avaliações)</span></div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14 }}>
                  {[["Condição",s.condition],["Tamanho",s.size],["Fotos",`${(s.photos||[]).length} imagens`]].map(([l,v])=>(
                    <div key={l} style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"9px 12px",textAlign:"center" }}><p style={{ margin:0,fontSize:11,color:C.gray400 }}>{l}</p><p style={{ margin:"3px 0 0",fontSize:13,fontWeight:600 }}>{v}</p></div>
                  ))}
                </div>
                {sl&&<div onClick={()=>{ setSelectedId(null); setSelectedShirt(null); openSeller(s.seller_id); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:C.gray50,borderRadius:12,cursor:"pointer",marginBottom:14,border:`1px solid ${C.gray200}` }}>
                  <Avatar name={sl.name} size={36} />
                  <div style={{ flex:1 }}><p style={{ margin:0,fontWeight:600,fontSize:13 }}>{sl.name}</p><p style={{ margin:0,fontSize:11,color:C.gray400 }}>★ {sl.rating||5.0}</p></div>
                  <span style={{ fontSize:12,color:C.gray400 }}>Ver perfil →</span>
                </div>}
                {s.description&&<p style={{ margin:"0 0 14px",fontSize:14,color:C.gray600,lineHeight:1.6,background:C.gray50,borderRadius:10,padding:"10px 14px" }}>{s.description}</p>}
                <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:16,paddingTop:12,borderTop:`1px solid ${C.gray100}` }}>
                  <span style={{ fontSize:26,fontWeight:800,color:C.green }}>R$ {Number(s.price).toLocaleString("pt-BR")}</span>
                  {s.price_old&&<><span style={{ fontSize:14,color:C.gray400,textDecoration:"line-through" }}>R$ {Number(s.price_old).toLocaleString("pt-BR")}</span><span style={{ background:C.redLight,color:C.red,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6 }}>-{Math.round((1-s.price/s.price_old)*100)}%</span></>}
                  <span style={{ fontSize:12,color:C.gray400,marginLeft:"auto" }}>+ frete</span>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={()=>toggleWishlist(s.id)} style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:wishlist.includes(s.id)?C.redLight:C.white,color:wishlist.includes(s.id)?C.red:C.gray900,cursor:"pointer",fontSize:14,fontWeight:500 }}>{wishlist.includes(s.id)?"♥ Favoritado":"♡ Favoritar"}</button>
                  <button style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:700 }}>Entrar em contato</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── NAV ──
  const NavBar = () => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 0 0.75rem",borderBottom:`1px solid ${C.gray100}`,marginBottom:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>⚽</div>
        <span style={{ fontWeight:800,fontSize:16,color:C.gray900,letterSpacing:-.3 }}>FutShirt</span>
      </div>
      <div style={{ display:"flex",gap:4 }}>
        {[["home","Home"],["catalog","Catálogo"],["sellers","Vendedores"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPage(v)} style={{ background:page===v?C.greenLight:"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page===v?600:400,color:page===v?C.green:C.gray600 }}>{l}</button>
        ))}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <button onClick={()=>setPage("wishlist")} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,color:page==="wishlist"?C.red:C.gray600 }}>
          ♥{wishlist.length>0&&<span style={{ background:C.red,color:C.white,borderRadius:99,fontSize:10,padding:"1px 5px",marginLeft:4 }}>{wishlist.length}</span>}
        </button>
        <button onClick={()=>setPage("addProduct")} style={{ padding:"6px 13px",borderRadius:9,border:"none",background:C.green,color:C.white,fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Anunciar</button>
        <div onClick={()=>profile&&openSeller(user.id)} style={{ cursor:"pointer" }}><Avatar name={profile?.name||"?"} size={30} /></div>
        <button onClick={handleLogout} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.gray600 }}>Sair</button>
      </div>
    </div>
  );

  // ── HOME ──
  if(page==="home") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
      <NavBar />
      <BannerCarousel onCta={()=>setPage("catalog")} />
      {promos.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="🏷️" sub="ofertas especiais" title="Em promoção agora" action="Ver todas" onAction={()=>setPage("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12 }}>
          {promos.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {featured.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="⭐" sub="destaques" title="Camisetas em destaque" action="Ver catálogo" onAction={()=>setPage("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12 }}>
          {featured.slice(0,4).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {shirts.length===0&&!shirtsLoading&&<div style={{ textAlign:"center",padding:"3rem",color:C.gray400 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>⚽</div>
        <p style={{ fontWeight:500 }}>Nenhuma camiseta cadastrada ainda.</p>
        <button onClick={()=>setPage("addProduct")} style={{ marginTop:12,padding:"10px 24px",background:C.green,color:C.white,border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>Seja o primeiro a anunciar!</button>
      </div>}
    </div>
  );

  // ── CATALOG ──
  if(page==="catalog") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
      <NavBar />
      <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"6px 12px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer" }}>
          {[["relevancia","Relevância"],["preco_asc","Menor preço"],["preco_desc","Maior preço"],["avaliacao","Melhor avaliação"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {shirtsLoading ? <Spinner /> : <>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>
          {filtered.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
        {filtered.length===0&&<div style={{ textAlign:"center",padding:"4rem 1rem",color:C.gray400 }}><div style={{ fontSize:40,marginBottom:12 }}>🔍</div><p style={{ margin:0,fontWeight:500 }}>Nenhuma camiseta encontrada.</p><button onClick={()=>{ setFilters({sport:null,type:null,region:null,condition:null,rarity:null,size:null,price:null}); setSearch(""); }} style={{ marginTop:14,padding:"8px 20px",background:C.green,color:C.white,border:"none",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600 }}>Limpar filtros</button></div>}
      </>}
    </div>
  );

  // ── SELLERS ──
  if(page==="sellers") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
      <NavBar />
      <SectionHead icon="👥" sub="comunidade" title="Vendedores" />
      <p style={{ color:C.gray400,fontSize:14,margin:"0 0 16px" }}>Cadastre-se e anuncie para aparecer aqui!</p>
    </div>
  );

  // ── WISHLIST ──
  if(page==="wishlist") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"0 auto",padding:"0 0 3rem" }}>
      <NavBar />
      <SectionHead icon="♥" sub="minha lista" title="Lista de desejos" />
      {wishlist.length===0
        ?<div style={{ textAlign:"center",padding:"4rem 1rem",color:C.gray400 }}><div style={{ fontSize:44,marginBottom:12 }}>♡</div><p>Sua lista está vazia.</p><button onClick={()=>setPage("catalog")} style={{ marginTop:14,padding:"8px 20px",background:C.green,color:C.white,border:"none",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600 }}>Explorar catálogo →</button></div>
        :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>{shirts.filter(s=>wishlist.includes(s.id)).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>
      }
    </div>
  );

  return null;
}