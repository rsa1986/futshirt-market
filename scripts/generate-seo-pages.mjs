import { writeFileSync, mkdirSync } from "fs";

const SUPABASE_URL = "https://cycxfdhcfxjsrikwqknw.supabase.co";
const ANON_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3hmZGhjZnhqc3Jpa3dxa253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDc2NjMsImV4cCI6MjA5NTMyMzY2M30.bn2wIPn_NKyN6Ufv9EiiswDZKmKOKx3VT1FGUNr0HTo";
const SITE        = "https://futshirt-market.vercel.app";

const CLUBS = [
  { name:"Flamengo",         slug:"flamengo",         search:"Flamengo",     apelido:"Mengão"        },
  { name:"Corinthians",      slug:"corinthians",      search:"Corinthians",  apelido:"Timão"         },
  { name:"Palmeiras",        slug:"palmeiras",        search:"Palmeiras",    apelido:"Verdão"        },
  { name:"São Paulo",        slug:"sao-paulo",        search:"São Paulo",    apelido:"Tricolor"      },
  { name:"Vasco da Gama",    slug:"vasco",            search:"Vasco",        apelido:"Vasco"         },
  { name:"Grêmio",           slug:"gremio",           search:"Grêmio",       apelido:"Tricolor Gaúcho"},
  { name:"Internacional",    slug:"internacional",    search:"Internacional",apelido:"Colorado"      },
  { name:"Atlético Mineiro", slug:"atletico-mineiro", search:"Atlético",     apelido:"Galo"          },
  { name:"Cruzeiro",         slug:"cruzeiro",         search:"Cruzeiro",     apelido:"Raposa"        },
  { name:"Santos",           slug:"santos",           search:"Santos",       apelido:"Peixe"         },
  { name:"Botafogo",         slug:"botafogo",         search:"Botafogo",     apelido:"Estrela Solitária"},
  { name:"Fluminense",       slug:"fluminense",       search:"Fluminense",   apelido:"Flu"           },
  { name:"Brasil",           slug:"brasil",           search:"Brasil",       apelido:"Seleção"       },
];

function parseImg(v) {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  return `${SUPABASE_URL}/storage/v1/object/public/shirt-photos/${v}`;
}

async function fetchShirts(search) {
  const url = `${SUPABASE_URL}/rest/v1/shirts?team=ilike.*${encodeURIComponent(search)}*&status=eq.disponivel&select=id,team,year,price,photos,condition,model&order=created_at.desc&limit=24`;
  const res = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } });
  return res.ok ? await res.json() : [];
}

function shirtCard(s) {
  const photo = parseImg((s.photos || [])[0]);
  const price = s.price ? `R$ ${Number(s.price).toLocaleString("pt-BR")}` : "Consultar";
  const link  = `${SITE}/#item-${s.id}`;
  const label = [s.year, s.condition].filter(Boolean).join(" · ");
  return `
    <a href="${link}" class="card">
      <div class="card-img">
        ${photo ? `<img src="${photo}" alt="Camiseta ${s.team} ${s.year||""}" loading="lazy">` : `<div class="no-img">⚽</div>`}
      </div>
      <div class="card-body">
        <p class="card-team">${s.team}</p>
        ${label ? `<p class="card-label">${label}</p>` : ""}
        <p class="card-price">${price}</p>
      </div>
    </a>`;
}

function buildPage(club, shirts) {
  const title       = `Camisetas do ${club.name} | FutShirt Market`;
  const description = `Compre camisetas do ${club.name} (${club.apelido}) no FutShirt Market. Camisas originais, retrô e usadas de colecionadores verificados. Frete para todo o Brasil.`;
  const canonical   = `${SITE}/times/${club.slug}`;
  const hasShirts   = shirts.length > 0;

  const jsonLd = hasShirts ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Camisetas do ${club.name}`,
    "url": canonical,
    "numberOfItems": shirts.length,
    "itemListElement": shirts.slice(0, 10).map((s, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `Camiseta ${s.team} ${s.year || ""}`.trim(),
      "url": `${SITE}/#item-${s.id}`,
      "offers": s.price ? { "@type": "Offer", "price": s.price, "priceCurrency": "BRL", "availability": "https://schema.org/InStock" } : undefined,
    })),
  }) : null;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="FutShirt Market">
  <meta name="robots" content="index, follow">
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; color: #111827; }

    /* HEADER */
    .header { background: #14532d; padding: 0 1rem; }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    .logo { color: #fff; font-weight: 800; font-size: 1.1rem; text-decoration: none; }
    .header-cta { background: #fff; color: #14532d; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 8px; text-decoration: none; }

    /* HERO */
    .hero { background: linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%); color: #fff; padding: 3rem 1rem 2.5rem; text-align: center; }
    .hero h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; margin-bottom: .5rem; }
    .hero p  { font-size: clamp(.9rem, 2vw, 1.05rem); color: #bbf7d0; max-width: 520px; margin: 0 auto 1.5rem; line-height: 1.6; }
    .hero-btn { display: inline-block; background: #fff; color: #14532d; font-weight: 700; font-size: 14px; padding: 10px 24px; border-radius: 10px; text-decoration: none; }

    /* GRID */
    .section { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1rem; }
    .section-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 1.25rem; color: #111827; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }

    /* CARD */
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: box-shadow .15s; }
    .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); }
    .card-img { aspect-ratio: 1; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; }
    .no-img { font-size: 2.5rem; }
    .card-body { padding: 10px 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .card-team  { font-size: 13px; font-weight: 700; color: #111827; }
    .card-label { font-size: 11px; color: #6b7280; }
    .card-price { font-size: 15px; font-weight: 800; color: #16a34a; margin-top: auto; padding-top: 6px; }

    /* EMPTY */
    .empty { text-align: center; padding: 3rem 1rem; color: #6b7280; }
    .empty p { margin-bottom: 1rem; }

    /* SEO TEXT */
    .seo { max-width: 1200px; margin: 0 auto; padding: 0 1rem 3rem; }
    .seo h2 { font-size: 1rem; font-weight: 700; margin-bottom: .5rem; color: #374151; }
    .seo p  { font-size: .875rem; color: #6b7280; line-height: 1.7; margin-bottom: 1rem; }

    /* FOOTER */
    .footer { background: #111827; color: #9ca3af; text-align: center; padding: 1.5rem 1rem; font-size: 13px; }
    .footer a { color: #6ee7b7; text-decoration: none; }
  </style>
</head>
<body>

  <header class="header">
    <div class="header-inner">
      <a href="${SITE}" class="logo">⚽ FutShirt Market</a>
      <a href="${SITE}/#catalog" class="header-cta">Ver catálogo</a>
    </div>
  </header>

  <section class="hero">
    <h1>Camisetas do ${club.name}</h1>
    <p>${description}</p>
    <a href="${SITE}/#catalog" class="hero-btn">Ver todos os anúncios →</a>
  </section>

  <section class="section">
    <h2 class="section-title">
      ${hasShirts ? `${shirts.length} camiseta${shirts.length > 1 ? "s" : ""} disponíve${shirts.length > 1 ? "is" : "l"}` : "Anúncios"}
    </h2>
    ${hasShirts
      ? `<div class="grid">${shirts.map(shirtCard).join("")}</div>`
      : `<div class="empty">
           <p>Nenhuma camiseta do ${club.name} disponível no momento.</p>
           <a href="${SITE}/#catalog" style="color:#16a34a;font-weight:700;">Ver todo o catálogo →</a>
         </div>`
    }
  </section>

  <div class="seo">
    <h2>Camisetas do ${club.name} para colecionadores</h2>
    <p>
      O FutShirt Market é o marketplace especializado em camisetas de futebol do Brasil.
      Aqui você encontra camisetas do ${club.name} (${club.apelido}) de todas as épocas —
      desde modelos retrô das décadas de 80 e 90 até lançamentos recentes —
      vendidas por colecionadores verificados com entrega para todo o Brasil.
    </p>
    <p>
      Todas as camisetas passam por avaliação dos vendedores, com fotos reais e
      descrição detalhada do estado de conservação. Compre com segurança no maior
      marketplace de camisetas de futebol do país.
    </p>
  </div>

  <footer class="footer">
    <p>© ${new Date().getFullYear()} <a href="${SITE}">FutShirt Market</a> — Marketplace de camisetas de futebol</p>
  </footer>

</body>
</html>`;
}

// ── MAIN ──
mkdirSync("public/times", { recursive: true });

let generated = 0;
for (const club of CLUBS) {
  const shirts = await fetchShirts(club.search);
  const html   = buildPage(club, shirts);
  writeFileSync(`public/times/${club.slug}.html`, html, "utf8");
  console.log(`✅ /times/${club.slug} — ${shirts.length} camisetas`);
  generated++;
}

console.log(`\n${generated} páginas geradas em public/times/`);
