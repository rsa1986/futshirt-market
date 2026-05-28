import { useState, useEffect, useRef } from "react";
import {
  C, rCol, rBg, SPORTS, TYPES, REGIONS, CONDITIONS, SIZES, SHIRT_MODELS, PRICES, BR_STATES,
  CATEGORY_TILES, BANNERS_DEFAULT, isBoosted, isUrl, parseImg,
} from "./constants";

/* ── SHIMMER ── */
;(function injectShimmer(){
  if(typeof document==="undefined"||document.getElementById("fsm-shimmer")) return;
  const s=document.createElement("style");
  s.id="fsm-shimmer";
  s.textContent="@keyframes fsm-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}";
  document.head.appendChild(s);
})();
export const shimmerBase = { background:"linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize:"1200px 100%", animation:"fsm-shimmer 1.3s infinite linear", borderRadius:6 };

/* ── MOBILE HOOK ── */
export function useMobile(bp=640) {
  const [m,setM] = useState(()=>window.innerWidth<bp);
  useEffect(()=>{
    const fn=()=>setM(window.innerWidth<bp);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return m;
}

export function maskPhone(value) {
  const d = value.replace(/\D/g,"").slice(0,11);
  if(d.length<=2) return d.length?`(${d}`:"";
  if(d.length<=7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

/* ── BASE COMPONENTS ── */
export function Avatar({ name, size=40, src=null }) {
  const colors = ["#dbeafe","#fce7f3","#dcfce7","#fef3c7","#f3e8ff","#fee2e2"];
  const fgs    = ["#1d4ed8","#be185d","#15803d","#b45309","#7c3aed","#991b1b"];
  const i = (name||"?").charCodeAt(0) % colors.length;
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  if(src) return <img src={src} alt={name||"avatar"} loading="lazy" style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e5e7eb" }} />;
  return <div style={{ width:size,height:size,borderRadius:"50%",background:colors[i],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:size*.28,color:fgs[i],flexShrink:0 }}>{initials}</div>;
}

export function Tag({ rarity }) {
  return <span style={{ display:"inline-flex",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,background:rBg[rarity],color:rCol[rarity] }}>{rarity}</span>;
}

export function ShirtPhoto({ value, size = 88 }) {
  if (isUrl(value)) {
    return (
      <img src={value} alt="camiseta" style={{ width:"100%",height:size,objectFit:"contain",display:"block",background:"#f9fafb" }} />
    );
  }
  return (
    <div style={{ height:size,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5 }}>
      {value || "⚽"}
    </div>
  );
}

export function Star({ v }) { return <span style={{ color:C.amber,fontSize:12 }}>{"★".repeat(Math.floor(v||0))}{"☆".repeat(5-Math.floor(v||0))}</span>; }

export function StarPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex",gap:2 }}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange(n)} style={{ fontSize:30,cursor:"pointer",color:n<=value?C.amber:"#d1d5db",lineHeight:1 }}>★</span>
      ))}
    </div>
  );
}

export function CityStatePicker({ stateVal, cityVal, onStateChange, onCityChange }) {
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

export function Pill({ active,onClick,children,disabled,soon }) {
  return <button onClick={disabled?undefined:onClick} style={{ padding:"6px 14px",borderRadius:99,border:`1.5px solid ${active?C.green:C.gray200}`,background:active?C.greenLight:C.white,color:active?C.greenDark:disabled?"#c4c4c4":C.gray600,fontSize:13,fontWeight:active?600:400,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:disabled?.6:1,display:"inline-flex",alignItems:"center",gap:5 }}>{children}{soon&&<span style={{ fontSize:10,background:C.gray100,color:C.gray400,borderRadius:4,padding:"1px 5px" }}>em breve</span>}</button>;
}

export function SectionHead({ icon,title,sub,action,onAction }) {
  return <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16 }}><div><p style={{ margin:"0 0 2px",fontSize:11,fontWeight:600,letterSpacing:1,color:C.green,textTransform:"uppercase" }}>{icon} {sub}</p><h3 style={{ margin:0,fontSize:19,fontWeight:700,color:C.gray900 }}>{title}</h3></div>{action&&<span onClick={onAction} style={{ fontSize:13,color:C.green,cursor:"pointer",fontWeight:500 }}>{action} →</span>}</div>;
}

export function Spinner() {
  return <div style={{ textAlign:"center",padding:"3rem",color:C.gray400 }}><div style={{ fontSize:32,marginBottom:8 }}>⏳</div><p>Carregando...</p></div>;
}

export function SkeletonCard() {
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

export function EmptyState({ emoji, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
      <div style={{ fontSize:52,marginBottom:14 }}>{emoji}</div>
      <h3 style={{ margin:"0 0 8px",fontWeight:700,fontSize:17,color:"#111827" }}>{title}</h3>
      {sub&&<p style={{ margin:"0 0 18px",fontSize:14,color:"#9ca3af",lineHeight:1.6,maxWidth:280,marginLeft:"auto",marginRight:"auto" }}>{sub}</p>}
      {action&&<button onClick={onAction} style={{ padding:"10px 26px",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>{action}</button>}
    </div>
  );
}

/* ── BANNER CAROUSEL ── */
export function BannerCarousel({ onCta, banners }) {
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
      {hasPhoto&&<div style={{ position:"absolute",inset:0,backgroundImage:`url(${imgData.url})`,backgroundSize:imgData.size,backgroundPosition:imgData.position }} />}
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
export function ShirtCard({ s, wishlist, toggleWishlist, onOpen }) {
  const disc      = s.price_old ? Math.round((1 - s.price / s.price_old) * 100) : 0;
  const photo     = (s.photos || [])[0] || "⚽";
  const isNew     = s.created_at && (Date.now() - new Date(s.created_at).getTime()) < 48 * 60 * 60 * 1000;
  const boosted   = isBoosted(s);
  return (
    <div onClick={() => onOpen(s.id)} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column" }}>
      <div style={{ background:C.gray50,position:"relative" }}>
        <ShirtPhoto value={photo} size={140} />
        {s.status === "vendido" && (
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3 }}>
            <span style={{ background:"#111",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:6,letterSpacing:1.5 }}>VENDIDO</span>
          </div>
        )}
        {(s.photos || []).length > 1 && (
          <span style={{ position:"absolute",bottom:6,right:8,fontSize:10,color:C.gray400,background:C.white,borderRadius:5,padding:"1px 5px",border:`1px solid ${C.gray200}` }}>
            +{s.photos.length - 1}
          </span>
        )}
        {(disc > 0 || isNew || boosted || s.status==="para_troca") && (
          <div style={{ position:"absolute",top:8,left:8,display:"flex",flexDirection:"column",gap:3 }}>
            {boosted && <span style={{ background:"linear-gradient(90deg,#f59e0b,#f97316)",color:C.white,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start",letterSpacing:.4 }}>⚡ Destaque</span>}
            {disc > 0 && <span style={{ background:C.red,color:C.white,fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start" }}>-{disc}%</span>}
            {isNew && <span style={{ background:C.green,color:C.white,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start" }}>✨ Novo</span>}
            {s.status==="para_troca" && <span style={{ background:"#f5f3ff",color:"#7c3aed",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,alignSelf:"flex-start",border:"1px solid #c4b5fd" }}>🔄 Troca</span>}
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(s.id); }}
          style={{ position:"absolute",top:8,right:8,background:"rgba(255,255,255,.85)",border:"none",width:28,height:28,borderRadius:"50%",fontSize:15,cursor:"pointer",color:wishlist.includes(s.id)?C.red:C.gray400 }}>
          {wishlist.includes(s.id) ? "♥" : "♡"}
        </button>
      </div>
      <div style={{ padding:"10px 12px 13px",flex:1,display:"flex",flexDirection:"column",gap:5 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <p style={{ margin:0,fontWeight:600,fontSize:13,color:C.gray900 }}>{s.team}</p>
          <Tag rarity={s.rarity} />
        </div>
        <p style={{ margin:0,color:C.gray400,fontSize:11 }}>{s.year} · {s.edition}</p>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <Star v={s.rating} />
          <span style={{ fontSize:11,color:C.gray400 }}>({s.reviews || 0})</span>
        </div>
        <div style={{ display:"flex",alignItems:"baseline",gap:7,marginTop:"auto" }}>
          <span style={{ fontWeight:700,color:C.green,fontSize:15 }}>R$ {Number(s.price).toLocaleString("pt-BR")}</span>
          {s.price_old && <span style={{ fontSize:11,color:C.gray400,textDecoration:"line-through" }}>R$ {Number(s.price_old).toLocaleString("pt-BR")}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── FILTER BAR ── */
function ActiveTag({ label,onRemove }) {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,background:C.greenLight,color:C.greenDark,fontSize:12,fontWeight:500 }}>{label}<button onClick={onRemove} style={{ background:"none",border:"none",color:C.green,cursor:"pointer",fontSize:14,padding:0,lineHeight:1 }}>×</button></span>;
}

export function FilterBar({ filters,setFilters,search,setSearch }) {
  const [open, setOpen] = useState(false);
  const { sport,type,region,condition,model,size,price,state } = filters;
  const set = (key,val) => setFilters(f=>({ ...f,[key]:f[key]===val?null:val }));
  const regionList = type ? REGIONS[type] : [];
  const activeCount = [sport,type,region,condition,model,size,price&&price!=="all"?price:null,state].filter(Boolean).length;
  return (
    <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"14px 16px",marginBottom:18 }}>
      {/* Busca + botão filtros */}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ position:"relative",flex:1 }}>
          <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:16 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar time, seleção, edição, país..." style={{ width:"100%",padding:"10px 14px 10px 40px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",outline:"none" }} />
          {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:16 }}>×</button>}
        </div>
        <button onClick={()=>setOpen(v=>!v)}
          style={{ flexShrink:0,padding:"9px 14px",borderRadius:10,border:`1.5px solid ${open||activeCount>0?C.green:C.gray200}`,background:open||activeCount>0?C.greenLight:C.white,color:open||activeCount>0?C.greenDark:C.gray600,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap" }}>
          ⚙️ Filtros{activeCount>0&&<span style={{ background:C.green,color:C.white,borderRadius:99,fontSize:11,padding:"1px 7px",fontWeight:700 }}>{activeCount}</span>}
        </button>
      </div>

      {/* Painel de filtros colapsável */}
      {open&&<>
        <div style={{ height:1,background:C.gray100,margin:"14px 0 12px" }} />
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
          <div><p style={{ margin:"0 0 7px",fontSize:11,fontWeight:600,color:C.gray400,textTransform:"uppercase",letterSpacing:.8 }}>Modelo</p><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{SHIRT_MODELS.map(m=><Pill key={m} active={model===m} onClick={()=>set("model",m)}>{m}</Pill>)}</div></div>
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
          <button onClick={()=>{ setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null}); }} style={{ fontSize:12,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:500,whiteSpace:"nowrap" }}>Limpar tudo</button>
        </div>}
      </>}
    </div>
  );
}

/* ── CONTACT MODAL ── */
export function ContactModal({ seller, onClose }) {
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
            <div><p style={{ margin:"0 0 1px",fontWeight:600,fontSize:14 }}>WhatsApp</p><p style={{ margin:0,fontSize:12,color:"#16a34a" }}>{phone}</p></div>
          </a>
        )}
        {emailLink&&(
          <a href={emailLink} style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"#eff6ff",borderRadius:12,marginBottom:10,textDecoration:"none",color:"#1e40af" }}>
            <span style={{ fontSize:24 }}>✉️</span>
            <div><p style={{ margin:"0 0 1px",fontWeight:600,fontSize:14 }}>Email</p><p style={{ margin:0,fontSize:12,color:"#2563eb" }}>{seller.email}</p></div>
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
export function TrustBar() {
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
export function CategoryTiles({ onNavigate, setFilters }) {
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
export function Footer({ onNavigate }) {
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
