import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import PhotoUploader from "./components/PhotoUploader";
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
const CONDITIONS   = ["Nova","Usada"];
const SIZES        = ["PP","P","M","G","GG"];
const SHIRT_MODELS = ["Modelo Jogador","Modelo Torcedor","Utilizado em Jogo"];
const PRICES     = [{ id:"all",label:"Qualquer preço" },{ id:"0-300",label:"Até R$ 300" },{ id:"300-800",label:"R$ 300–800" },{ id:"800-2000",label:"R$ 800–2000" },{ id:"2000+",label:"Acima de R$ 2000" }];
const BR_STATES  = [
  {sigla:"AC",nome:"Acre"},{sigla:"AL",nome:"Alagoas"},{sigla:"AP",nome:"Amapá"},
  {sigla:"AM",nome:"Amazonas"},{sigla:"BA",nome:"Bahia"},{sigla:"CE",nome:"Ceará"},
  {sigla:"DF",nome:"Distrito Federal"},{sigla:"ES",nome:"Espírito Santo"},{sigla:"GO",nome:"Goiás"},
  {sigla:"MA",nome:"Maranhão"},{sigla:"MT",nome:"Mato Grosso"},{sigla:"MS",nome:"Mato Grosso do Sul"},
  {sigla:"MG",nome:"Minas Gerais"},{sigla:"PA",nome:"Pará"},{sigla:"PB",nome:"Paraíba"},
  {sigla:"PR",nome:"Paraná"},{sigla:"PE",nome:"Pernambuco"},{sigla:"PI",nome:"Piauí"},
  {sigla:"RJ",nome:"Rio de Janeiro"},{sigla:"RN",nome:"Rio Grande do Norte"},{sigla:"RS",nome:"Rio Grande do Sul"},
  {sigla:"RO",nome:"Rondônia"},{sigla:"RR",nome:"Roraima"},{sigla:"SC",nome:"Santa Catarina"},
  {sigla:"SP",nome:"São Paulo"},{sigla:"SE",nome:"Sergipe"},{sigla:"TO",nome:"Tocantins"},
];
const BOOST_PRICE = "R$ 9,90";
const BOOST_DAYS  = 7;

/* ── CATEGORY TILES ── */
const CATEGORY_TILES = [
  { icon:"🇧🇷", label:"Times Nacionais",   color:"#15803d", bg:"#f0fdf4", filters:{ type:"times",    region:"nacional" } },
  { icon:"🌍",  label:"Times Europeus",    color:"#1d4ed8", bg:"#eff6ff", filters:{ type:"times",    region:"europa"   } },
  { icon:"🌎",  label:"América do Sul",    color:"#b45309", bg:"#fffbeb", filters:{ type:"times",    region:"america_sul" } },
  { icon:"🏆",  label:"Seleções",          color:"#7c3aed", bg:"#f5f3ff", filters:{ type:"selecoes", region:null       } },
  { icon:"👕",  label:"Modelo Jogador",    color:"#0891b2", bg:"#ecfeff", filters:{ model:"Modelo Jogador"             } },
  { icon:"🏅",  label:"Utilizado em Jogo", color:"#be123c", bg:"#fff1f2", filters:{ model:"Utilizado em Jogo"          } },
];
function isBoosted(s) {
  return s.boosted && s.boosted_until && new Date(s.boosted_until) > new Date();
}
const PROFANITY = ["porra","merda","caralho","fdp","foda","foder","viado","buceta","cuzão","puta","vagabunda","arrombado","babaca","imbecil","desgraça","otário","corno","piranha","safado","safada","prostituta","idiota","retardado","burro","lixo","escória","raça","vsf","vtnc","tnc","krl","pqp","qrl"];
function hasProfanity(text) {
  if(!text) return false;
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  return PROFANITY.some(w => lower.includes(w.normalize("NFD").replace(/[̀-ͯ]/g,"")));
}
const BANNERS_DEFAULT = [
  { id:1,label:"VERDÃO",title:"S. E. Palmeiras",sub:"Camiseta oficial 2024 — edição comemorativa 110 anos do Verdão",cta:"Ver anúncios",grad:"linear-gradient(120deg,#052e16 0%,#14532d 55%,#166534 100%)",accent:"#4ade80",img:"https://images.unsplash.com/photo-1772450235863-996680ddb732?fm=jpg&q=80&w=900&auto=format&fit=crop" },
  { id:2,label:"PROMOÇÃO",title:"Até 40% OFF",sub:"Colecionadores verificados com descontos exclusivos esta semana",cta:"Ver ofertas",grad:"linear-gradient(120deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)",accent:"#93c5fd",img:"🏷️" },
  { id:3,label:"DESTAQUE",title:"Copa do Mundo 2002",sub:"Reviva a glória do pentacampeonato com réplicas originais",cta:"Ver camisetas",grad:"linear-gradient(120deg,#78350f 0%,#b45309 60%,#d97706 100%)",accent:"#fcd34d",img:"🏆" },
];
const BANNER_THEMES = [
  { id:"green",  label:"🌿 Verde",   grad:"linear-gradient(120deg,#14532d 0%,#166534 60%,#15803d 100%)",accent:"#4ade80" },
  { id:"blue",   label:"🔵 Azul",    grad:"linear-gradient(120deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)",accent:"#93c5fd" },
  { id:"amber",  label:"🟡 Dourado", grad:"linear-gradient(120deg,#78350f 0%,#b45309 60%,#d97706 100%)",accent:"#fcd34d" },
  { id:"red",    label:"🔴 Vermelho",grad:"linear-gradient(120deg,#7f1d1d 0%,#b91c1c 60%,#ef4444 100%)",accent:"#fca5a5" },
  { id:"purple", label:"🟣 Roxo",    grad:"linear-gradient(120deg,#3b0764 0%,#7c3aed 60%,#8b5cf6 100%)",accent:"#c4b5fd" },
];

/* ── HELPERS ── */
function Avatar({ name, size=40, src=null }) {
  const colors = ["#dbeafe","#fce7f3","#dcfce7","#fef3c7","#f3e8ff","#fee2e2"];
  const fgs    = ["#1d4ed8","#be185d","#15803d","#b45309","#7c3aed","#991b1b"];
  const i = (name||"?").charCodeAt(0) % colors.length;
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  if(src) return <img src={src} alt={name||"avatar"} loading="lazy" style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e5e7eb" }} />;
  return <div style={{ width:size,height:size,borderRadius:"50%",background:colors[i],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:size*.28,color:fgs[i],flexShrink:0 }}>{initials}</div>;
}
function Tag({ rarity }) {
  return <span style={{ display:"inline-flex",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,background:rBg[rarity],color:rCol[rarity] }}>{rarity}</span>;
}function isUrl(val) {
  return typeof val === "string" && val.startsWith("http");
}
function parseImg(img) {
  if (!img) return { url: null, position: "center center", size: "cover" };
  if (img.startsWith("{")) {
    try { const p = JSON.parse(img); return { url: p.url||null, position: p.position||"center center", size: p.size||"cover" }; } catch {}
  }
  if (isUrl(img)) return { url: img, position: "center center", size: "cover" };
  return { url: null, position: "center center", size: "cover" };
}
function buildImgField(url, position, size) {
  if (!url || !isUrl(url)) return url || "";
  if (position === "center center" && size === "cover") return url;
  return JSON.stringify({ url, position, size });
}
function parsePosition(posStr) {
  const named = { left:0, center:50, right:100, top:0, bottom:100 };
  const parts = (posStr||"center center").trim().split(/\s+/);
  const n = p => p in named ? named[p] : (parseFloat(p)||50);
  return parts.length >= 2 ? [n(parts[0]), n(parts[1])] : [n(parts[0]), 50];
}
function parseDeepLink(link) {
  if (!link || !link.includes("?")) return { page: link||"catalog", params: {} };
  const [page, qs] = link.split("?");
  return { page: page||"catalog", params: Object.fromEntries(new URLSearchParams(qs)) };
}
function buildDeepLink(page, params) {
  const filled = Object.fromEntries(Object.entries(params).filter(([,v])=>v));
  if (!Object.keys(filled).length) return page;
  return `${page}?${new URLSearchParams(filled).toString()}`;
}

function ShirtPhoto({ value, size = 88 }) {
  if (isUrl(value)) {
    return (
      <img
        src={value}
        alt="camiseta"
        style={{
          width: "100%",
          height: size,
          objectFit: "contain",
          display: "block",
          background: "#f9fafb",
        }}
      />
    );
  }
  return (
    <div style={{ height: size, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
      {value || "⚽"}
    </div>
  );
}
function Star({ v }) { return <span style={{ color:C.amber,fontSize:12 }}>{"★".repeat(Math.floor(v||0))}{"☆".repeat(5-Math.floor(v||0))}</span>; }
function StarPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex",gap:2 }}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange(n)} style={{ fontSize:30,cursor:"pointer",color:n<=value?C.amber:"#d1d5db",lineHeight:1 }}>★</span>
      ))}
    </div>
  );
}
function CityStatePicker({ stateVal, cityVal, onStateChange, onCityChange }) {
  const [ibgeStates, setIbgeStates] = useState([]);
  const [ibgeCities, setIbgeCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then(r => r.json()).then(setIbgeStates).catch(() => {});
  }, []);
  useEffect(() => {
    if (!stateVal) { setIbgeCities([]); return; }
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateVal}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(d => { setIbgeCities(d); setLoadingCities(false); })
      .catch(() => setLoadingCities(false));
  }, [stateVal]);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      <div>
        <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Estado</label>
        <select value={stateVal} onChange={e => { onStateChange(e.target.value); onCityChange(""); }}
          style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",background:C.white }}>
          <option value="">Selecione o estado...</option>
          {ibgeStates.map(s => <option key={s.id} value={s.sigla}>{s.nome} ({s.sigla})</option>)}
        </select>
      </div>
      {stateVal && (
        <div>
          <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>
            Cidade{loadingCities ? " (carregando...)" : ""}
          </label>
          <input
            list={`ibge-cities-${stateVal}`}
            value={cityVal}
            onChange={e => onCityChange(e.target.value)}
            onBlur={e => {
              const names = ibgeCities.map(c => c.nome);
              if (e.target.value && !names.includes(e.target.value)) onCityChange("");
            }}
            placeholder="Digite para buscar..."
            disabled={loadingCities}
            style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",opacity:loadingCities?0.6:1 }}
          />
          <datalist id={`ibge-cities-${stateVal}`}>
            {ibgeCities.map(c => <option key={c.id} value={c.nome} />)}
          </datalist>
        </div>
      )}
    </div>
  );
}
function Pill({ active,onClick,children,disabled,soon }) {
  return <button onClick={disabled?undefined:onClick} style={{ padding:"6px 14px",borderRadius:99,border:`1.5px solid ${active?C.green:C.gray200}`,background:active?C.greenLight:C.white,color:active?C.greenDark:disabled?"#c4c4c4":C.gray600,fontSize:13,fontWeight:active?600:400,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:disabled?.6:1,display:"inline-flex",alignItems:"center",gap:5 }}>{children}{soon&&<span style={{ fontSize:10,background:C.gray100,color:C.gray400,borderRadius:4,padding:"1px 5px" }}>em breve</span>}</button>;
}
function SectionHead({ icon,title,sub,action,onAction }) {
  return <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16 }}><div><p style={{ margin:"0 0 2px",fontSize:11,fontWeight:600,letterSpacing:1,color:C.green,textTransform:"uppercase" }}>{icon} {sub}</p><h3 style={{ margin:0,fontSize:19,fontWeight:700,color:C.gray900 }}>{title}</h3></div>{action&&<span onClick={onAction} style={{ fontSize:13,color:C.green,cursor:"pointer",fontWeight:500 }}>{action} →</span>}</div>;
}
function Spinner() {
  return <div style={{ textAlign:"center",padding:"3rem",color:C.gray400 }}><div style={{ fontSize:32,marginBottom:8 }}>⏳</div><p>Carregando...</p></div>;
}

/* ── SHIMMER ── */
;(function injectShimmer(){
  if(typeof document==="undefined"||document.getElementById("fsm-shimmer")) return;
  const s=document.createElement("style");
  s.id="fsm-shimmer";
  s.textContent="@keyframes fsm-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}";
  document.head.appendChild(s);
})();
const shimmerBase = { background:"linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize:"1200px 100%", animation:"fsm-shimmer 1.3s infinite linear", borderRadius:6 };
function SkeletonCard() {
  return (
    <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden" }}>
      <div style={{ ...shimmerBase,height:140,borderRadius:0 }} />
      <div style={{ padding:"10px 12px 13px",display:"flex",flexDirection:"column",gap:8 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ ...shimmerBase,height:12,width:"60%" }} />
          <div style={{ ...shimmerBase,height:16,width:"22%",borderRadius:99 }} />
        </div>
        <div style={{ ...shimmerBase,height:10,width:"45%" }} />
        <div style={{ ...shimmerBase,height:10,width:"35%" }} />
        <div style={{ ...shimmerBase,height:14,width:"50%",marginTop:2 }} />
      </div>
    </div>
  );
}

/* ── EMPTY STATE ── */
function EmptyState({ emoji, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
      <div style={{ fontSize:52,marginBottom:14 }}>{emoji}</div>
      <h3 style={{ margin:"0 0 8px",fontWeight:700,fontSize:17,color:"#111827" }}>{title}</h3>
      {sub&&<p style={{ margin:"0 0 18px",fontSize:14,color:"#9ca3af",lineHeight:1.6,maxWidth:280,marginLeft:"auto",marginRight:"auto" }}>{sub}</p>}
      {action&&<button onClick={onAction} style={{ padding:"10px 26px",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>{action}</button>}
    </div>
  );
}

/* ── BANNER ── */
function BannerCarousel({ onCta, banners }) {
  const all = (banners && banners.length > 0) ? banners : BANNERS_DEFAULT;
  const visible = all.filter(b => b.visible !== false);
  const items = visible.length > 0 ? visible : BANNERS_DEFAULT;
  const [idx,setIdx] = useState(0);
  const timer = useRef(null);
  const go = i => setIdx((i+items.length)%items.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ timer.current=setInterval(()=>go(idx+1),4000); return()=>clearInterval(timer.current); },[idx]);
  const b = items[idx % items.length];
  const imgData = parseImg(b.img);
  const hasPhoto = !!imgData.url;
  return (
    <div style={{ borderRadius:18,overflow:"hidden",marginBottom:28,position:"relative",background:b.grad,minHeight:hasPhoto?260:180 }}>
      {/* Foto cobre banner inteiro */}
      {hasPhoto&&<div style={{ position:"absolute",inset:0,backgroundImage:`url(${imgData.url})`,backgroundSize:imgData.size,backgroundPosition:imgData.position }} />}
      {/* Overlay gradiente para legibilidade do texto */}
      {hasPhoto&&<div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,.82) 0%,rgba(0,0,0,.7) 35%,rgba(0,0,0,.35) 65%,rgba(0,0,0,.08) 100%)" }} />}
      <div style={{ padding:"2rem 2rem 1.75rem",position:"relative",zIndex:1 }}>
        <span style={{ display:"inline-flex",padding:"3px 10px",borderRadius:99,background:"rgba(255,255,255,.18)",color:C.white,fontSize:11,fontWeight:600,letterSpacing:1.5,marginBottom:10 }}>{b.label}</span>
        <h2 style={{ margin:"0 0 6px",fontSize:24,fontWeight:800,color:C.white }}>{b.title}</h2>
        <p style={{ margin:"0 0 18px",fontSize:13,color:"rgba(255,255,255,.8)",maxWidth:300,lineHeight:1.6 }}>{b.sub}</p>
        <button onClick={()=>onCta(b.link||"catalog")} style={{ padding:"9px 18px",borderRadius:10,border:"none",background:b.accent,color:C.greenDark,fontWeight:700,fontSize:13,cursor:"pointer" }}>{b.cta} →</button>
      </div>
      {!hasPhoto&&<div style={{ position:"absolute",right:24,top:"50%",transform:"translateY(-50%)",fontSize:72,opacity:.2 }}>{b.img}</div>}
      <div style={{ position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,zIndex:2 }}>
        {items.map((_,i)=><div key={i} onClick={()=>{ clearInterval(timer.current); go(i); }} style={{ width:i===idx?20:7,height:7,borderRadius:99,background:i===idx?"rgba(255,255,255,.95)":"rgba(255,255,255,.35)",cursor:"pointer",transition:"all .3s" }} />)}
      </div>
      {["←","→"].map((a,d)=><button key={a} onClick={()=>{ clearInterval(timer.current); go(idx+(d?1:-1)); }} style={{ position:"absolute",top:"50%",transform:"translateY(-50%)",[d?"right":"left"]:10,background:"rgba(255,255,255,.2)",border:"none",color:C.white,borderRadius:"50%",width:30,height:30,fontSize:14,cursor:"pointer",zIndex:2 }}>{a}</button>)}
    </div>
  );
}

/* ── SHIRT CARD ── */
function ShirtCard({ s, wishlist, toggleWishlist, onOpen }) {
  const disc      = s.price_old ? Math.round((1 - s.price / s.price_old) * 100) : 0;
  const photo     = (s.photos || [])[0] || "⚽";
  const isNew     = s.created_at && (Date.now() - new Date(s.created_at).getTime()) < 48 * 60 * 60 * 1000;
  const boosted   = isBoosted(s);

  return (
    <div
      onClick={() => onOpen(s.id)}
      style={{
        background: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Área da foto */}
      <div style={{ background: C.gray50, position: "relative" }}>
        <ShirtPhoto value={photo} size={140} />

        {s.status === "vendido" && (
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3 }}>
            <span style={{ background:"#111",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:6,letterSpacing:1.5 }}>VENDIDO</span>
          </div>
        )}

        {(s.photos || []).length > 1 && (
          <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: C.gray400, background: C.white, borderRadius: 5, padding: "1px 5px", border: `1px solid ${C.gray200}` }}>
            +{s.photos.length - 1}
          </span>
        )}

        {(disc > 0 || isNew || boosted) && (
          <div style={{ position:"absolute",top:8,left:8,display:"flex",flexDirection:"column",gap:3 }}>
            {boosted && (
              <span style={{ background:"linear-gradient(90deg,#f59e0b,#f97316)",color:C.white,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start",letterSpacing:.4 }}>
                ⚡ Destaque
              </span>
            )}
            {disc > 0 && (
              <span style={{ background:C.red,color:C.white,fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start" }}>
                -{disc}%
              </span>
            )}
            {isNew && (
              <span style={{ background:C.green,color:C.white,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start" }}>
                ✨ Novo
              </span>
            )}
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(s.id); }}
          style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.85)", border: "none", width: 28, height: 28, borderRadius: "50%", fontSize: 15, cursor: "pointer", color: wishlist.includes(s.id) ? C.red : C.gray400 }}
        >
          {wishlist.includes(s.id) ? "♥" : "♡"}
        </button>
      </div>

      {/* Infos */}
      <div style={{ padding: "10px 12px 13px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.gray900 }}>{s.team}</p>
          <Tag rarity={s.rarity} />
        </div>
        <p style={{ margin: 0, color: C.gray400, fontSize: 11 }}>{s.year} · {s.edition}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Star v={s.rating} />
          <span style={{ fontSize: 11, color: C.gray400 }}>({s.reviews || 0})</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: "auto" }}>
          <span style={{ fontWeight: 700, color: C.green, fontSize: 15 }}>
            R$ {Number(s.price).toLocaleString("pt-BR")}
          </span>
          {s.price_old && (
            <span style={{ fontSize: 11, color: C.gray400, textDecoration: "line-through" }}>
              R$ {Number(s.price_old).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
/* ── FILTER BAR ── */
function FilterBar({ filters,setFilters,search,setSearch }) {
  const { sport,type,region,condition,model,size,price,state } = filters;
  const set = (key,val) => setFilters(f=>({ ...f,[key]:f[key]===val?null:val }));
  const regionList = type ? REGIONS[type] : [];
  const activeCount = [sport,type,region,condition,model,size,price&&price!=="all"?price:null,state].filter(Boolean).length;
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
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Tipo</p><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{SHIRT_MODELS.map(m=><Pill key={m} active={model===m} onClick={()=>set("model",m)}>{m}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Condição</p><div style={{ display:"flex",gap:6 }}>{CONDITIONS.map(c=><Pill key={c} active={condition===c} onClick={()=>set("condition",c)}>{c}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Tamanho</p><div style={{ display:"flex",gap:6 }}>{SIZES.map(s=><Pill key={s} active={size===s} onClick={()=>set("size",s)}>{s}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Preço</p><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{PRICES.map(p=><Pill key={p.id} active={price===p.id&&p.id!=="all"} onClick={()=>set("price",p.id==="all"?null:p.id)}>{p.label}</Pill>)}</div></div>
        <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Estado do vendedor</p>
          <select value={state||""} onChange={e=>setFilters(f=>({...f,state:e.target.value||null}))} style={{ padding:"6px 12px",border:`1px solid ${state?C.green:C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer",color:state?C.greenDark:C.gray600,fontWeight:state?600:400 }}>
            <option value="">Todos os estados</option>
            {BR_STATES.map(s=><option key={s.sigla} value={s.sigla}>{s.nome} ({s.sigla})</option>)}
          </select>
        </div>
      </div>
      {activeCount>0&&<div style={{ display:"flex",alignItems:"center",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.gray100}` }}>
        <span style={{ fontSize:12,color:C.gray400 }}>{activeCount} filtro{activeCount>1?"s":""} ativo{activeCount>1?"s":""}:</span>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",flex:1 }}>
          {sport&&<ActiveTag label={SPORTS.find(s=>s.id===sport)?.label} onRemove={()=>setFilters(f=>({...f,sport:null,type:null,region:null}))} />}
          {type&&<ActiveTag label={TYPES.find(t=>t.id===type)?.label} onRemove={()=>setFilters(f=>({...f,type:null,region:null}))} />}
          {region&&<ActiveTag label={regionList.find(r=>r.id===region)?.label} onRemove={()=>setFilters(f=>({...f,region:null}))} />}
          {model&&<ActiveTag label={model} onRemove={()=>setFilters(f=>({...f,model:null}))} />}
          {condition&&<ActiveTag label={condition} onRemove={()=>setFilters(f=>({...f,condition:null}))} />}
          {size&&<ActiveTag label={`Tam. ${size}`} onRemove={()=>setFilters(f=>({...f,size:null}))} />}
          {price&&price!=="all"&&<ActiveTag label={PRICES.find(p=>p.id===price)?.label} onRemove={()=>setFilters(f=>({...f,price:null}))} />}
          {state&&<ActiveTag label={`📍 ${BR_STATES.find(s=>s.sigla===state)?.nome||state}`} onRemove={()=>setFilters(f=>({...f,state:null}))} />}
        </div>
        <button onClick={()=>setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null})} style={{ fontSize:12,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:500,whiteSpace:"nowrap" }}>Limpar tudo</button>
      </div>}
    </div>
  );
}
function ActiveTag({ label,onRemove }) {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,background:C.greenLight,color:C.greenDark,fontSize:12,fontWeight:500 }}>{label}<button onClick={onRemove} style={{ background:"none",border:"none",color:C.green,cursor:"pointer",fontSize:14,padding:0,lineHeight:1 }}>×</button></span>;
}

/* ── MOBILE HOOK ── */
function maskPhone(value) {
  const d = value.replace(/\D/g,"").slice(0,11);
  if(d.length<=2) return d.length?`(${d}`:"";
  if(d.length<=7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function useMobile(bp=640) {
  const [m,setM] = useState(()=>window.innerWidth<bp);
  useEffect(()=>{
    const fn=()=>setM(window.innerWidth<bp);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return m;
}

/* ── CONTACT MODAL ── */
function ContactModal({ seller, onClose }) {
  const phone = seller.phone || seller.whatsapp;
  const wpLink = phone
    ? `https://wa.me/55${phone.replace(/\D/g,"")}?text=${encodeURIComponent("Olá! Vi seu anúncio no FutShirt Market e tenho interesse.")}`
    : null;
  const emailLink = seller.email
    ? `mailto:${seller.email}?subject=${encodeURIComponent("Interesse em camiseta - FutShirt")}`
    : null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"20px 20px 0 0",padding:"1.5rem",width:"100%",maxWidth:480,boxSizing:"border-box" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:"#e5e7eb",margin:"0 auto 18px" }} />
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
          <Avatar name={seller.name} size={44} src={seller.avatar_url} />
          <div>
            <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:15,color:"#111827" }}>{seller.name}</p>
            <p style={{ margin:0,fontSize:12,color:"#9ca3af" }}>Como deseja entrar em contato?</p>
          </div>
        </div>
        {wpLink&&(
          <a href={wpLink} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"#dcfce7",borderRadius:12,marginBottom:10,textDecoration:"none",color:"#14532d" }}>
            <span style={{ fontSize:24 }}>💬</span>
            <div>
              <p style={{ margin:"0 0 1px",fontWeight:600,fontSize:14 }}>WhatsApp</p>
              <p style={{ margin:0,fontSize:12,color:"#16a34a" }}>{phone}</p>
            </div>
          </a>
        )}
        {emailLink&&(
          <a href={emailLink} style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"#eff6ff",borderRadius:12,marginBottom:10,textDecoration:"none",color:"#1e40af" }}>
            <span style={{ fontSize:24 }}>✉️</span>
            <div>
              <p style={{ margin:"0 0 1px",fontWeight:600,fontSize:14 }}>Email</p>
              <p style={{ margin:0,fontSize:12,color:"#2563eb" }}>{seller.email}</p>
            </div>
          </a>
        )}
        {!wpLink&&!emailLink&&(
          <p style={{ color:"#9ca3af",fontSize:14,textAlign:"center",padding:"1rem 0" }}>
            Este vendedor ainda não configurou informações de contato.
          </p>
        )}
        <button onClick={onClose} style={{ width:"100%",padding:"11px 0",border:"1px solid #e5e7eb",borderRadius:12,background:"#fff",cursor:"pointer",fontSize:14,color:"#4b5563",marginTop:4 }}>Fechar</button>
      </div>
    </div>
  );
}

/* ── TRUST BAR ── */
function TrustBar() {
  const isMobile = useMobile();
  const items = ["✅ Vendedores verificados","⭐ Avaliações reais","🔒 Compra 100% segura","💬 Suporte via WhatsApp"];
  return (
    <div style={{ background:"#f0fdf4",border:"1px solid #d1fae5",borderRadius:10,padding:"8px 14px",marginBottom:20 }}>
      <div style={{ display:"flex",justifyContent:"center",gap:isMobile?14:32,flexWrap:"wrap" }}>
        {(isMobile?items.slice(0,2):items).map(t=>(
          <span key={t} style={{ fontSize:12,fontWeight:500,color:"#166534" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── CATEGORY TILES ── */
function CategoryTiles({ onNavigate, setFilters }) {
  const isMobile = useMobile();
  return (
    <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(6,1fr)",gap:10,marginBottom:28 }}>
      {CATEGORY_TILES.map(tile=>(
        <div key={tile.label}
          onClick={()=>{ setFilters(f=>({...f,...tile.filters})); onNavigate("catalog"); }}
          style={{ background:tile.bg,border:`1.5px solid ${tile.color}33`,borderRadius:14,padding:isMobile?"10px 6px":"16px 8px",textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
          <span style={{ fontSize:isMobile?22:28 }}>{tile.icon}</span>
          <span style={{ fontSize:10,fontWeight:600,color:tile.color,lineHeight:1.3 }}>{tile.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── FOOTER ── */
function Footer({ onNavigate }) {
  return (
    <div style={{ marginTop:48,borderTop:"1px solid #e5e7eb",paddingTop:32,paddingBottom:20 }}>
      <div style={{ display:"flex",flexWrap:"wrap",gap:32,justifyContent:"space-between",marginBottom:20 }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:"#14532d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚽</div>
            <span style={{ fontWeight:800,fontSize:15,color:"#111827" }}>FutShirt Market</span>
          </div>
          <p style={{ margin:0,fontSize:12,color:"#9ca3af",maxWidth:200,lineHeight:1.6 }}>O mercado de camisetas de futebol mais completo do Brasil.</p>
        </div>
        <div>
          <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:11,color:"#374151",textTransform:"uppercase",letterSpacing:1 }}>Navegar</p>
          {[["home","Home"],["catalog","Catálogo"],["sellers","Vendedores"]].map(([v,l])=>(
            <div key={v}><span onClick={()=>onNavigate(v)} style={{ fontSize:13,color:"#4b5563",cursor:"pointer",display:"block",lineHeight:2 }}>{l}</span></div>
          ))}
        </div>
        <div>
          <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:11,color:"#374151",textTransform:"uppercase",letterSpacing:1 }}>Vendedores</p>
          <div><span onClick={()=>onNavigate("sellers")} style={{ fontSize:13,color:"#4b5563",cursor:"pointer",display:"block",lineHeight:2 }}>Ver todos os vendedores</span></div>
          <div><span onClick={()=>onNavigate("addProduct")} style={{ fontSize:13,color:"#16a34a",cursor:"pointer",display:"block",lineHeight:2,fontWeight:600 }}>+ Anunciar camiseta</span></div>
        </div>
        <div>
          <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:11,color:"#374151",textTransform:"uppercase",letterSpacing:1 }}>Confiança</p>
          {["Vendedores verificados","Avaliações reais","Compra 100% segura","Suporte via WhatsApp"].map(t=>(
            <div key={t}><span style={{ fontSize:12,color:"#6b7280",lineHeight:2,display:"block" }}>{t}</span></div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid #f3f4f6",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
        <p style={{ margin:0,fontSize:12,color:"#9ca3af" }}>© 2025 FutShirt Market — Todos os direitos reservados.</p>
        <p style={{ margin:0,fontSize:12,color:"#9ca3af" }}>Feito para colecionadores de camisetas</p>
      </div>
    </div>
  );
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
  // eslint-disable-next-line no-unused-vars
  const [following,setFollowing] = useState([]);
  const [selectedId,setSelectedId] = useState(null);
  const [selectedShirt,setSelectedShirt] = useState(null);
  const [sellerSlug,setSellerSlug] = useState(null);
  const [sellerProfile,setSellerProfile] = useState(null);
  const [photoIdx,setPhotoIdx]   = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [search,setSearch]       = useState("");
  const [filters,setFilters]     = useState({ sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null });
  const [sortBy,setSortBy]       = useState("relevancia");
  const [formStep,setFormStep]   = useState(1);
  const [formDone,setFormDone]   = useState(false);
  const [formSaving,setFormSaving] = useState(false);
  const emptyForm = { team:"",country:"",year:"",edition:"",condition:"Nova",price:"",price_old:"",size:"M",model:"",type:"times",region:"nacional",description:"",photos:[] };
  const [form,setForm]           = useState(emptyForm);
  const [sellers,setSellers]           = useState([]);
  const [sellersLoading,setSellersLoading] = useState(false);
  const [editingShirtId,setEditingShirtId] = useState(null);
  const isMobile = useMobile();
  const [toasts,setToasts]             = useState([]);
  const [contactModal,setContactModal] = useState(null);
  const [profileForm,setProfileForm]   = useState({ name:"",location:"",state:"",city:"",bio:"",phone:"" });
  const [formErrors,setFormErrors]     = useState({});
  const [profileSaving,setProfileSaving] = useState(false);
  const [profileSaved,setProfileSaved] = useState(false);
  const [reg,setReg]             = useState({ name:"",email:"",password:"",state:"",city:"",bio:"" });
  const [loginData,setLoginData] = useState({ email:"",password:"" });
  const [showLoginPwd,setShowLoginPwd] = useState(false);
  const [showAuth,setShowAuth]         = useState(false);
  const [adminTab,setAdminTab]         = useState("users");
  const [banners,setBanners]           = useState(BANNERS_DEFAULT);
  const [adminBannerEdit,setAdminBannerEdit] = useState({});
  const [bannerSaving,setBannerSaving] = useState(null);
  const [bannerErrors,setBannerErrors] = useState({});
  const [sellerSearch,setSellerSearch] = useState("");
  const [myProfileTab, setMyProfileTab]   = useState("dados");
  const [sellerReviews, setSellerReviews] = useState([]);
  const [reviewForm, setReviewForm]       = useState({ rating:5, comment:"" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [follows, setFollows]             = useState([]);
  const [shirtQuestions, setShirtQuestions] = useState([]);
  const [questionText, setQuestionText]     = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerTexts, setAnswerTexts]       = useState({});
  const [answerLoading, setAnswerLoading]   = useState(null);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [adminNotifs, setAdminNotifs]       = useState([]);
  const [boostModal, setBoostModal]         = useState(null); // shirt object
  const [boostLoading, setBoostLoading]     = useState(false);

  // ref para o botão Voltar do navegador (acesso sem deps no event listener)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── load shirts ──
  useEffect(()=>{
    loadShirts();
    loadBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── inicializa edição de banners ao abrir a aba ──
  useEffect(()=>{
    if(adminTab==="banners"&&banners.length>0){
      const init = {};
      banners.forEach(b=>{ init[b.id]={ label:b.label,title:b.title,sub:b.sub,cta:b.cta,img:b.img,grad:b.grad,accent:b.accent }; });
      setAdminBannerEdit(init);
    }
  },[adminTab,banners]);

  // ── load sellers when tab is opened ──
  useEffect(()=>{
    if(page==="sellers"||page==="admin") loadSellers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[page]);

  // ── redireciona ao home se sair enquanto em página restrita ──
  useEffect(()=>{
    if(!user && !loading && ["addProduct","myProfile","wishlist","admin"].includes(page)){
      setPage("home");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user,loading]);

  // ── hash routing: lê hash inicial e navega para a página correta ──
  useEffect(()=>{
    const hash = window.location.hash.slice(1);
    if(hash.startsWith("seller-"))      openSeller(hash.replace("seller-",""));
    else if(hash.startsWith("item-"))   openShirt(hash.replace("item-",""));
    else if(["catalog","sellers","wishlist"].includes(hash)) setPage(hash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── botão Voltar do navegador: segue o hash ──
  useEffect(()=>{
    const handlePop = () => {
      const hash = window.location.hash.slice(1);
      if(hash.startsWith("seller-")){
        setSelectedId(null); setSelectedShirt(null);
        openSeller(hash.replace("seller-",""));
      } else if(hash.startsWith("item-")){
        setSellerSlug(null); setSellerProfile(null);
        openShirt(hash.replace("item-",""));
      } else {
        setSellerSlug(null); setSellerProfile(null);
        setSelectedId(null); setSelectedShirt(null);
        setPage(hash || "home");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── inicializa form de perfil ao abrir a tela ──
  useEffect(()=>{
    if(page==="myProfile"&&profile){
      setProfileForm({ name:profile.name||"", location:profile.location||"", state:profile.state||"", city:profile.city||"", bio:profile.bio||"", phone:profile.phone||"" });
      setProfileSaved(false);
    }
  },[page,profile]);

  async function loadShirts() {
    setShirtsLoading(true);
    const { data } = await supabase.from("shirts").select("*, profiles(name, rating, blocked, state)").order("created_at",{ ascending:false });
    setShirts(data||[]);
    setShirtsLoading(false);
  }

  async function loadSellers() {
    setSellersLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("name",{ ascending:true });
    setSellers(data||[]);
    setSellersLoading(false);
  }

  async function loadBanners() {
    const { data } = await supabase.from("banners").select("*").order("order_index",{ ascending:true });
    if(data&&data.length>0) setBanners(data);
  }

  async function handleSaveBanner(id) {
    setBannerSaving(id);
    setBannerErrors(prev => ({...prev, [id]: null}));
    const edit = adminBannerEdit[id];
    if (!edit || !Object.keys(edit).length) {
      addToast("Nenhuma alteração detectada.","error");
      setBannerSaving(null);
      return;
    }
    const { error } = await supabase.from("banners").update(edit).eq("id", id);
    if (!error) {
      setBanners(bs => bs.map(b => b.id===id ? {...b,...edit} : b));
      addToast("Banner atualizado!");
    } else {
      const msg = error.message || String(error);
      // Identifica qual coluna causou o erro
      const colMatch = msg.match(/column\s+"?(\w+)"?/i);
      const badCol = colMatch?.[1] || null;
      const missingCols = ["visible","link"].filter(c => msg.toLowerCase().includes(c));
      const needsMigration = msg.includes("does not exist") && missingCols.length > 0;
      setBannerErrors(prev => ({...prev, [id]: {
        message: msg,
        badCol,
        missingCols,
        needsMigration,
      }}));
    }
    setBannerSaving(null);
  }

  async function loadWishlist(uid) {
    const { data } = await supabase.from("wishlist").select("shirt_id").eq("user_id",uid);
    setWishlist((data||[]).map(r=>r.shirt_id));
  }

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(data);
    loadWishlist(uid);
    loadFollows(uid);
    setLoading(false);
  }

  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email:loginData.email, password:loginData.password });
    if(error) setAuthError("Email ou senha incorretos.");
    else setShowAuth(false);
    setAuthLoading(false);
  }

  async function handleRegister() {
    setAuthLoading(true); setAuthError("");
    if(reg.name.trim().length<2){ setAuthError("Nome deve ter pelo menos 2 caracteres."); setAuthLoading(false); return; }
    if(!/\S+@\S+\.\S+/.test(reg.email)){ setAuthError("Informe um email válido."); setAuthLoading(false); return; }
    if(reg.password.length<6){ setAuthError("Senha deve ter pelo menos 6 caracteres."); setAuthLoading(false); return; }
    const { error } = await supabase.auth.signUp({
      email:reg.email, password:reg.password,
      options:{ data:{ full_name:reg.name } }
    });
    if(error) setAuthError(error.message);
    else {
      // update profile with extra info
      const { data:{ session } } = await supabase.auth.getSession();
      if(session) await supabase.from("profiles").update({ state:reg.state, city:reg.city, location:[reg.city,reg.state].filter(Boolean).join(", ")||null, bio:reg.bio }).eq("id",session.user.id);
      setAuthError("✅ Conta criada! Verifique seu email para confirmar.");
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setPage("home");
  }

  async function toggleWishlist(shirtId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    if(wishlist.includes(shirtId)) {
      setWishlist(w=>w.filter(x=>x!==shirtId));
      await supabase.from("wishlist").delete().eq("user_id",user.id).eq("shirt_id",shirtId);
      addToast("Removido dos favoritos","info");
    } else {
      setWishlist(w=>[...w,shirtId]);
      await supabase.from("wishlist").insert({ user_id:user.id, shirt_id:shirtId });
      addToast("♥ Adicionado aos favoritos");
    }
  }

  async function handleAddShirt() {
    setFormSaving(true);
    const payload = {
      team:form.team, country:form.country, year:parseInt(form.year)||2024,
      edition:form.edition, condition:form.condition, price:parseFloat(form.price)||0,
      price_old:parseFloat(form.price_old)||null, size:form.size, model:form.model||null,
      type:form.type, region:form.region, description:form.description, photos:form.photos,
    };
    const { error } = editingShirtId
      ? await supabase.from("shirts").update(payload).eq("id",editingShirtId)
      : await supabase.from("shirts").insert({ ...payload, seller_id:user.id, featured:false });
    if(!error) { await loadShirts(); setFormDone(true); addToast(editingShirtId?"Anúncio atualizado!":"Anúncio publicado! 🎉"); }
    else { alert("Erro ao salvar: "+error.message); addToast("Erro ao salvar anúncio","error"); }
    setFormSaving(false);
  }

  function startEditShirt(shirt) {
    setForm({
      team:shirt.team||"", country:shirt.country||"", year:shirt.year||"",
      edition:shirt.edition||"", condition:shirt.condition||"Nova",
      price:shirt.price||"", price_old:shirt.price_old||"",
      size:shirt.size||"M", model:shirt.model||"",
      type:shirt.type||"times", region:shirt.region||"nacional",
      description:shirt.description||"", photos:shirt.photos||[],
    });
    setEditingShirtId(shirt.id);
    setFormStep(1);
    setFormDone(false);
    setFormErrors({});
    setPage("addProduct");
  }

  async function handleDeleteShirt(shirtId) {
    if(!window.confirm("Excluir este anúncio? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("shirts").delete().eq("id",shirtId);
    if(!error) { await loadShirts(); addToast("Anúncio excluído com sucesso"); }
    else addToast("Erro ao excluir anúncio","error");
  }

  async function handleToggleShirtStatus(shirtId, currentStatus) {
    const newStatus = currentStatus === "vendido" ? "disponivel" : "vendido";
    const { error } = await supabase.from("shirts").update({ status: newStatus }).eq("id", shirtId);
    if(!error) {
      setShirts(ss => ss.map(s => s.id === shirtId ? { ...s, status: newStatus } : s));
      addToast(newStatus === "vendido" ? "Marcado como vendido ✓" : "Reativado no catálogo ✓");
    } else addToast("Erro ao atualizar status","error");
  }

  async function handleToggleBlock(seller) {
    const newBlocked = !seller.blocked;
    const { error } = await supabase.from("profiles").update({ blocked:newBlocked }).eq("id",seller.id);
    if(!error){
      setSellers(ss=>ss.map(s=>s.id===seller.id?{...s,blocked:newBlocked}:s));
      await loadShirts();
      addToast(newBlocked?`${seller.name} bloqueado`:`${seller.name} desbloqueado`, newBlocked?"error":"success");
    } else addToast("Erro ao atualizar usuário","error");
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    const derivedLocation = [profileForm.city,profileForm.state].filter(Boolean).join(", ")||profileForm.location;
    const { error } = await supabase.from("profiles")
      .update({ name:profileForm.name, location:derivedLocation, state:profileForm.state, city:profileForm.city, bio:profileForm.bio, phone:profileForm.phone })
      .eq("id",user.id);
    if(!error){
      setProfile(p=>({ ...p, name:profileForm.name, location:derivedLocation, state:profileForm.state, city:profileForm.city, bio:profileForm.bio, phone:profileForm.phone }));
      setProfileSaved(true);
      addToast("Perfil atualizado com sucesso!");
    } else {
      addToast("Erro ao salvar perfil","error");
    }
    setProfileSaving(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if(!file) return;
    const AVATAR_TYPES = ["image/jpeg","image/png","image/webp"];
    if(!AVATAR_TYPES.includes(file.type)||file.size>5*1024*1024){ addToast("Use JPG, PNG ou WebP · máx. 5MB","error"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error:upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert:true });
    if(upErr){ addToast("Erro ao enviar foto: "+upErr.message,"error"); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl+"?t="+Date.now();
    await supabase.from("profiles").update({ avatar_url:avatarUrl }).eq("id",user.id);
    setProfile(p=>({ ...p, avatar_url:avatarUrl }));
    addToast("Foto de perfil atualizada!");
    e.target.value="";
  }

  function validateStep1() {
    const errs = {};
    if(!form.team.trim()) errs.team = "Obrigatório";
    if(!form.price||parseFloat(form.price)<=0) errs.price = "Informe um preço válido";
    const yr = parseInt(form.year);
    if(form.year&&(yr<1900||yr>new Date().getFullYear()+1)) errs.year = "Ano inválido";
    if(form.price_old&&parseFloat(form.price_old)<=parseFloat(form.price||0)) errs.price_old = "Deve ser maior que o preço atual";
    setFormErrors(errs);
    return Object.keys(errs).length===0;
  }

  function requireAuth(fn) {
    if(user) fn();
    else { setShowAuth(true); setAuthStep("login"); setAuthError(""); }
  }

  async function loadReviews(sellerId) {
    const { data } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviewer_id(name, avatar_url)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending:false });
    setSellerReviews(data || []);
  }

  async function loadFollows(uid) {
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
    setFollows((data || []).map(r => r.following_id));
  }

  async function handleToggleFollow(sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    const isFollowing = follows.includes(sellerId);
    if(isFollowing){
      setFollows(f=>f.filter(id=>id!==sellerId));
      setSellerProfile(p=>p?{...p,followers:Math.max(0,(p.followers||1)-1)}:p);
      await supabase.from("follows").delete().eq("follower_id",user.id).eq("following_id",sellerId);
      await supabase.from("profiles").update({ followers:Math.max(0,(sellerProfile?.followers||1)-1) }).eq("id",sellerId);
    } else {
      setFollows(f=>[...f,sellerId]);
      setSellerProfile(p=>p?{...p,followers:(p.followers||0)+1}:p);
      await supabase.from("follows").insert({ follower_id:user.id, following_id:sellerId });
      await supabase.from("profiles").update({ followers:(sellerProfile?.followers||0)+1 }).eq("id",sellerId);
    }
    addToast(isFollowing?"Deixou de seguir":"Seguindo! ✓", isFollowing?"info":"success");
  }

  async function handleSubmitReview(sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    setReviewLoading(true);
    const { error } = await supabase.from("reviews").upsert({
      reviewer_id:user.id, seller_id:sellerId,
      rating:reviewForm.rating, comment:reviewForm.comment.trim(),
    },{ onConflict:"reviewer_id,seller_id" });
    if(!error){
      await loadReviews(sellerId);
      const { data:allR } = await supabase.from("reviews").select("rating").eq("seller_id",sellerId);
      if(allR?.length){
        const avg = Math.round((allR.reduce((s,r)=>s+r.rating,0)/allR.length)*10)/10;
        await supabase.from("profiles").update({ rating:avg }).eq("id",sellerId);
        setSellerProfile(p=>p?{...p,rating:avg}:p);
      }
      addToast("Avaliação enviada! ⭐");
      setReviewForm({ rating:5, comment:"" });
    } else {
      addToast("Erro ao enviar avaliação","error");
    }
    setReviewLoading(false);
  }

  async function handleShare(shirt) {
    const url = window.location.href;
    const title = `${shirt.team}${shirt.edition?" – "+shirt.edition:""} | FutShirt Market`;
    const text = `Confira esta camiseta: ${shirt.team}${shirt.edition?" "+shirt.edition:""} por R$ ${Number(shirt.price).toLocaleString("pt-BR")}`;
    if(navigator.share) {
      try { await navigator.share({ title, text, url }); } catch(e) { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(url); addToast("🔗 Link copiado!"); }
      catch { addToast("Não foi possível copiar o link","error"); }
    }
  }

  async function loadAdminNotifs() {
    const { data } = await supabase.from("email_notifications")
      .select("*").order("created_at",{ ascending:false }).limit(100);
    setAdminNotifs(data || []);
  }

  async function handleRequestBoost(shirtId) {
    setBoostLoading(true);
    const { error } = await supabase.from("shirts")
      .update({ boost_requested_at: new Date().toISOString() })
      .eq("id", shirtId);
    if(!error){
      setShirts(ss => ss.map(s => s.id===shirtId ? {...s, boost_requested_at: new Date().toISOString()} : s));
      setBoostModal(null);
      addToast("Solicitação enviada! Aguarde a confirmação do pagamento.");
    } else addToast("Erro ao solicitar destaque","error");
    setBoostLoading(false);
  }

  async function handleActivateBoost(shirtId) {
    const until = new Date(Date.now() + BOOST_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("shirts")
      .update({ boosted: true, boosted_until: until, boost_requested_at: null })
      .eq("id", shirtId);
    if(!error){
      await loadShirts();
      addToast(`Destaque ativado por ${BOOST_DAYS} dias! ⚡`);
    } else addToast("Erro ao ativar destaque","error");
  }

  async function handleDeactivateBoost(shirtId) {
    const { error } = await supabase.from("shirts")
      .update({ boosted: false, boosted_until: null, boost_requested_at: null })
      .eq("id", shirtId);
    if(!error){
      await loadShirts();
      addToast("Destaque removido.","info");
    } else addToast("Erro ao remover destaque","error");
  }

  async function loadAdminQuestions() {
    const { data } = await supabase.from("questions")
      .select("*, asker:profiles!asker_id(name), shirt:shirts(team,edition)")
      .order("created_at", { ascending: false })
      .limit(100);
    setAdminQuestions(data || []);
  }

  async function loadQuestions(shirtId) {
    const { data } = await supabase.from("questions")
      .select("*, asker:profiles!asker_id(name,avatar_url)")
      .eq("shirt_id", shirtId)
      .order("created_at", { ascending: true });
    setShirtQuestions(data || []);
  }

  async function handleAskQuestion(shirtId, sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    const text = questionText.trim();
    if(!text) return;
    if(hasProfanity(text)){ addToast("Sua pergunta contém linguagem inadequada.","error"); return; }
    setQuestionLoading(true);
    const { error } = await supabase.from("questions").insert({
      shirt_id: shirtId, asker_id: user.id, seller_id: sellerId, question: text,
    });
    if(!error){ await loadQuestions(shirtId); setQuestionText(""); addToast("Pergunta enviada!"); }
    else addToast("Erro ao enviar pergunta","error");
    setQuestionLoading(false);
  }

  async function handleAnswerQuestion(questionId, shirtId) {
    const text = (answerTexts[questionId]||"").trim();
    if(!text) return;
    if(hasProfanity(text)){ addToast("Sua resposta contém linguagem inadequada.","error"); return; }
    setAnswerLoading(questionId);
    const { error } = await supabase.from("questions")
      .update({ answer: text, answered_at: new Date().toISOString() })
      .eq("id", questionId);
    if(!error){ await loadQuestions(shirtId); setAnswerTexts(t=>({ ...t, [questionId]:"" })); addToast("Resposta publicada!"); }
    else addToast("Erro ao responder","error");
    setAnswerLoading(null);
  }

  async function handleDeleteQuestion(questionId, shirtId) {
    if(!window.confirm("Remover esta pergunta?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if(!error){ await loadQuestions(shirtId); addToast("Pergunta removida.","info"); }
    else addToast("Erro ao remover pergunta","error");
  }

  function addToast(message, type="success") {
    const id = Date.now();
    setToasts(ts=>[...ts,{ id,message,type }]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)),3200);
  }

  async function openShirt(id) {
    window.history.pushState(null, "", `#item-${id}`);
    setSelectedId(id);
    setPhotoIdx(0);
    setShirtQuestions([]);
    setQuestionText("");
    setAnswerTexts({});
    const { data } = await supabase.from("shirts").select("*, profiles(*)").eq("id",id).single();
    setSelectedShirt(data);
    loadQuestions(id);
  }

  async function openSeller(sellerId) {
    window.history.pushState(null, "", `#seller-${sellerId}`);
    const cached = sellers.find(s => s.id === sellerId) || null;
    setSellerSlug(sellerId);
    setSellerProfile(cached);
    setSellerReviews([]);
    setReviewForm({ rating:5, comment:"" });
    loadReviews(sellerId);
    const { data } = await supabase.from("profiles").select("*").eq("id",sellerId).single();
    if(data) setSellerProfile(data);
  }

  // apply filters
  function applyFilters(list) {
    return list.filter(s=>{
      if(s.profiles?.blocked) return false;
      if(s.status === "vendido") return false;
      if(search && !`${s.team} ${s.edition} ${s.country} ${s.year}`.toLowerCase().includes(search.toLowerCase())) return false;
      if(filters.state     && s.profiles?.state !== filters.state) return false;
      if(filters.type      && s.type      !== filters.type)      return false;
      if(filters.region    && s.region    !== filters.region)    return false;
      if(filters.condition && s.condition !== filters.condition) return false;
      if(filters.model     && s.model     !== filters.model)     return false;
      if(filters.size      && s.size      !== filters.size)      return false;
      if(filters.price && filters.price!=="all") {
        const [mn,mx] = filters.price==="2000+"?[2000,Infinity]:filters.price.split("-").map(Number);
        if(s.price<mn||s.price>mx) return false;
      }
      return true;
    }).sort((a,b)=>{
      const ab=isBoosted(a),bb=isBoosted(b);
      if(ab&&!bb) return -1; if(!ab&&bb) return 1;
      return sortBy==="preco_asc"?a.price-b.price:sortBy==="preco_desc"?b.price-a.price:sortBy==="avaliacao"?(b.rating||0)-(a.rating||0):0;
    });
  }

  const filtered  = applyFilters(shirts);
  const available = shirts.filter(s=>s.status!=="vendido"&&!s.profiles?.blocked);
  const promos    = available.filter(s=>s.price_old);
  // featured removido — home agora usa seções dinâmicas (recent, topRated, promos)
  const recent    = available.slice(0,6);
  const topRated  = available.filter(s=>(s.rating||0)>=4).sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,6);

  // ── TOAST LAYER (position:fixed, aparece sobre qualquer página) ──
  const toastEl = toasts.length>0&&(
    <div style={{ position:"fixed",top:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:300,pointerEvents:"none" }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:t.type==="error"?C.redLight:t.type==="info"?C.blueLight:C.greenLight, color:t.type==="error"?C.red:t.type==="info"?C.blue:C.greenDark, padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.12)",display:"flex",alignItems:"center",gap:8 }}>
          <span>{t.type==="error"?"❌":t.type==="info"?"ℹ️":"✅"}</span>{t.message}
        </div>
      ))}
    </div>
  );

  // ── LOADING ──
  if(loading) return <div style={{ fontFamily:"system-ui,sans-serif",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;

  // ── AUTH MODAL (aparece sobre qualquer página quando ação exige login) ──
  const authModal = showAuth && (
    <div onClick={e=>{ if(e.target===e.currentTarget) setShowAuth(false); }} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto" }}>
      <div style={{ width:"100%",maxWidth:400,position:"relative" }}>
        <button onClick={()=>setShowAuth(false)} style={{ position:"absolute",top:-38,right:0,background:"rgba(255,255,255,.18)",border:"none",color:"#fff",borderRadius:8,padding:"5px 13px",cursor:"pointer",fontSize:13,fontWeight:500 }}>✕ Fechar</button>
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:20,padding:"1.75rem" }}>
          {authStep==="login" ? <>
            <div style={{ textAlign:"center",marginBottom:"1.25rem" }}>
              <div style={{ width:40,height:40,borderRadius:10,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 8px" }}>⚽</div>
              <h3 style={{ margin:0,fontWeight:700,fontSize:17 }}>Entrar na conta</h3>
            </div>
            {authError&&<p style={{ margin:"0 0 12px",padding:"10px 14px",background:authError.startsWith("✅")?C.greenLight:C.redLight,color:authError.startsWith("✅")?C.greenDark:C.red,borderRadius:8,fontSize:13 }}>{authError}</p>}
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:"1.25rem" }}>
              {[["Email","email","email"],["Senha","password","password"]].map(([l,k,t])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
                  <div style={{ position:"relative" }}>
                    <input type={k==="password"?(showLoginPwd?"text":"password"):t} value={loginData[k]} onChange={e=>setLoginData(d=>({...d,[k]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ width:"100%",padding:"9px 40px 9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
                    {k==="password"&&<button type="button" onClick={()=>setShowLoginPwd(v=>!v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.gray400,padding:0,lineHeight:1 }}>{showLoginPwd?"🙈":"👁️"}</button>}
                  </div>
                </div>
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
              {[["Nome completo *","name","text"],["Email *","email","email"],["Senha *","password","password"]].map(([l,k,t])=>(
                <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>{l}</label><input type={t} value={reg[k]} onChange={e=>setReg(r=>({...r,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} /></div>
              ))}
              <CityStatePicker stateVal={reg.state} cityVal={reg.city} onStateChange={v=>setReg(r=>({...r,state:v}))} onCityChange={v=>setReg(r=>({...r,city:v}))} />
              <div><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>Sobre você</label><textarea value={reg.bio} onChange={e=>setReg(r=>({...r,bio:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
            </div>
            <button onClick={handleRegister} disabled={authLoading||!reg.name||!reg.email||!reg.password} style={{ marginTop:"1rem",width:"100%",padding:"12px 0",background:C.green,color:C.white,border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,opacity:authLoading?.7:1 }}>{authLoading?"Criando conta...":"Criar conta"}</button>
          </>}
        </div>
      </div>
    </div>
  );

  // ── BOOST MODAL ──
  const boostModalEl = boostModal && (
    <div onClick={e=>{ if(e.target===e.currentTarget) setBoostModal(null); }} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ background:C.white,borderRadius:"20px 20px 0 0",padding:"1.5rem",width:"100%",maxWidth:480,boxSizing:"border-box" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.gray200,margin:"0 auto 18px" }} />
        <h3 style={{ margin:"0 0 4px",fontWeight:700,fontSize:17 }}>⚡ Impulsionar Anúncio</h3>
        <p style={{ margin:"0 0 18px",fontSize:13,color:C.gray400 }}>{boostModal.team}{boostModal.edition?` · ${boostModal.edition}`:""}</p>

        <div style={{ background:"linear-gradient(120deg,#fef3c7,#fde68a)",borderRadius:14,padding:"1rem 1.25rem",marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <span style={{ fontWeight:700,fontSize:20,color:"#92400e" }}>{BOOST_PRICE}</span>
            <span style={{ fontSize:13,color:"#b45309",fontWeight:600 }}>{BOOST_DAYS} dias</span>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {["⚡ Aparece em destaque na home","🔝 Topo do catálogo","🏷️ Badge dourado no card"].map(t=>(
              <span key={t} style={{ fontSize:13,color:"#92400e" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"12px 14px",marginBottom:16 }}>
          <p style={{ margin:"0 0 6px",fontWeight:600,fontSize:13,color:C.gray900 }}>Como pagar:</p>
          <p style={{ margin:"0 0 4px",fontSize:13,color:C.gray600 }}>1. Envie {BOOST_PRICE} via Pix para o admin</p>
          <p style={{ margin:"0 0 4px",fontSize:13,color:C.gray600 }}>2. Clique em "Solicitar Destaque" abaixo</p>
          <p style={{ margin:0,fontSize:13,color:C.gray600 }}>3. Após confirmação do pagamento, o destaque é ativado em até 24h</p>
        </div>

        <button onClick={()=>handleRequestBoost(boostModal.id)} disabled={boostLoading} style={{ width:"100%",padding:"13px 0",border:"none",borderRadius:12,background:"linear-gradient(90deg,#f59e0b,#f97316)",color:C.white,fontSize:15,fontWeight:700,cursor:"pointer",opacity:boostLoading?.7:1,marginBottom:8 }}>
          {boostLoading?"Enviando...":"Solicitar Destaque ⚡"}
        </button>
        <button onClick={()=>setBoostModal(null)} style={{ width:"100%",padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:14,color:C.gray600 }}>Cancelar</button>
      </div>
    </div>
  );

  // ── NAV ──
  function navigate(target) {
    window.history.pushState(null, "", target === "home" ? "#" : `#${target}`);
    setPage(target);
    setSellerSlug(null);
    setSellerProfile(null);
    setSelectedId(null);
    setSelectedShirt(null);
  }
  function deepNavigate(link) {
    if (!link) { navigate("catalog"); return; }
    if (isUrl(link)) { window.open(link, "_blank"); return; }
    if (link.includes("?")) {
      const { page, params } = parseDeepLink(link);
      if (params.search !== undefined) setSearch(params.search);
      const fKeys = ["type","region","condition","model","size","price","state"];
      const upd = {};
      fKeys.forEach(k => { if (params[k]) upd[k] = params[k]; });
      if (Object.keys(upd).length) setFilters(f => ({...f,...upd}));
      navigate(page);
    } else {
      navigate(link);
    }
  }

  const NavBar = () => (
    <div style={{ borderBottom:`1px solid ${C.gray100}`,marginBottom:20 }}>
      {/* Linha principal */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 0 0.6rem" }}>
        <div onClick={()=>navigate("home")} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
          <div style={{ width:30,height:30,borderRadius:8,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>⚽</div>
          <span style={{ fontWeight:800,fontSize:16,color:C.gray900,letterSpacing:-.3 }}>FutShirt</span>
        </div>
        {/* Links de navegação — ocultos no mobile */}
        {!isMobile&&<div style={{ display:"flex",gap:4 }}>
          {[["home","Home"],["catalog","Catálogo"],["sellers","Vendedores"]].map(([v,l])=>(
            <button key={v} onClick={()=>navigate(v)} style={{ background:page===v?C.greenLight:"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page===v?600:400,color:page===v?C.green:C.gray600 }}>{l}</button>
          ))}
          {profile?.role==="admin"&&<button onClick={()=>navigate("admin")} style={{ background:page==="admin"?"#fef3c7":"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page==="admin"?600:400,color:page==="admin"?C.amber:C.gray600 }}>⚙️ Admin</button>}
        </div>}
        {/* Ações à direita */}
        <div style={{ display:"flex",alignItems:"center",gap:isMobile?6:8 }}>
          {user ? <>
            <button onClick={()=>navigate("wishlist")} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,color:page==="wishlist"?C.red:C.gray600 }}>
              ♥{wishlist.length>0&&<span style={{ background:C.red,color:C.white,borderRadius:99,fontSize:10,padding:"1px 5px",marginLeft:4 }}>{wishlist.length}</span>}
            </button>
            {!isMobile&&<button onClick={()=>navigate("addProduct")} style={{ padding:"6px 13px",borderRadius:9,border:"none",background:C.green,color:C.white,fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Anunciar</button>}
            <div onClick={()=>navigate("myProfile")} style={{ cursor:"pointer" }}><Avatar name={profile?.name||"?"} size={30} src={profile?.avatar_url} /></div>
            {!isMobile&&<button onClick={handleLogout} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.gray600 }}>Sair</button>}
          </> : <>
            {!isMobile&&<button onClick={()=>{ setShowAuth(true); setAuthStep("login"); setAuthError(""); }} style={{ padding:"6px 14px",borderRadius:9,border:`1px solid ${C.green}`,background:C.white,color:C.green,fontSize:13,fontWeight:600,cursor:"pointer" }}>Entrar</button>}
            {!isMobile&&<button onClick={()=>{ setShowAuth(true); setAuthStep("register"); setAuthError(""); }} style={{ padding:"6px 14px",borderRadius:9,border:"none",background:C.green,color:C.white,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cadastrar</button>}
          </>}
        </div>
      </div>
      {/* Segunda linha no mobile — links + anunciar + sair */}
      {isMobile&&<div style={{ display:"flex",gap:2,paddingBottom:"0.5rem",overflowX:"auto" }}>
        {[["home","🏠 Home"],["catalog","📋 Catálogo"],["sellers","👥 Vendedores"]].map(([v,l])=>(
          <button key={v} onClick={()=>navigate(v)} style={{ flex:1,background:page===v?C.greenLight:"none",border:"none",fontSize:11,cursor:"pointer",padding:"5px 2px",borderRadius:8,fontWeight:page===v?600:400,color:page===v?C.green:C.gray600,whiteSpace:"nowrap" }}>{l}</button>
        ))}
        {user ? <>
          {profile?.role==="admin"&&<button onClick={()=>navigate("admin")} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:page==="admin"?"#fef3c7":"none",color:C.amber,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>⚙️ Admin</button>}
          <button onClick={()=>navigate("addProduct")} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:C.green,color:C.white,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>+ Anunciar</button>
          <button onClick={handleLogout} style={{ flex:1,background:"none",border:"none",fontSize:11,cursor:"pointer",padding:"5px 2px",borderRadius:8,color:C.gray600,whiteSpace:"nowrap" }}>Sair</button>
        </> : <>
          <button onClick={()=>{ setShowAuth(true); setAuthStep("login"); setAuthError(""); }} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:`1px solid ${C.green}`,background:C.white,color:C.green,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>Entrar</button>
          <button onClick={()=>{ setShowAuth(true); setAuthStep("register"); setAuthError(""); }} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:C.green,color:C.white,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>Cadastrar</button>
        </>}
      </div>}
    </div>
  );

  // ── ADD PRODUCT ──
  if(page==="addProduct") {
    if(user && !user.email_confirmed_at) return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
          <div style={{ fontSize:56,marginBottom:14 }}>📧</div>
          <h3 style={{ margin:"0 0 8px",fontWeight:700,fontSize:18,color:C.gray900 }}>Verifique seu email</h3>
          <p style={{ margin:"0 0 20px",fontSize:14,color:C.gray400,lineHeight:1.6,maxWidth:300,marginLeft:"auto",marginRight:"auto" }}>
            Para anunciar camisetas é necessário confirmar seu email. Verifique sua caixa de entrada e clique no link de confirmação.
          </p>
          <button onClick={()=>setPage("myProfile")} style={{ padding:"10px 26px",background:C.green,color:C.white,border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>
            Ir para meu perfil
          </button>
        </div>
        {authModal}
        {toastEl}
      </div>
    );
    if(formDone) return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
          <div style={{ fontSize:56,marginBottom:12 }}>🎉</div>
          <h2 style={{ fontWeight:700 }}>{editingShirtId?"Anúncio atualizado!":"Anúncio publicado!"}</h2>
          <p style={{ color:C.gray400 }}>Sua camiseta já está visível no catálogo.</p>
          <button onClick={()=>{ setPage("catalog"); setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); }} style={{ marginTop:12,padding:"10px 24px",background:C.green,color:C.white,border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>Ver catálogo →</button>
        </div>
        {authModal}
        {toastEl}
      </div>
    );
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0.5rem 0 1.5rem" }}>
          <button onClick={()=>{ setPage(editingShirtId?"sellers":"home"); setEditingShirtId(null); setForm(emptyForm); setFormStep(1); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer" }}>←</button>
          <h2 style={{ margin:0,fontWeight:700,fontSize:18 }}>{editingShirtId?"Editar camiseta":"Cadastrar camiseta"}</h2>
        </div>
        <div style={{ display:"flex",gap:6,marginBottom:6 }}>{[1,2,3].map(n=><div key={n} style={{ flex:1,height:4,borderRadius:4,background:formStep>=n?C.green:C.gray200 }} />)}</div>
        <p style={{ margin:"0 0 1.5rem",fontSize:12,color:C.gray400 }}>Passo {formStep} de 3 — {["","Dados da camiseta","Fotos do produto","Revisão e publicação"][formStep]}</p>
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,padding:"1.5rem" }}>
          {formStep===1&&<div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12 }}>
            {[["Time *","team","text"],["País *","country","text"],["Ano","year","number"],["Edição","edition","text"],["Preço (R$) *","price","number"],["Preço original","price_old","number"]].map(([l,k,t])=>(
              <div key={k} style={{ gridColumn:(!isMobile&&k==="price_old")?"1/-1":"auto" }}>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>{ setForm(f=>({...f,[k]:e.target.value})); if(formErrors[k]) setFormErrors(fe=>({...fe,[k]:null})); }} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors[k]?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
                {formErrors[k]&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors[k]}</p>}
              </div>
            ))}
            {[["Categoria","type",[["times","Times"],["selecoes","Seleções"]]],["Região","region",[["nacional","Nacional"],["europa","Europa"],["america_sul","Am. Sul"],["america_norte","Am. Norte"],["africa","África"],["asia","Ásia"]]],["Condição","condition",[["Nova","Nova"],["Usada","Usada"]]],["Tamanho","size",[["PP","PP"],["P","P"],["M","M"],["G","G"],["GG","GG"]]],["Tipo","model",[["","Selecione..."],["Modelo Jogador","Modelo Jogador"],["Modelo Torcedor","Modelo Torcedor"],["Utilizado em Jogo","Utilizado em Jogo"]]]].map(([l,k,opts])=>(
              <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label><select value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>{opts.map(([v,lbl])=><option key={v} value={v}>{lbl}</option>)}</select></div>
            ))}
            <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Descrição</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
          </div>}
         {formStep === 2 && (
  <div>
    <p style={{ margin: "0 0 1rem", fontSize: 14 }}>
      Adicione até <b>6 fotos</b>. A primeira será a capa do anúncio.
    </p>
    <PhotoUploader
      userId={user.id}
      photos={form.photos}
      setPhotos={(next) =>
        setForm((f) => ({
          ...f,
          photos: typeof next === "function" ? next(f.photos) : next,
        }))
      }
    />
  </div>
)}
          {formStep===3&&<div>
            <div style={{ display:"flex",gap:14,marginBottom:16,alignItems:"flex-start" }}>
              <div style={{ background:C.gray50,borderRadius:12,overflow:"hidden",width:80,flexShrink:0 }}><ShirtPhoto value={form.photos[0]||"❓"} size={80} /></div>
              <div style={{ flex:1 }}><h3 style={{ margin:"0 0 3px",fontWeight:700,fontSize:16 }}>{form.team||"—"}</h3><p style={{ margin:"0 0 6px",fontSize:13,color:C.gray600 }}>{form.edition} · {form.year} · {form.country}</p><Tag rarity={form.rarity} /></div>
              <div style={{ textAlign:"right" }}><p style={{ margin:0,fontWeight:700,color:C.green,fontSize:20 }}>R$ {parseFloat(form.price||0).toLocaleString("pt-BR")}</p>{form.price_old&&<p style={{ margin:0,fontSize:12,color:C.gray400,textDecoration:"line-through" }}>R$ {parseFloat(form.price_old).toLocaleString("pt-BR")}</p>}</div>
            </div>
            {form.photos.length > 0 && (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
    {form.photos.map((url, i) => (
      <div key={i} style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: i === 0 ? "2px solid #16a34a" : "1px solid #e5e7eb", position: "relative" }}>
        <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {i === 0 && <span style={{ position: "absolute", bottom: 2, left: 2, fontSize: 8, background: "#16a34a", color: "#fff", borderRadius: 3, padding: "1px 4px" }}>capa</span>}
      </div>
    ))}
  </div>
)}
          </div>}
        </div>
        <div style={{ display:"flex",gap:10,marginTop:14 }}>
          {formStep>1&&<button onClick={()=>setFormStep(s=>s-1)} style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:14 }}>← Anterior</button>}
          {formStep<3
            ?<button onClick={()=>{ if(formStep===1){ if(!validateStep1()) return; } setFormStep(s=>s+1); }} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600 }}>Próximo →</button>
            :<button onClick={handleAddShirt} disabled={formSaving} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600 }}>{formSaving?"Salvando...":editingShirtId?"Salvar alterações ✓":"Publicar anúncio ✓"}</button>
          }
        </div>
        {authModal}
        {toastEl}
      </div>
    );
  }

  // ── SELLER PROFILE ──
  if(sellerSlug) {
    const sellerShirts = shirts.filter(sh=>sh.seller_id===sellerSlug);
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <TrustBar />
        <button onClick={()=>{ setSellerSlug(null); setSellerProfile(null); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"0.25rem 0 1rem" }}>← Voltar</button>
        {!sellerProfile ? <Spinner /> : <>
          <div style={{ background:`linear-gradient(120deg,${C.greenDark},${C.green})`,borderRadius:18,height:90 }} />
          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 4px",marginTop:-32,marginBottom:14 }}>
            <div style={{ border:`3px solid ${C.white}`,borderRadius:"50%" }}><Avatar name={sellerProfile.name} size={64} src={sellerProfile.avatar_url} /></div>
            <div style={{ display:"flex",gap:8,marginBottom:4 }}>
              {user?.id !== sellerSlug && (
                <button onClick={()=>handleToggleFollow(sellerSlug)} style={{ padding:"6px 14px",border:`1px solid ${follows.includes(sellerSlug)?C.green:C.gray200}`,borderRadius:9,background:follows.includes(sellerSlug)?C.greenLight:C.white,color:follows.includes(sellerSlug)?C.greenDark:C.gray600,cursor:"pointer",fontSize:13,fontWeight:follows.includes(sellerSlug)?600:400 }}>
                  {follows.includes(sellerSlug)?"✓ Seguindo":"+ Seguir"}
                </button>
              )}
              <button onClick={()=>requireAuth(()=>setContactModal(sellerProfile))} style={{ padding:"6px 14px",border:`1px solid ${C.gray200}`,borderRadius:9,background:C.white,cursor:"pointer",fontSize:13 }}>💬 Mensagem</button>
            </div>
          </div>
          <h2 style={{ margin:"0 0 2px",fontWeight:700,fontSize:20 }}>{sellerProfile.name}</h2>
          <p style={{ margin:"0 0 8px",color:C.gray400,fontSize:13 }}>📍 {sellerProfile.location||"—"}</p>
          <p style={{ margin:"0 0 14px",fontSize:14,color:C.gray600,lineHeight:1.6 }}>{sellerProfile.bio||""}</p>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14 }}>
            {[["Vendas",sellerProfile.sales||0],["Seguidores",sellerProfile.followers||0],["Avaliação",`${Number(sellerProfile.rating||5).toFixed(1)} ★`],["Desde",sellerProfile.created_at?new Date(sellerProfile.created_at).toLocaleDateString("pt-BR",{month:"short",year:"numeric"}):sellerProfile.joined||"—"]].map(([l,v])=>(
              <div key={l} style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"0.7rem",textAlign:"center" }}><p style={{ margin:0,fontSize:18,fontWeight:700 }}>{v}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.gray400 }}>{l}</p></div>
            ))}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:18 }}>
            {(sellerProfile.badges||[]).map(b=><span key={b} style={{ background:"#fefce8",color:"#854d0e",border:"1px solid #fde68a",borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:500 }}>{badgeIcon[b]||"🏅"} {b}</span>)}
          </div>
          <SectionHead icon="🏷️" sub="anúncios" title={`${sellerShirts.length} itens à venda`} />
          {sellerShirts.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Nenhum anúncio publicado ainda.</p>}
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(148px,1fr))":"repeat(auto-fill,minmax(210px,1fr))",gap:12 }}>
            {sellerShirts.map(sh=>(
              <div key={sh.id} style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <ShirtCard s={sh} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={id=>{ setSellerSlug(null); openShirt(id); }} />
                {sellerSlug===user?.id&&(
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>startEditShirt(sh)} style={{ flex:1,padding:"6px 0",background:C.white,border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.gray600 }}>✏️ Editar</button>
                    <button onClick={()=>handleDeleteShirt(sh.id)} style={{ padding:"6px 10px",background:C.redLight,border:`1px solid ${C.red}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.red }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── REVIEWS ── */}
          <div style={{ marginTop:28 }}>
            <SectionHead icon="⭐" sub="avaliações" title={`${sellerReviews.length} avaliação${sellerReviews.length!==1?"s":""}`} />
            {user && user.id !== sellerSlug && (
              <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"16px",marginBottom:16 }}>
                <p style={{ margin:"0 0 10px",fontWeight:600,fontSize:14,color:C.gray900 }}>
                  {sellerReviews.find(r=>r.reviewer_id===user.id)?"Sua avaliação":"Avaliar este vendedor"}
                </p>
                <StarPicker value={reviewForm.rating} onChange={v=>setReviewForm(f=>({...f,rating:v}))} />
                <textarea
                  value={reviewForm.comment}
                  onChange={e=>setReviewForm(f=>({...f,comment:e.target.value}))}
                  placeholder="Deixe um comentário (opcional)..."
                  rows={3}
                  style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none",marginTop:10 }}
                />
                <button
                  onClick={()=>handleSubmitReview(sellerSlug)}
                  disabled={reviewLoading}
                  style={{ marginTop:10,padding:"9px 20px",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:13,cursor:"pointer",opacity:reviewLoading?.7:1 }}
                >
                  {reviewLoading?"Enviando...":"Enviar avaliação ⭐"}
                </button>
              </div>
            )}
            {sellerReviews.length===0 ? (
              <p style={{ color:C.gray400,fontSize:14 }}>Nenhuma avaliação ainda. Seja o primeiro!</p>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {sellerReviews.map(r=>(
                  <div key={r.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"12px 14px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                      <Avatar name={r.reviewer?.name||"?"} size={32} src={r.reviewer?.avatar_url} />
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0,fontWeight:600,fontSize:13 }}>{r.reviewer?.name||"Usuário"}</p>
                        <Star v={r.rating} />
                      </div>
                      <p style={{ margin:0,fontSize:11,color:C.gray400 }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {r.comment&&<p style={{ margin:0,fontSize:13,color:C.gray600,lineHeight:1.5 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>}
        <Footer onNavigate={navigate} />
        {contactModal&&<ContactModal seller={contactModal} onClose={()=>setContactModal(null)} />}
        {authModal}
        {toastEl}
      </div>
    );
  }

  // ── ITEM DETAIL ──
  if(selectedId) {
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <TrustBar />
        <button onClick={()=>{ setSelectedId(null); setSelectedShirt(null); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"0.25rem 0 1rem" }}>← Voltar</button>
        {profile?.role==="admin"&&selectedShirt&&(
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#fef3c7",borderRadius:10,border:"1px solid #fcd34d",marginBottom:12,flexWrap:"wrap" }}>
            <span style={{ fontSize:11,fontWeight:700,color:"#92400e",flexShrink:0 }}>⚙️ Admin</span>
            <span style={{ fontSize:11,color:"#78350f",flexShrink:0 }}>ID do produto:</span>
            <code style={{ fontSize:11,color:"#78350f",fontFamily:"monospace",background:"#fef9c3",padding:"2px 7px",borderRadius:5,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0 }}>{selectedShirt.id}</code>
            <button
              onClick={()=>{ navigator.clipboard.writeText(`item-${selectedShirt.id}`); addToast("Copiado! Cole em Destino no banner admin."); }}
              style={{ padding:"4px 12px",borderRadius:7,border:"1px solid #f59e0b",background:"#fff",color:"#92400e",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0 }}>
              Copiar item-ID
            </button>
          </div>
        )}
        {!selectedShirt ? <Spinner /> : (()=>{
          const s = selectedShirt;
          const sl = s.profiles;
          return (
            <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:20,overflow:"hidden" }}>
              <div style={{ background: C.gray50, position: "relative", cursor: "zoom-in" }}
                onClick={() => setLightbox((s.photos || [])[photoIdx] || null)}
              >
                <ShirtPhoto value={(s.photos || [])[photoIdx] || "?"} size={320} />
              </div>
              {(s.photos || []).length > 1 && (
  <div style={{ display:"flex", justifyContent:"center", gap:8, padding:"10px", borderBottom:`1px solid ${C.gray100}`, flexWrap:"wrap" }}>
    {s.photos.map((p, i) => (
      <button key={i} onClick={() => setPhotoIdx(i)} style={{ width:48, height:48, borderRadius:9, border:i===photoIdx?`2px solid ${C.green}`:`1px solid ${C.gray200}`, background:C.gray50, cursor:"pointer", overflow:"hidden", padding:0 }}>
        {isUrl(p) ? <img src={p} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:20 }}>{p}</span>}
      </button>
    ))}
  </div>
)}
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
                  <Avatar name={sl.name} size={36} src={sl.avatar_url} />
                  <div style={{ flex:1 }}><p style={{ margin:0,fontWeight:600,fontSize:13 }}>{sl.name}</p><p style={{ margin:0,fontSize:11,color:C.gray400 }}>★ {sl.rating||5.0}</p></div>
                  <span style={{ fontSize:12,color:C.gray400 }}>Ver perfil →</span>
                </div>}
                {s.description&&<p style={{ margin:"0 0 14px",fontSize:14,color:C.gray600,lineHeight:1.6,background:C.gray50,borderRadius:10,padding:"10px 14px" }}>{s.description}</p>}
                <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:16,paddingTop:12,borderTop:`1px solid ${C.gray100}` }}>
                  <span style={{ fontSize:26,fontWeight:800,color:C.green }}>R$ {Number(s.price).toLocaleString("pt-BR")}</span>
                  {s.price_old&&<><span style={{ fontSize:14,color:C.gray400,textDecoration:"line-through" }}>R$ {Number(s.price_old).toLocaleString("pt-BR")}</span><span style={{ background:C.redLight,color:C.red,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6 }}>-{Math.round((1-s.price/s.price_old)*100)}%</span></>}
                  <span style={{ fontSize:12,color:C.gray400,marginLeft:"auto" }}>+ frete</span>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>toggleWishlist(s.id)} style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:wishlist.includes(s.id)?C.redLight:C.white,color:wishlist.includes(s.id)?C.red:C.gray900,cursor:"pointer",fontSize:14,fontWeight:500 }}>{wishlist.includes(s.id)?"♥ Favoritado":"♡ Favoritar"}</button>
                  <button onClick={()=>handleShare(s)} title="Compartilhar" style={{ padding:"11px 14px",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,color:C.gray600,cursor:"pointer",fontSize:16,flexShrink:0 }}>📤</button>
                  <button onClick={()=>requireAuth(()=>sl&&setContactModal(sl))} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:700 }}>💬 Entrar em contato</button>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedShirt&&(()=>{
          const fromSeller = available.filter(s=>s.seller_id===selectedShirt.seller_id&&s.id!==selectedShirt.id).slice(0,4);
          const sameTeam   = available.filter(s=>s.seller_id!==selectedShirt.seller_id&&s.id!==selectedShirt.id&&s.team===selectedShirt.team).slice(0,4);
          const sameRegion = available.filter(s=>s.seller_id!==selectedShirt.seller_id&&s.id!==selectedShirt.id&&s.team!==selectedShirt.team&&(s.country===selectedShirt.country||s.region===selectedShirt.region));
          const similar    = [...sameTeam,...sameRegion].slice(0,4);
          return (
            <>
              {fromSeller.length>0&&(
                <div style={{ marginTop:28 }}>
                  <SectionHead icon="🏷️" sub="mesmo vendedor" title="Mais deste vendedor" />
                  <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(148px,1fr))":"repeat(auto-fill,minmax(210px,1fr))",gap:12 }}>
                    {fromSeller.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
                  </div>
                </div>
              )}
              {similar.length>0&&(
                <div style={{ marginTop:28 }}>
                  <SectionHead icon="🔍" sub="catálogo" title="Similares no catálogo" />
                  <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(148px,1fr))":"repeat(auto-fill,minmax(210px,1fr))",gap:12 }}>
                    {similar.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
                  </div>
                </div>
              )}

              {/* ── Q&A ── */}
              <div style={{ marginTop:28 }}>
                <SectionHead icon="❓" sub="dúvidas" title={`${shirtQuestions.length} pergunta${shirtQuestions.length!==1?"s":""}`} />

                {/* Formulário de pergunta */}
                {user && user.id !== selectedShirt.seller_id && (
                  <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:16,marginBottom:16 }}>
                    <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:14,color:C.gray900 }}>Fazer uma pergunta</p>
                    <textarea
                      value={questionText}
                      onChange={e=>setQuestionText(e.target.value)}
                      placeholder="Tem alguma dúvida sobre esta camiseta?"
                      rows={2}
                      maxLength={400}
                      style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }}
                    />
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8 }}>
                      <span style={{ fontSize:11,color:C.gray400 }}>{questionText.length}/400</span>
                      <button
                        onClick={()=>handleAskQuestion(selectedShirt.id, selectedShirt.seller_id)}
                        disabled={questionLoading||!questionText.trim()}
                        style={{ padding:"8px 18px",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:13,cursor:"pointer",opacity:(!questionText.trim()||questionLoading)?.6:1 }}
                      >{questionLoading?"Enviando...":"Perguntar"}</button>
                    </div>
                  </div>
                )}

                {!user&&(
                  <p style={{ fontSize:13,color:C.gray400,marginBottom:12 }}>
                    <span onClick={()=>{setShowAuth(true);setAuthStep("login");setAuthError("");}} style={{ color:C.green,cursor:"pointer",fontWeight:600 }}>Entre</span> para fazer uma pergunta.
                  </p>
                )}

                {/* Lista de perguntas */}
                {shirtQuestions.length===0
                  ?<p style={{ color:C.gray400,fontSize:14 }}>Nenhuma pergunta ainda. Seja o primeiro!</p>
                  :<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {shirtQuestions.map(q=>(
                      <div key={q.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:"hidden" }}>
                        {/* Pergunta */}
                        <div style={{ padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start" }}>
                          <Avatar name={q.asker?.name||"?"} size={32} src={q.asker?.avatar_url} />
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}>
                              <span style={{ fontWeight:600,fontSize:13,color:C.gray900 }}>{q.asker?.name||"Usuário"}</span>
                              <span style={{ fontSize:11,color:C.gray400 }}>{new Date(q.created_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <p style={{ margin:0,fontSize:14,color:C.gray600,lineHeight:1.5 }}>{q.question}</p>
                          </div>
                          {(profile?.role==="admin"||user?.id===q.asker_id||user?.id===selectedShirt.seller_id)&&(
                            <button onClick={()=>handleDeleteQuestion(q.id,selectedShirt.id)} title="Remover" style={{ background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:16,padding:"0 0 0 4px",flexShrink:0,lineHeight:1 }}>🗑️</button>
                          )}
                        </div>

                        {/* Resposta existente */}
                        {q.answer&&(
                          <div style={{ padding:"10px 14px",background:C.greenLight,borderTop:`1px solid ${C.gray200}`,display:"flex",gap:10,alignItems:"flex-start" }}>
                            <span style={{ fontSize:18,flexShrink:0 }}>💬</span>
                            <div>
                              <span style={{ fontWeight:600,fontSize:12,color:C.greenDark }}>Vendedor respondeu</span>
                              <p style={{ margin:"2px 0 0",fontSize:14,color:C.greenDark,lineHeight:1.5 }}>{q.answer}</p>
                            </div>
                          </div>
                        )}

                        {/* Formulário de resposta para o vendedor */}
                        {user?.id===selectedShirt.seller_id&&!q.answer&&(
                          <div style={{ padding:"10px 14px",background:C.gray50,borderTop:`1px solid ${C.gray200}` }}>
                            <textarea
                              value={answerTexts[q.id]||""}
                              onChange={e=>setAnswerTexts(t=>({...t,[q.id]:e.target.value}))}
                              placeholder="Escreva sua resposta..."
                              rows={2}
                              maxLength={600}
                              style={{ width:"100%",padding:"8px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:13,boxSizing:"border-box",resize:"none" }}
                            />
                            <button
                              onClick={()=>handleAnswerQuestion(q.id,selectedShirt.id)}
                              disabled={answerLoading===q.id||!(answerTexts[q.id]||"").trim()}
                              style={{ marginTop:6,padding:"7px 16px",border:"none",borderRadius:8,background:C.green,color:C.white,fontWeight:600,fontSize:12,cursor:"pointer",opacity:answerLoading===q.id?.7:1 }}
                            >{answerLoading===q.id?"Respondendo...":"Responder"}</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                }
              </div>
            </>
          );
        })()}

        <Footer onNavigate={navigate} />
        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
            <img src={lightbox} alt="" style={{ maxWidth:"95vw", maxHeight:"95vh", objectFit:"contain", borderRadius:12 }} />
            <button onClick={() => setLightbox(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:"50%", width:36, height:36, fontSize:20, cursor:"pointer" }}>×</button>
          </div>
        )}
        {contactModal&&<ContactModal seller={contactModal} onClose={()=>setContactModal(null)} />}
        {authModal}
        {toastEl}
      </div>
    );
  }
  // ── HOME ──
  if(page==="home") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
      <NavBar />
      <TrustBar />
      <BannerCarousel onCta={deepNavigate} banners={banners} />
      <CategoryTiles onNavigate={navigate} setFilters={setFilters} />

      {shirtsLoading&&<div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:30 }}>{[...Array(4)].map((_,i)=><SkeletonCard key={i} />)}</div>}

      {!shirtsLoading&&available.filter(isBoosted).length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="⚡" sub="anúncios impulsionados" title="Em Destaque" />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {available.filter(isBoosted).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}

      {!shirtsLoading&&promos.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="🏷️" sub="seleção especial" title="Melhores Ofertas da Semana" action="Ver todas" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {promos.slice(0,4).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}

      {!shirtsLoading&&topRated.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="⭐" sub="avaliados pela comunidade" title="Os Favoritos" action="Ver catálogo" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {topRated.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}

      {!shirtsLoading&&recent.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="🆕" sub="acabaram de chegar" title="Chegaram Agora" action="Ver todas" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {recent.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}

      {!shirtsLoading&&available.length===0&&(
        <EmptyState
          emoji="⚽"
          title="Seja o primeiro a anunciar!"
          sub="O mercado ainda está vazio. Cadastre sua camiseta e encontre compradores."
          action="+ Anunciar camiseta"
          onAction={()=>requireAuth(()=>navigate("addProduct"))}
        />
      )}
      <Footer onNavigate={navigate} />
      {authModal}
      {toastEl}
    </div>
  );

  // ── CATALOG ──
  if(page==="catalog") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
      <NavBar />
      <TrustBar />
      {isMobile ? (
        <>
          <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"6px 12px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer" }}>
              {[["relevancia","Relevância"],["preco_asc","Menor preço"],["preco_desc","Maior preço"],["avaliacao","Melhor avaliação"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {shirtsLoading
            ? <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>{[...Array(6)].map((_,i)=><SkeletonCard key={i} />)}</div>
            : <><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>{filtered.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>{filtered.length===0&&<EmptyState emoji="🔍" title="Nenhuma camiseta encontrada" sub="Tente outros filtros ou limpe a busca para ver todos os itens." action="Limpar filtros" onAction={()=>{ setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null}); setSearch(""); }} />}</>
          }
        </>
      ) : (
        <div style={{ display:"flex",gap:24,alignItems:"flex-start" }}>
          <div style={{ width:280,flexShrink:0,position:"sticky",top:16,alignSelf:"flex-start" }}>
            <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"6px 12px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer" }}>
                {[["relevancia","Relevância"],["preco_asc","Menor preço"],["preco_desc","Maior preço"],["avaliacao","Melhor avaliação"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {shirtsLoading
              ? <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14 }}>{[...Array(6)].map((_,i)=><SkeletonCard key={i} />)}</div>
              : <><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14 }}>{filtered.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>{filtered.length===0&&<EmptyState emoji="🔍" title="Nenhuma camiseta encontrada" sub="Tente outros filtros ou limpe a busca para ver todos os itens." action="Limpar filtros" onAction={()=>{ setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null}); setSearch(""); }} />}</>
            }
          </div>
        </div>
      )}
      <Footer onNavigate={navigate} />
      {authModal}
      {toastEl}
    </div>
  );

  // ── SELLERS ──
  if(page==="sellers") {
    const activeSellers = sellers.filter(sv=>!sv.blocked&&shirts.some(sh=>sh.seller_id===sv.id));
    const filteredSellers = activeSellers.filter(sv=>{
      if(!sellerSearch.trim()) return true;
      const q = sellerSearch.toLowerCase();
      return (sv.name||"").toLowerCase().includes(q)||(sv.location||"").toLowerCase().includes(q);
    });
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <TrustBar />
        <SectionHead icon="👥" sub="comunidade" title="Vendedores" />
        {/* Campo de busca de vendedores */}
        <div style={{ position:"relative",marginBottom:16 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:16 }}>🔍</span>
          <input
            value={sellerSearch}
            onChange={e=>setSellerSearch(e.target.value)}
            placeholder="Buscar vendedor por nome ou cidade..."
            style={{ width:"100%",padding:"10px 38px 10px 40px",border:`1px solid ${C.gray200}`,borderRadius:12,fontSize:14,boxSizing:"border-box",outline:"none" }}
          />
          {sellerSearch&&(
            <button onClick={()=>setSellerSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:18,lineHeight:1,padding:0 }}>×</button>
          )}
        </div>
        {sellersLoading ? <Spinner /> : activeSellers.length===0 ? (
          <EmptyState
            emoji="👥"
            title="Nenhum vendedor ainda"
            sub="Seja o primeiro a publicar um anúncio e apareça aqui!"
            action="+ Anunciar camiseta"
            onAction={()=>requireAuth(()=>setPage("addProduct"))}
          />
        ) : filteredSellers.length===0 ? (
          <EmptyState
            emoji="🔍"
            title="Nenhum vendedor encontrado"
            sub={`Não encontramos ninguém com "${sellerSearch}". Tente outro nome ou cidade.`}
            action="Limpar busca"
            onAction={()=>setSellerSearch("")}
          />
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {filteredSellers.map(sv=>{
              const count = shirts.filter(sh=>sh.seller_id===sv.id).length;
              const avgRating = sv.rating ? Number(sv.rating).toFixed(1) : null;
              return (
                <div key={sv.id} onClick={()=>openSeller(sv.id)} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14 }}>
                  <Avatar name={sv.name} size={50} src={sv.avatar_url} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.gray900 }}>{sv.name}</p>
                    {sv.location&&<p style={{ margin:"0 0 5px",fontSize:12,color:C.gray400 }}>📍 {sv.location}</p>}
                    <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                      <span style={{ fontSize:12,color:C.gray600 }}>🏷️ {count} anúncio{count!==1?"s":""}</span>
                      {avgRating&&<span style={{ fontSize:12,color:C.amber }}>★ {avgRating}</span>}
                      {(sv.badges||[]).slice(0,2).map(b=><span key={b} style={{ fontSize:11,color:C.gray400 }}>{badgeIcon[b]||"🏅"} {b}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize:14,color:C.gray400 }}>→</span>
                </div>
              );
            })}
          </div>
        )}
        <Footer onNavigate={navigate} />
        {authModal}
        {toastEl}
      </div>
    );
  }

  // ── WISHLIST ──
  if(page==="wishlist") return (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
      <NavBar />
      <SectionHead icon="♥" sub="minha lista" title="Lista de desejos" />
      {wishlist.length===0
        ?<EmptyState
            emoji="♡"
            title="Sua lista está vazia"
            sub="Salve as camisetas que você curtir clicando no coração e encontre-as aqui depois."
            action="Explorar catálogo →"
            onAction={()=>setPage("catalog")}
          />
        :<div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>{shirts.filter(s=>wishlist.includes(s.id)).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>
      }
      <Footer onNavigate={navigate} />
      {authModal}
      {toastEl}
    </div>
  );

  // ── MY PROFILE ──
  if(page==="myProfile") {
    const myShirts = shirts.filter(s=>s.seller_id===user?.id);
    const emailVerified = !!user?.email_confirmed_at;
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <h2 style={{ margin:"0 0 1rem",fontWeight:700,fontSize:18 }}>Meu Perfil</h2>

        {/* Banner de verificação de email */}
        {!emailVerified&&(
          <div style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,marginBottom:16 }}>
            <span style={{ fontSize:20,flexShrink:0 }}>📧</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:14,color:"#92400e" }}>Verifique seu email</p>
              <p style={{ margin:0,fontSize:13,color:"#b45309" }}>Confirme o email <b>{user.email}</b> para poder anunciar camisetas.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${C.gray200}`,paddingBottom:8 }}>
          {[["dados","👤 Dados"],["anuncios",`🏷️ Anúncios (${myShirts.length})`]].map(([v,l])=>(
            <button key={v} onClick={()=>setMyProfileTab(v)} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:myProfileTab===v?C.greenLight:"none",color:myProfileTab===v?C.green:C.gray600,fontWeight:myProfileTab===v?600:400,cursor:"pointer",fontSize:13 }}>{l}</button>
          ))}
        </div>

        {myProfileTab==="dados"&&<>
          {/* Avatar + email */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:24 }}>
            <label style={{ position:"relative",cursor:"pointer",display:"inline-block" }}>
              <Avatar name={profileForm.name||profile?.name||"?"} size={72} src={profile?.avatar_url} />
              <span style={{ position:"absolute",bottom:2,right:2,width:22,height:22,background:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.white,border:`2px solid ${C.white}`,pointerEvents:"none" }}>📷</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:"none" }} />
            </label>
            <p style={{ margin:0,fontSize:12,color:C.gray400 }}>{user.email}</p>
            <p style={{ margin:0,fontSize:11,color:C.gray400 }}>Toque na foto para alterar</p>
          </div>

          {/* Formulário */}
          <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,padding:"1.5rem",display:"flex",flexDirection:"column",gap:14 }}>
            {[["Nome completo","name","text"],["WhatsApp / Telefone","phone","tel"]].map(([l,k,t])=>(
              <div key={k}>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
                <input type={t} value={profileForm[k]} onChange={e=>setProfileForm(f=>({...f,[k]:k==="phone"?maskPhone(e.target.value):e.target.value}))} placeholder={k==="phone"?"(11) 99999-9999":""} maxLength={k==="phone"?15:undefined} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              </div>
            ))}
            <CityStatePicker stateVal={profileForm.state} cityVal={profileForm.city} onStateChange={v=>setProfileForm(f=>({...f,state:v}))} onCityChange={v=>setProfileForm(f=>({...f,city:v}))} />
            <div>
              <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Bio / Sobre você</label>
              <textarea value={profileForm.bio} onChange={e=>setProfileForm(f=>({...f,bio:e.target.value}))} rows={3} placeholder="Conte um pouco sobre você como colecionador..." style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} />
            </div>

            {profileSaved&&<p style={{ margin:0,padding:"8px 12px",background:C.greenLight,color:C.greenDark,borderRadius:8,fontSize:13 }}>✅ Perfil atualizado com sucesso!</p>}

            <div style={{ display:"flex",gap:10 }}>
              <button onClick={handleSaveProfile} disabled={profileSaving} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600,opacity:profileSaving?.7:1 }}>
                {profileSaving?"Salvando...":"Salvar alterações"}
              </button>
              <button onClick={()=>openSeller(user.id)} style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:13,color:C.gray600 }}>
                Ver público
              </button>
            </div>
          </div>

          {/* Sair da conta */}
          <button onClick={handleLogout} style={{ width:"100%",marginTop:12,padding:"11px 0",border:`1px solid ${C.red}`,borderRadius:12,background:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,color:C.red }}>
            Sair da conta
          </button>
        </>}

        {myProfileTab==="anuncios"&&<>
          <button
            onClick={()=>{ setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); setPage("addProduct"); }}
            style={{ width:"100%",padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600,marginBottom:16 }}
          >
            + Novo anúncio
          </button>
          {myShirts.length===0 ? (
            <EmptyState
              emoji="🏷️"
              title="Você ainda não tem anúncios"
              sub="Publique sua primeira camiseta e comece a vender!"
              action="+ Criar primeiro anúncio"
              onAction={()=>{ setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); setPage("addProduct"); }}
            />
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {myShirts.map(sh=>(
                <div key={sh.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:56,height:56,borderRadius:10,overflow:"hidden",background:C.gray50,flexShrink:0 }}>
                    <ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={56} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sh.team}</p>
                    <p style={{ margin:"0 0 5px",fontSize:12,color:C.gray400 }}>{sh.edition?`${sh.edition} · `:""}{sh.year}</p>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontWeight:700,color:C.green,fontSize:14 }}>R$ {Number(sh.price).toLocaleString("pt-BR")}</span>
                      <Tag rarity={sh.rarity} />
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                    <button onClick={()=>startEditShirt(sh)} style={{ padding:"6px 12px",background:C.white,border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.gray600 }}>✏️ Editar</button>
                    <button onClick={()=>handleToggleShirtStatus(sh.id, sh.status)} style={{ padding:"6px 10px",background:sh.status==="vendido"?C.greenLight:C.amberLight,border:`1px solid ${sh.status==="vendido"?C.green:C.amber}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:sh.status==="vendido"?C.greenDark:C.amber }}>
                      {sh.status==="vendido"?"↩ Reativar":"✓ Vendido"}
                    </button>
                    {isBoosted(sh)
                      ? <span style={{ padding:"6px 10px",background:"linear-gradient(90deg,#fef3c7,#fde68a)",border:`1px solid ${C.amber}`,borderRadius:8,fontSize:11,fontWeight:600,color:"#92400e",textAlign:"center" }}>⚡ Ativo até {new Date(sh.boosted_until).toLocaleDateString("pt-BR")}</span>
                      : sh.boost_requested_at
                        ? <span style={{ padding:"6px 10px",background:C.blueLight,border:`1px solid ${C.blue}`,borderRadius:8,fontSize:11,fontWeight:500,color:C.blue,textAlign:"center" }}>⏳ Aguardando</span>
                        : <button onClick={()=>setBoostModal(sh)} style={{ padding:"6px 10px",background:"linear-gradient(90deg,#f59e0b,#f97316)",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,color:C.white }}>⚡ Impulsionar</button>
                    }
                    <button onClick={()=>handleDeleteShirt(sh.id)} style={{ padding:"6px 10px",background:C.redLight,border:`1px solid ${C.red}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.red }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {boostModalEl}
        {authModal}
        {toastEl}
      </div>
    );
  }

  // ── ADMIN ──
  if(page==="admin"&&profile?.role==="admin") {
    const allShirts = shirts; // sem filtro de bloqueio para o admin ver tudo
    return (
      <div style={{ fontFamily:"system-ui,sans-serif",maxWidth:1200,margin:"0 auto",padding:"0 0 4rem" }}>
        <NavBar />
        <SectionHead icon="⚙️" sub="administração" title="Painel de Controle" />

        {/* Tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${C.gray200}`,paddingBottom:8,flexWrap:"wrap" }}>
          {[["users","👥 Usuários"],["shirts","🏷️ Anúncios"],["boosts","⚡ Boosts"],["banners","🖼️ Banners"],["questions","❓ Perguntas"],["emails","📧 E-mails"]].map(([v,l])=>(
            <button key={v} onClick={()=>{ setAdminTab(v); if(v==="questions") loadAdminQuestions(); if(v==="emails") loadAdminNotifs(); }} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:adminTab===v?C.greenLight:"none",color:adminTab===v?C.green:C.gray600,fontWeight:adminTab===v?600:400,cursor:"pointer",fontSize:13 }}>{l}</button>
          ))}
        </div>

        {/* Tab: Usuários */}
        {adminTab==="users"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {sellers.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Carregando usuários...</p>}
            {sellers.map(sv=>{
              const count = allShirts.filter(sh=>sh.seller_id===sv.id).length;
              const isMe = sv.id===user.id;
              return (
                <div key={sv.id} style={{ background:sv.blocked?C.redLight:C.white,border:`1px solid ${sv.blocked?C.red:C.gray200}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12 }}>
                  <Avatar name={sv.name} size={42} src={sv.avatar_url} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <p style={{ margin:0,fontWeight:600,fontSize:14,color:C.gray900 }}>{sv.name||"—"}</p>
                      {sv.role==="admin"&&<span style={{ fontSize:10,background:"#fef3c7",color:C.amber,borderRadius:4,padding:"1px 6px",fontWeight:600 }}>ADMIN</span>}
                      {sv.blocked&&<span style={{ fontSize:10,background:C.redLight,color:C.red,borderRadius:4,padding:"1px 6px",fontWeight:600 }}>BLOQUEADO</span>}
                    </div>
                    <p style={{ margin:"2px 0 0",fontSize:12,color:C.gray400 }}>{count} anúncio{count!==1?"s":""}{sv.location?` · ${sv.location}`:""}</p>
                  </div>
                  {!isMe&&(
                    <button onClick={()=>handleToggleBlock(sv)} style={{ flexShrink:0,padding:"6px 13px",borderRadius:8,border:`1px solid ${sv.blocked?C.green:C.red}`,background:"none",color:sv.blocked?C.green:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>
                      {sv.blocked?"✅ Desbloquear":"🚫 Bloquear"}
                    </button>
                  )}
                  {isMe&&<span style={{ fontSize:11,color:C.gray400,flexShrink:0 }}>você</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Anúncios */}
        {adminTab==="shirts"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {allShirts.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Nenhum anúncio cadastrado.</p>}
            {allShirts.map(sh=>{
              const sellerBlocked = sellers.find(sv=>sv.id===sh.seller_id)?.blocked;
              return (
                <div key={sh.id} style={{ background:sellerBlocked?C.redLight:C.white,border:`1px solid ${sellerBlocked?C.red:C.gray200}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:48,height:48,borderRadius:8,overflow:"hidden",background:C.gray50,flexShrink:0 }}>
                    <ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={48} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:14,color:C.gray900 }}>{sh.team}</p>
                    <p style={{ margin:0,fontSize:12,color:C.gray400 }}>{sh.edition} · {sh.year} · R$ {Number(sh.price).toLocaleString("pt-BR")}</p>
                    <p style={{ margin:"2px 0 0",fontSize:11,color:sellerBlocked?C.red:C.gray400 }}>
                      {sh.profiles?.name||"—"}{sellerBlocked?" · vendedor bloqueado":""}
                    </p>
                  </div>
                  <button onClick={()=>handleDeleteShirt(sh.id)} style={{ flexShrink:0,padding:"6px 10px",borderRadius:8,border:`1px solid ${C.red}`,background:C.redLight,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>🗑️ Excluir</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Banners */}
        {adminTab==="banners"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {banners.map(b=>{
              const edit = adminBannerEdit[b.id]||{};
              const setField = (k,v) => { setAdminBannerEdit(prev=>({...prev,[b.id]:{...prev[b.id],[k]:v}})); setBannerErrors(prev=>({...prev,[b.id]:null})); };
              const bErr = bannerErrors[b.id]||null;
              const hasFieldErr = (col) => bErr && (bErr.badCol===col || bErr.missingCols?.includes(col));
              const currentTheme = BANNER_THEMES.find(t=>t.grad===edit.grad);
              return (
                <div key={b.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden" }}>
                  {/* Preview — replica exata do banner ao vivo */}
                  {(()=>{
                    const rawPrev = edit.img!==undefined ? edit.img : (b.img||"");
                    const pd = parseImg(rawPrev);
                    const pHasPhoto = !!pd.url;
                    return (
                      <div style={{ position:"relative",background:edit.grad||b.grad,minHeight:pHasPhoto?260:180,overflow:"hidden" }}>
                        {pHasPhoto&&<div style={{ position:"absolute",inset:0,backgroundImage:`url(${pd.url})`,backgroundSize:pd.size,backgroundPosition:pd.position }} />}
                        {pHasPhoto&&<div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,.82) 0%,rgba(0,0,0,.7) 35%,rgba(0,0,0,.35) 65%,rgba(0,0,0,.08) 100%)" }} />}
                        <div style={{ padding:"2rem 2rem 1.75rem",position:"relative",zIndex:1 }}>
                          <span style={{ display:"inline-flex",padding:"3px 10px",borderRadius:99,background:"rgba(255,255,255,.18)",color:"#fff",fontSize:11,fontWeight:600,letterSpacing:1.5,marginBottom:10 }}>{edit.label||b.label}</span>
                          <h2 style={{ margin:"0 0 6px",fontSize:24,fontWeight:800,color:"#fff" }}>{edit.title||b.title}</h2>
                          <p style={{ margin:"0 0 18px",fontSize:13,color:"rgba(255,255,255,.8)",maxWidth:300,lineHeight:1.6 }}>{edit.sub||b.sub}</p>
                          <div style={{ display:"inline-flex",padding:"9px 18px",borderRadius:10,background:edit.accent||b.accent,color:"#14532d",fontWeight:700,fontSize:13 }}>{edit.cta||b.cta} →</div>
                        </div>
                        {!pHasPhoto&&<div style={{ position:"absolute",right:24,top:"50%",transform:"translateY(-50%)",fontSize:72,opacity:.2 }}>{edit.img||b.img}</div>}
                        <div style={{ position:"absolute",top:8,right:10,fontSize:9,letterSpacing:.8,fontWeight:600,color:"rgba(255,255,255,.4)",background:"rgba(0,0,0,.35)",padding:"2px 7px",borderRadius:4 }}>PRÉVIA</div>
                      </div>
                    );
                  })()}
                  {/* Campos */}
                  <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                      {[["Label (badge)","label"],["Título","title"],["Botão (CTA)","cta"]].map(([l,k])=>(
                        <div key={k}>
                          <label style={{ fontSize:11,color:C.gray400,display:"block",marginBottom:3 }}>{l}</label>
                          <input value={edit[k]||""} onChange={e=>setField(k,e.target.value)} style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:13,boxSizing:"border-box" }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize:11,color:C.gray400,display:"block",marginBottom:3 }}>Subtítulo</label>
                      <input value={edit.sub||""} onChange={e=>setField("sub",e.target.value)} style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:13,boxSizing:"border-box" }} />
                    </div>
                    {/* Imagem / Emoji */}
                    {(()=>{
                      const rawImg = edit.img!==undefined ? edit.img : (b.img||"");
                      const cur = parseImg(rawImg);
                      const displayVal = cur.url || (!isUrl(rawImg) ? rawImg : "");
                      const hasUrl = !!cur.url;
                      const [px, py] = parsePosition(cur.position);
                      const handleFocal = (e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0,Math.min(100,Math.round(((e.clientX-r.left)/r.width)*100)));
                        const y = Math.max(0,Math.min(100,Math.round(((e.clientY-r.top)/r.height)*100)));
                        setField("img", buildImgField(cur.url, `${x}% ${y}%`, cur.size));
                      };
                      return (
                        <div>
                          <label style={{ fontSize:11,color:C.gray400,display:"block",marginBottom:3 }}>Imagem (URL) ou Emoji</label>
                          <input
                            value={displayVal}
                            onChange={e=>{
                              const v = e.target.value;
                              if(isUrl(v)) setField("img", buildImgField(v, cur.position, cur.size));
                              else setField("img", v);
                            }}
                            placeholder="https://... ou emoji 🏆"
                            style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:13,boxSizing:"border-box" }}
                          />
                          {/* Dica de dimensões — sempre visível */}
                          <div style={{ marginTop:6,padding:"9px 11px",background:"#f0fdf4",borderRadius:8,border:"1px solid #d1fae5" }}>
                            <p style={{ margin:"0 0 3px",fontSize:11,fontWeight:700,color:"#166534" }}>Tamanho ideal da foto</p>
                            <p style={{ margin:0,fontSize:11,color:"#166534",lineHeight:1.7 }}>
                              <strong>900×400 px</strong> (proporção ~9:4, horizontal/paisagem).<br/>
                              Fotos <strong>verticais</strong> ficam muito cortadas no modo Cobrir.<br/>
                              Mínimo recomendado: <strong>800 px de largura</strong>.
                            </p>
                          </div>
                          {hasUrl&&(
                            <div style={{ marginTop:10,display:"flex",flexDirection:"column",gap:10,padding:"12px",background:"#f9fafb",borderRadius:10,border:`1px solid ${C.gray200}` }}>
                              {/* Modo de exibição */}
                              <div>
                                <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray700 }}>Modo de exibição</p>
                                <div style={{ display:"flex",gap:8 }}>
                                  <button onClick={()=>setField("img",buildImgField(cur.url,cur.position,"cover"))}
                                    style={{ flex:1,padding:"7px 10px",borderRadius:8,border:`2px solid ${cur.size==="cover"?"#14532d":C.gray200}`,background:cur.size==="cover"?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",lineHeight:1.5 }}>
                                    <span style={{ display:"block",fontWeight:700 }}>Cobrir {cur.size==="cover"&&"✓"}</span>
                                    <span style={{ fontWeight:400,color:C.gray500 }}>Preenche o banner; pode cortar bordas.</span>
                                  </button>
                                  <button onClick={()=>setField("img",buildImgField(cur.url,cur.position,"contain"))}
                                    style={{ flex:1,padding:"7px 10px",borderRadius:8,border:`2px solid ${cur.size==="contain"?"#14532d":C.gray200}`,background:cur.size==="contain"?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",lineHeight:1.5 }}>
                                    <span style={{ display:"block",fontWeight:700 }}>Conter {cur.size==="contain"&&"✓"}</span>
                                    <span style={{ fontWeight:400,color:C.gray500 }}>Foto inteira; pode sobrar espaço.</span>
                                  </button>
                                </div>
                              </div>
                              {/* Crop / Ponto de foco */}
                              <div>
                                <p style={{ margin:"0 0 2px",fontSize:11,fontWeight:700,color:C.gray700 }}>Ponto de foco</p>
                                <p style={{ margin:"0 0 6px",fontSize:11,color:C.gray400 }}>Clique ou arraste na foto para definir qual área fica centralizada no banner.</p>
                                <div
                                  style={{ position:"relative",cursor:"crosshair",borderRadius:8,border:"2px solid #14532d",overflow:"hidden",aspectRatio:"3/1",background:"#000",userSelect:"none" }}
                                  onClick={handleFocal}
                                  onMouseDown={e=>e.preventDefault()}
                                  onMouseMove={e=>{ if(e.buttons===1) handleFocal(e); }}
                                >
                                  <img src={cur.url} draggable={false}
                                    style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:`${px}% ${py}%`,display:"block",pointerEvents:"none" }}
                                    alt=""
                                  />
                                  {/* Linhas-guia */}
                                  <div style={{ position:"absolute",left:`${px}%`,top:0,bottom:0,width:1,background:"rgba(255,255,255,.3)",pointerEvents:"none" }} />
                                  <div style={{ position:"absolute",top:`${py}%`,left:0,right:0,height:1,background:"rgba(255,255,255,.3)",pointerEvents:"none" }} />
                                  {/* Mira */}
                                  <div style={{ position:"absolute",left:`${px}%`,top:`${py}%`,transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:3 }}>
                                    <div style={{ width:20,height:20,borderRadius:"50%",border:"3px solid #fff",boxShadow:"0 0 0 2px #14532d,0 2px 8px rgba(0,0,0,.6)",background:"rgba(255,255,255,.15)" }} />
                                  </div>
                                </div>
                                <p style={{ margin:"4px 0 0",fontSize:10,color:C.gray400,textAlign:"right" }}>Foco: {px}% × {py}%</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div>
                      <label style={{ fontSize:11,color:C.gray400,display:"block",marginBottom:6 }}>Tema de cor</label>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                        {BANNER_THEMES.map(t=>(
                          <button key={t.id} onClick={()=>{ setField("grad",t.grad); setField("accent",t.accent); }} style={{ padding:"5px 11px",borderRadius:8,border:`2px solid ${currentTheme?.id===t.id?"#111":"transparent"}`,background:t.grad,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:currentTheme?.id===t.id?"0 0 0 2px #111 inset":"none" }}>{t.label}</button>
                        ))}
                      </div>
                    </div>
                    {/* Destino do botão CTA */}
                    {(()=>{
                      const curLink = edit.link!==undefined ? edit.link : (b.link||"catalog");
                      const { page: dlPage, params: dlParams } = parseDeepLink(curLink);
                      const setDest = (pg, prm={}) => setField("link", buildDeepLink(pg, prm));
                      const updParam = (key, val) => {
                        const np = {...dlParams};
                        if (val) np[key]=val; else delete np[key];
                        setDest(dlPage, np);
                      };
                      const DEST_BTNS = [["catalog","🗂 Catálogo"],["sellers","👥 Vendedores"],["home","🏠 Home"],["addProduct","➕ Anunciar"]];
                      const isCatalog = dlPage==="catalog";
                      const btnActive = (val) => dlPage===val && !isUrl(curLink);
                      return (
                        <div style={{ padding: hasFieldErr("link")?"10px":0, borderRadius: hasFieldErr("link")?9:0, border: hasFieldErr("link")?"2px solid #ef4444":"none", background: hasFieldErr("link")?"#fef2f2":"transparent" }}>
                          <label style={{ fontSize:11,color:hasFieldErr("link")?"#b91c1c":C.gray400,display:"block",marginBottom:6 }}>Destino do botão "{edit.cta||b.cta}"{hasFieldErr("link")&&<span style={{ marginLeft:6,fontSize:10,fontWeight:700,color:"#ef4444" }}>⚠ coluna não existe no banco</span>}</label>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
                            {DEST_BTNS.map(([val,label])=>(
                              <button key={val} onClick={()=>setDest(val)}
                                style={{ padding:"5px 11px",borderRadius:8,border:`2px solid ${btnActive(val)?"#14532d":C.gray200}`,background:btnActive(val)?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                                {label}
                              </button>
                            ))}
                          </div>
                          {/* Filtros do catálogo */}
                          {isCatalog&&(
                            <div style={{ background:"#f0fdf4",borderRadius:10,border:"1px solid #d1fae5",padding:"10px 12px",display:"flex",flexDirection:"column",gap:9 }}>
                              <p style={{ margin:0,fontSize:11,fontWeight:700,color:"#166534" }}>Filtros do catálogo (opcional)</p>
                              <div>
                                <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Busca — time, edição, país, ano</label>
                                <input value={dlParams.search||""} onChange={e=>updParam("search",e.target.value)}
                                  placeholder="Ex: Palmeiras, Barcelona, Brasil 2025..."
                                  style={{ width:"100%",padding:"6px 10px",border:"1px solid #d1fae5",borderRadius:7,fontSize:12,boxSizing:"border-box",background:"#fff" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Categoria</label>
                                <div style={{ display:"flex",gap:5 }}>
                                  {[["","Todos"],["times","Times"],["selecoes","Seleções"]].map(([v,l])=>(
                                    <button key={v} onClick={()=>{ updParam("type",v); if(!v) updParam("region",""); }}
                                      style={{ padding:"4px 10px",borderRadius:7,border:`1.5px solid ${(dlParams.type||"")===v?"#14532d":"#d1fae5"}`,background:(dlParams.type||"")===v?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>{l}</button>
                                  ))}
                                </div>
                              </div>
                              {dlParams.type&&(
                                <div>
                                  <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Região</label>
                                  <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                                    {[{id:"",label:"Todas"},...(REGIONS[dlParams.type]||[])].map(r=>(
                                      <button key={r.id} onClick={()=>updParam("region",r.id)}
                                        style={{ padding:"4px 10px",borderRadius:7,border:`1.5px solid ${(dlParams.region||"")===r.id?"#14532d":"#d1fae5"}`,background:(dlParams.region||"")===r.id?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>{r.label||"Todas"}</button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div>
                                <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Condição</label>
                                <div style={{ display:"flex",gap:5 }}>
                                  {[["","Todas"],["Nova","Nova"],["Usada","Usada"]].map(([v,l])=>(
                                    <button key={v} onClick={()=>updParam("condition",v)}
                                      style={{ padding:"4px 10px",borderRadius:7,border:`1.5px solid ${(dlParams.condition||"")===v?"#14532d":"#d1fae5"}`,background:(dlParams.condition||"")===v?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>{l}</button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Tamanho</label>
                                <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                                  {[["","Todos"],...SIZES.map(s=>[s,s])].map(([v,l])=>(
                                    <button key={v} onClick={()=>updParam("size",v)}
                                      style={{ padding:"4px 10px",borderRadius:7,border:`1.5px solid ${(dlParams.size||"")===v?"#14532d":"#d1fae5"}`,background:(dlParams.size||"")===v?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>{l}</button>
                                  ))}
                                </div>
                              </div>
                              {curLink!=="catalog"&&(
                                <div style={{ padding:"5px 8px",background:"#fff",borderRadius:6,border:"1px solid #d1fae5" }}>
                                  <p style={{ margin:0,fontSize:10,color:"#166534",fontFamily:"monospace" }}>{curLink}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Destino não-catálogo: input livre */}
                          {!isCatalog&&(
                            <div>
                              <input value={curLink} onChange={e=>setField("link",e.target.value)}
                                placeholder="sellers · home · item-{uuid} · https://..."
                                style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:12,boxSizing:"border-box" }}
                              />
                              <p style={{ margin:"3px 0 0",fontSize:10,color:C.gray400 }}>Produto específico: <strong>item-{"{uuid}"}</strong> — copie o ID na página do produto (admin)</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {/* Visibilidade na home */}
                    {(()=>{
                      const isVisible = edit.visible!==undefined ? edit.visible : b.visible!==false;
                      const vErr = hasFieldErr("visible");
                      return (
                        <div style={{ outline: vErr?"2px solid #ef4444":"none", outlineOffset:2, borderRadius:10 }}>
                          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 14px",background:vErr?"#fef2f2":isVisible?"#f0fdf4":"#fef2f2",borderRadius:10,border:`1px solid ${vErr?"#ef4444":isVisible?"#d1fae5":"#fecaca"}` }}>
                            <div>
                              <p style={{ margin:0,fontSize:12,fontWeight:700,color:vErr?"#ef4444":isVisible?"#166534":"#991b1b" }}>
                                {vErr?"⚠ Visibilidade":isVisible?"Visível na home":"Oculto na home"}
                              </p>
                              <p style={{ margin:0,fontSize:11,color:vErr?"#b91c1c":isVisible?"#4ade80":"#f87171",marginTop:1 }}>
                                {vErr?"Coluna \"visible\" não existe no banco — execute a migração SQL.":isVisible?"Este banner aparece para todos os visitantes.":"Este banner está desativado e não aparece na home."}
                              </p>
                            </div>
                            <button onClick={()=>setField("visible",!isVisible)}
                              style={{ width:46,height:26,borderRadius:99,border:"none",cursor:"pointer",background:isVisible?"#16a34a":"#d1d5db",position:"relative",transition:"background .25s",flexShrink:0,padding:0 }}>
                              <div style={{ position:"absolute",top:3,left:isVisible?23:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 1px 3px rgba(0,0,0,.3)" }} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Caixa de erro detalhada */}
                    {bErr&&(
                      <div style={{ padding:"12px 14px",background:"#fef2f2",borderRadius:10,border:"2px solid #ef4444" }}>
                        <p style={{ margin:"0 0 6px",fontSize:12,fontWeight:700,color:"#991b1b" }}>❌ Erro ao salvar o banner</p>
                        <p style={{ margin:"0 0 8px",fontSize:11,color:"#b91c1c",fontFamily:"monospace",lineHeight:1.6,wordBreak:"break-all",background:"#fff",padding:"6px 9px",borderRadius:6,border:"1px solid #fecaca" }}>{bErr.message}</p>
                        {bErr.needsMigration&&(
                          <>
                            <p style={{ margin:"0 0 4px",fontSize:11,fontWeight:600,color:"#991b1b" }}>Solução: execute este SQL no Supabase → SQL Editor:</p>
                            <pre style={{ margin:0,padding:"8px 10px",background:"#1e1e2e",color:"#a6e3a1",borderRadius:7,fontSize:11,overflowX:"auto",lineHeight:1.7 }}>{`ALTER TABLE banners ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;\nALTER TABLE banners ADD COLUMN IF NOT EXISTS link text DEFAULT 'catalog';`}</pre>
                          </>
                        )}
                      </div>
                    )}
                    <button onClick={()=>handleSaveBanner(b.id)} disabled={bannerSaving===b.id} style={{ padding:"9px 0",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:13,cursor:"pointer",opacity:bannerSaving===b.id?.7:1 }}>
                      {bannerSaving===b.id?"Salvando...":"💾 Salvar banner"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Boosts */}
        {adminTab==="boosts"&&(()=>{
          const pending = shirts.filter(s=>s.boost_requested_at&&!isBoosted(s));
          const active  = shirts.filter(s=>isBoosted(s));
          return (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div>
                <p style={{ margin:"0 0 10px",fontWeight:700,fontSize:14,color:C.gray900 }}>⏳ Solicitações pendentes ({pending.length})</p>
                {pending.length===0&&<p style={{ color:C.gray400,fontSize:13 }}>Nenhuma solicitação pendente.</p>}
                {pending.map(sh=>(
                  <div key={sh.id} style={{ background:C.amberLight,border:`1px solid ${C.amber}`,borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",background:C.gray50,flexShrink:0 }}><ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={44} /></div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:14 }}>{sh.team}{sh.edition?` · ${sh.edition}`:""}</p>
                      <p style={{ margin:0,fontSize:12,color:C.gray600 }}>Vendedor: {sh.profiles?.name||"—"} · Solicitado: {new Date(sh.boost_requested_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                      <button onClick={()=>handleActivateBoost(sh.id)} style={{ padding:"7px 13px",borderRadius:8,border:"none",background:"linear-gradient(90deg,#f59e0b,#f97316)",color:C.white,fontSize:12,fontWeight:700,cursor:"pointer" }}>✅ Ativar {BOOST_DAYS}d</button>
                      <button onClick={()=>handleDeactivateBoost(sh.id)} style={{ padding:"7px 10px",borderRadius:8,border:`1px solid ${C.red}`,background:C.redLight,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ margin:"0 0 10px",fontWeight:700,fontSize:14,color:C.gray900 }}>⚡ Destaques ativos ({active.length})</p>
                {active.length===0&&<p style={{ color:C.gray400,fontSize:13 }}>Nenhum destaque ativo no momento.</p>}
                {active.map(sh=>(
                  <div key={sh.id} style={{ background:C.greenLight,border:`1px solid ${C.green}`,borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",background:C.gray50,flexShrink:0 }}><ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={44} /></div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:14 }}>{sh.team}{sh.edition?` · ${sh.edition}`:""}</p>
                      <p style={{ margin:0,fontSize:12,color:C.greenDark }}>Expira: {new Date(sh.boosted_until).toLocaleDateString("pt-BR")} · {sh.profiles?.name||"—"}</p>
                    </div>
                    <button onClick={()=>handleDeactivateBoost(sh.id)} style={{ flexShrink:0,padding:"7px 12px",borderRadius:8,border:`1px solid ${C.red}`,background:C.redLight,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>Remover</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tab: E-mails */}
        {adminTab==="emails"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ padding:"10px 14px",background:C.amberLight,border:`1px solid ${C.amber}`,borderRadius:10,marginBottom:4 }}>
              <p style={{ margin:0,fontSize:13,color:"#92400e",fontWeight:500 }}>
                📧 Fila de notificações — os emails só serão enviados após configurar um provedor na Edge Function <code>send-email-notifications</code>.
              </p>
            </div>
            {adminNotifs.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Nenhuma notificação na fila.</p>}
            {adminNotifs.map(n=>(
              <div key={n.id} style={{ background:n.sent_at?C.greenLight:n.error_msg?C.redLight:C.white, border:`1px solid ${n.sent_at?C.green:n.error_msg?C.red:C.gray200}`,borderRadius:10,padding:"10px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                      <span style={{ fontSize:11,fontWeight:700,background:n.type==="new_question"?C.blueLight:C.purpleLight,color:n.type==="new_question"?C.blue:C.purple,borderRadius:6,padding:"2px 8px" }}>
                        {n.type==="new_question"?"Nova pergunta":"Pergunta respondida"}
                      </span>
                      <span style={{ fontSize:11,color:C.gray400 }}>{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p style={{ margin:"0 0 2px",fontSize:13,color:C.gray600 }}>Para: <b>{n.recipient_email||"—"}</b></p>
                    <p style={{ margin:0,fontSize:12,color:C.gray400 }}>{n.data?.shirt_team} · por {n.data?.asker_name||n.data?.seller_name}</p>
                    {n.error_msg&&<p style={{ margin:"4px 0 0",fontSize:11,color:C.red }}>Erro: {n.error_msg}</p>}
                  </div>
                  <span style={{ fontSize:18,flexShrink:0 }}>{n.sent_at?"✅":n.error_msg?"❌":"⏳"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Perguntas */}
        {adminTab==="questions"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {adminQuestions.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Nenhuma pergunta ainda.</p>}
            {adminQuestions.map(q=>(
              <div key={q.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"12px 16px" }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:13,color:C.gray900 }}>
                      {q.shirt?.team||"—"}{q.shirt?.edition?` · ${q.shirt.edition}`:""}
                    </p>
                    <p style={{ margin:"0 0 6px",fontSize:12,color:C.gray400 }}>
                      por <b>{q.asker?.name||"?"}</b> · {new Date(q.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p style={{ margin:"0 0 4px",fontSize:14,color:C.gray600 }}>❓ {q.question}</p>
                    {q.answer&&<p style={{ margin:0,fontSize:13,color:C.greenDark,background:C.greenLight,borderRadius:8,padding:"6px 10px" }}>💬 {q.answer}</p>}
                  </div>
                  <button
                    onClick={async()=>{ if(!window.confirm("Remover esta pergunta?")) return; await supabase.from("questions").delete().eq("id",q.id); loadAdminQuestions(); addToast("Pergunta removida.","info"); }}
                    style={{ flexShrink:0,padding:"6px 12px",borderRadius:8,border:`1px solid ${C.red}`,background:C.redLight,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}
                  >🗑️ Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {authModal}
        {toastEl}
      </div>
    );
  }

  return null;
}