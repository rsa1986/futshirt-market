/* ── TOKENS ── */
export const C = {
  green:"#16a34a", greenLight:"#dcfce7", greenDark:"#14532d",
  gray50:"#f9fafb", gray100:"#f3f4f6", gray200:"#e5e7eb",
  gray400:"#9ca3af", gray600:"#4b5563", gray900:"#111827",
  white:"#ffffff", red:"#ef4444", redLight:"#fef2f2",
  amber:"#f59e0b", amberLight:"#fffbeb",
  purple:"#7c3aed", purpleLight:"#f5f3ff",
  blue:"#2563eb", blueLight:"#eff6ff",
};
export const rCol = { "Comum":C.blue,"Rara":C.purple,"Muito Rara":C.amber,"Lendária":C.red };
export const rBg  = { "Comum":C.blueLight,"Rara":C.purpleLight,"Muito Rara":C.amberLight,"Lendária":C.redLight };
export const badgeIcon = { "Top Vendedor":"🏆","Verificado":"✅","Colecionador Lendário":"👑","100+ Vendas":"💯","Membro Fundador":"⭐" };

/* ── FILTER TAXONOMY ── */
export const SPORTS = [{ id:"futebol",label:"⚽ Futebol" },{ id:"basquete",label:"🏀 Basquete",soon:true },{ id:"americano",label:"🏈 Futebol Americano",soon:true }];
export const TYPES  = [{ id:"times",label:"🏟️ Times" },{ id:"selecoes",label:"🌎 Seleções" }];
export const REGIONS = {
  times:   [{ id:"nacional",label:"🇧🇷 Nacional (Brasil)" },{ id:"europa",label:"🌍 Europa" },{ id:"america_sul",label:"🌎 América do Sul" },{ id:"america_norte",label:"🌐 América do Norte" },{ id:"africa",label:"🌍 África" },{ id:"asia",label:"🌏 Ásia" }],
  selecoes:[{ id:"america_sul",label:"🌎 América do Sul" },{ id:"europa",label:"🌍 Europa" },{ id:"africa",label:"🌍 África" },{ id:"america_norte",label:"🌐 América do Norte" },{ id:"asia",label:"🌏 Ásia" }],
};
export const CONDITIONS   = ["Nova","Usada"];
export const SIZES        = ["PP","P","M","G","GG"];
export const SHIRT_MODELS = ["Modelo Jogador","Modelo Torcedor","Utilizado em Jogo"];
export const PRICES     = [{ id:"all",label:"Qualquer preço" },{ id:"0-300",label:"Até R$ 300" },{ id:"300-800",label:"R$ 300–800" },{ id:"800-2000",label:"R$ 800–2000" },{ id:"2000+",label:"Acima de R$ 2000" }];
export const BR_STATES  = [
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
export const BOOST_PRICE = "R$ 9,90";
export const BOOST_DAYS  = 7;

export const CATEGORY_TILES = [
  { icon:"🇧🇷", label:"Times Nacionais",   color:"#15803d", bg:"#f0fdf4", filters:{ type:"times",    region:"nacional" } },
  { icon:"🌍",  label:"Times Europeus",    color:"#1d4ed8", bg:"#eff6ff", filters:{ type:"times",    region:"europa"   } },
  { icon:"🌎",  label:"América do Sul",    color:"#b45309", bg:"#fffbeb", filters:{ type:"times",    region:"america_sul" } },
  { icon:"🏆",  label:"Seleções",          color:"#7c3aed", bg:"#f5f3ff", filters:{ type:"selecoes", region:null       } },
  { icon:"👕",  label:"Modelo Jogador",    color:"#0891b2", bg:"#ecfeff", filters:{ model:"Modelo Jogador"             } },
  { icon:"🏅",  label:"Utilizado em Jogo", color:"#be123c", bg:"#fff1f2", filters:{ model:"Utilizado em Jogo"          } },
];

export const BANNERS_DEFAULT = [
  { id:1,label:"VERDÃO",title:"S. E. Palmeiras",sub:"Camiseta oficial 2024 — edição comemorativa 110 anos do Verdão",cta:"Ver anúncios",grad:"linear-gradient(120deg,#052e16 0%,#14532d 55%,#166534 100%)",accent:"#4ade80",img:"https://images.unsplash.com/photo-1772450235863-996680ddb732?fm=jpg&q=80&w=900&auto=format&fit=crop" },
  { id:2,label:"PROMOÇÃO",title:"Até 40% OFF",sub:"Colecionadores verificados com descontos exclusivos esta semana",cta:"Ver ofertas",grad:"linear-gradient(120deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)",accent:"#93c5fd",img:"🏷️" },
  { id:3,label:"DESTAQUE",title:"Copa do Mundo 2002",sub:"Reviva a glória do pentacampeonato com réplicas originais",cta:"Ver camisetas",grad:"linear-gradient(120deg,#78350f 0%,#b45309 60%,#d97706 100%)",accent:"#fcd34d",img:"🏆" },
];
export const BANNER_THEMES = [
  { id:"green",  label:"🌿 Verde",   grad:"linear-gradient(120deg,#14532d 0%,#166534 60%,#15803d 100%)",accent:"#4ade80" },
  { id:"blue",   label:"🔵 Azul",    grad:"linear-gradient(120deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)",accent:"#93c5fd" },
  { id:"amber",  label:"🟡 Dourado", grad:"linear-gradient(120deg,#78350f 0%,#b45309 60%,#d97706 100%)",accent:"#fcd34d" },
  { id:"red",    label:"🔴 Vermelho",grad:"linear-gradient(120deg,#7f1d1d 0%,#b91c1c 60%,#ef4444 100%)",accent:"#fca5a5" },
  { id:"purple", label:"🟣 Roxo",    grad:"linear-gradient(120deg,#3b0764 0%,#7c3aed 60%,#8b5cf6 100%)",accent:"#c4b5fd" },
];

export const PROFANITY = ["porra","merda","caralho","fdp","foda","foder","viado","buceta","cuzão","puta","vagabunda","arrombado","babaca","imbecil","desgraça","otário","corno","piranha","safado","safada","prostituta","idiota","retardado","burro","lixo","escória","raça","vsf","vtnc","tnc","krl","pqp","qrl"];

export const emptyForm = {
  team:"",country:"",year:"",edition:"",condition:"Nova",price:"",price_old:"",size:"M",model:"",
  type:"times",region:"nacional",description:"",photos:[],status:"disponivel",
  acquisition_price:"",has_name:false,has_number:false,player_name:"",shirt_color:"",collection_note:""
};

/* ── PURE UTILS ── */
export function isBoosted(s) {
  return s.boosted && s.boosted_until && new Date(s.boosted_until) > new Date();
}
export function hasProfanity(text) {
  if(!text) return false;
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  return PROFANITY.some(w => lower.includes(w.normalize("NFD").replace(/[̀-ͯ]/g,"")));
}
export function isUrl(val) {
  return typeof val === "string" && val.startsWith("http");
}
export function parseImg(img) {
  if (!img) return { url: null, position: "center center", size: "cover" };
  if (img.startsWith("{")) {
    try { const p = JSON.parse(img); return { url: p.url||null, position: p.position||"center center", size: p.size||"cover" }; } catch {}
  }
  if (isUrl(img)) return { url: img, position: "center center", size: "cover" };
  return { url: null, position: "center center", size: "cover" };
}
export function buildImgField(url, position, size) {
  if (!url || !isUrl(url)) return url || "";
  if (position === "center center" && size === "cover") return url;
  return JSON.stringify({ url, position, size });
}
export function parsePosition(posStr) {
  const named = { left:0, center:50, right:100, top:0, bottom:100 };
  const parts = (posStr||"center center").trim().split(/\s+/);
  const n = p => p in named ? named[p] : (parseFloat(p)||50);
  return parts.length >= 2 ? [n(parts[0]), n(parts[1])] : [n(parts[0]), 50];
}
export function parseDeepLink(link) {
  if (!link || !link.includes("?")) return { page: link||"catalog", params: {} };
  const [page, qs] = link.split("?");
  return { page: page||"catalog", params: Object.fromEntries(new URLSearchParams(qs)) };
}
export function buildDeepLink(page, params) {
  const filled = Object.fromEntries(Object.entries(params).filter(([,v])=>v));
  if (!Object.keys(filled).length) return page;
  return `${page}?${new URLSearchParams(filled).toString()}`;
}
