import { C } from "./constants";
import { Avatar, ShirtPhoto, EmptyState, shimmerBase } from "./ui";

const PUB_STATUS = {
  disponivel: { label:"À venda",    color:C.green,   bg:C.greenLight },
  na_colecao: { label:"Na coleção", color:"#1d4ed8", bg:"#eff6ff"   },
  para_troca: { label:"Para troca", color:"#7c3aed", bg:"#f5f3ff"   },
};

export default function PublicPortfolioPage({
  publicPortfolioData, publicPortfolioId, isMobile, openShirt, openSeller,
}) {
  const { profile: pubProf, shirts: pubShirts } = publicPortfolioData;
  const pubCounts = {
    colecao: pubShirts.filter(s=>s.status==="na_colecao").length,
    venda:   pubShirts.filter(s=>s.status==="disponivel").length,
    troca:   pubShirts.filter(s=>s.status==="para_troca").length,
  };

  return (
    <>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",gap:16,marginBottom:20,flexWrap:"wrap" }}>
        {pubProf ? <Avatar name={pubProf.name} size={64} src={pubProf.avatar_url} /> : <div style={{ width:64,height:64,borderRadius:"50%",...shimmerBase }} />}
        <div style={{ flex:1,minWidth:0 }}>
          {pubProf ? <>
            <h2 style={{ margin:"0 0 4px",fontWeight:800,fontSize:20 }}>📚 Portfólio de {pubProf.name}</h2>
            {pubProf.bio&&<p style={{ margin:"0 0 8px",fontSize:13,color:C.gray600,lineHeight:1.5 }}>{pubProf.bio}</p>}
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <span style={{ fontSize:12,color:C.gray600 }}>📦 {pubShirts.length} camiseta{pubShirts.length!==1?"s":""}</span>
              {pubProf.location&&<span style={{ fontSize:12,color:C.gray600 }}>📍 {pubProf.location}</span>}
              {pubCounts.troca>0&&<span style={{ fontSize:12,color:"#7c3aed",fontWeight:600 }}>🔄 {pubCounts.troca} para troca</span>}
            </div>
          </> : <div style={{ ...shimmerBase,height:20,width:200,marginBottom:8 }} />}
        </div>
        {pubProf&&<button onClick={()=>openSeller(publicPortfolioId)} style={{ padding:"8px 16px",border:`1px solid ${C.green}`,borderRadius:10,background:C.white,color:C.green,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0 }}>Ver anúncios →</button>}
      </div>

      {/* Stats rápidos */}
      {pubShirts.length>0&&(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          {[["📚",pubCounts.colecao,"Na coleção","#1d4ed8","#eff6ff"],["🏷️",pubCounts.venda,"À venda",C.greenDark,C.greenLight],["🔄",pubCounts.troca,"Para troca","#7c3aed","#f5f3ff"]].map(([icon,n,label,color,bg])=>(
            <div key={label} style={{ background:bg,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${color}22` }}>
              <div style={{ fontSize:20,marginBottom:2 }}>{icon}</div>
              <div style={{ fontSize:20,fontWeight:800,color }}>{n}</div>
              <div style={{ fontSize:10,color,fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de camisetas */}
      {pubShirts.length===0&&!pubProf ? (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {[...Array(4)].map((_,i)=><div key={i} style={{ ...shimmerBase,height:72,borderRadius:12 }} />)}
        </div>
      ) : pubShirts.length===0 ? (
        <EmptyState emoji="📭" title="Portfólio vazio" sub="Este colecionador ainda não adicionou camisetas." />
      ) : (
        <>
          {["na_colecao","para_troca","disponivel"].map(status=>{
            const group = pubShirts.filter(s=>s.status===status);
            if(!group.length) return null;
            const meta = PUB_STATUS[status];
            return (
              <div key={status} style={{ marginBottom:20 }}>
                <p style={{ margin:"0 0 10px",fontWeight:700,fontSize:13,color:meta.color }}>
                  {status==="na_colecao"?"📚 Na coleção":status==="para_troca"?"🔄 Para troca":"🏷️ À venda"}{" "}
                  <span style={{ fontWeight:400,color:C.gray400 }}>({group.length})</span>
                </p>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {group.map(sh=>(
                    <div key={sh.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ width:56,height:56,borderRadius:10,overflow:"hidden",background:C.gray50,flexShrink:0 }}>
                        <ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={56} />
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                          <p style={{ margin:0,fontWeight:700,fontSize:14,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sh.team}</p>
                          <span style={{ flexShrink:0,fontSize:10,fontWeight:700,color:meta.color,background:meta.bg,padding:"2px 7px",borderRadius:99 }}>{meta.label}</span>
                        </div>
                        <p style={{ margin:0,fontSize:12,color:C.gray400 }}>{[sh.edition,sh.year,sh.size,sh.condition].filter(Boolean).join(" · ")}</p>
                        {sh.price&&sh.status!=="na_colecao"&&<span style={{ fontSize:13,fontWeight:700,color:C.green }}>R$ {Number(sh.price).toLocaleString("pt-BR")}</span>}
                      </div>
                      <button onClick={()=>openShirt(sh.id)} style={{ flexShrink:0,padding:"6px 12px",border:`1px solid ${meta.color}`,borderRadius:9,background:meta.bg,color:meta.color,fontSize:12,fontWeight:600,cursor:"pointer" }}>
                        {status==="para_troca"?"🔄 Troca":"Ver →"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
