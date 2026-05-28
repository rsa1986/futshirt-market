import { supabase } from "../supabase";
import { C } from "./constants";
import { ShirtPhoto } from "./ui";

const STATUS_META = {
  disponivel:  { label:"À venda",      color:C.green,    bg:C.greenLight },
  na_colecao:  { label:"Na coleção",   color:"#1d4ed8",  bg:"#eff6ff"   },
  para_troca:  { label:"Para troca",   color:"#7c3aed",  bg:"#f5f3ff"   },
  vendido:     { label:"Vendida",      color:C.gray400,  bg:C.gray50    },
};

export default function PortfolioPage({
  user, profile, shirts, isMobile,
  portfolioTab, setPortfolioTab,
  portfolioSearch, setPortfolioSearch,
  onAddShirt, startEditShirt, openShirt, navigate, addToast, loadShirts,
}) {
  const myAll = shirts.filter(s => s.seller_id === user.id);
  const counts = {
    todos:    myAll.length,
    colecao:  myAll.filter(s=>s.status==="na_colecao").length,
    venda:    myAll.filter(s=>s.status==="disponivel").length,
    troca:    myAll.filter(s=>s.status==="para_troca").length,
    historico:myAll.filter(s=>s.status==="vendido").length,
  };
  const totalInvested = myAll.reduce((a,s)=>a+(parseFloat(s.acquisition_price)||0),0);
  const totalValue    = myAll.filter(s=>s.status!=="vendido").reduce((a,s)=>a+(parseFloat(s.price)||0),0);
  const clubMap = {};
  myAll.forEach(s=>{ if(s.team) clubMap[s.team]=(clubMap[s.team]||0)+1; });
  const topClubs = Object.entries(clubMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const TABS = [
    ["todos","📦 Todos",counts.todos],["colecao","📚 Coleção",counts.colecao],
    ["venda","🏷️ À venda",counts.venda],["troca","🔄 Para troca",counts.troca],
    ["historico","📜 Histórico",counts.historico],
  ];

  const tabFiltered = myAll.filter(s=>{
    if(portfolioTab==="colecao"   && s.status!=="na_colecao") return false;
    if(portfolioTab==="venda"     && s.status!=="disponivel") return false;
    if(portfolioTab==="troca"     && s.status!=="para_troca") return false;
    if(portfolioTab==="historico" && s.status!=="vendido")    return false;
    if(portfolioSearch){
      const q = portfolioSearch.toLowerCase();
      return `${s.team} ${s.edition||""} ${s.year||""} ${s.country||""} ${s.player_name||""} ${s.shirt_color||""}`.toLowerCase().includes(q);
    }
    return true;
  });

  async function changeShelfStatus(id, newStatus) {
    const { error } = await supabase.from("shirts").update({ status: newStatus }).eq("id", id);
    if(!error) { await loadShirts(); addToast("Status atualizado!"); }
    else addToast("Erro ao atualizar","error");
  }

  return (
    <>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10 }}>
        <div>
          <h2 style={{ margin:"0 0 2px",fontWeight:800,fontSize:20 }}>📚 Meu Portfólio</h2>
          <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{myAll.length} camiseta{myAll.length!==1?"s":""} registrada{myAll.length!==1?"s":""}</p>
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          <button onClick={async()=>{
            const slug=profile?.username||user.id;
            const url=`${window.location.origin}${window.location.pathname}#portfolio-${slug}`;
            try{await navigator.clipboard.writeText(url);addToast("🔗 Link do portfólio copiado!");}
            catch{addToast("Não foi possível copiar","error");}
          }} style={{ padding:"9px 14px",border:`1px solid ${C.blue}`,borderRadius:10,background:C.blueLight,color:C.blue,fontSize:13,fontWeight:600,cursor:"pointer" }}>
            🔗 Compartilhar
          </button>
          <button onClick={onAddShirt}
            style={{ padding:"9px 18px",border:"none",borderRadius:10,background:C.green,color:C.white,fontSize:13,fontWeight:600,cursor:"pointer" }}>
            + Adicionar
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(5,1fr)",gap:10,marginBottom:16 }}>
        {[["📦",counts.todos,"Total","#374151","#f3f4f6"],["📚",counts.colecao,"Coleção","#1d4ed8","#eff6ff"],["🏷️",counts.venda,"À venda",C.greenDark,C.greenLight],["🔄",counts.troca,"Para troca","#7c3aed","#f5f3ff"],["📜",counts.historico,"Histórico",C.gray400,C.gray50]].map(([icon,n,label,color,bg])=>(
          <div key={label} style={{ background:bg,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${color}22`,cursor:"pointer" }}
            onClick={()=>setPortfolioTab(label==="Total"?"todos":label==="Coleção"?"colecao":label==="À venda"?"venda":label==="Para troca"?"troca":"historico")}>
            <div style={{ fontSize:20,marginBottom:2 }}>{icon}</div>
            <div style={{ fontSize:22,fontWeight:800,color }}>{n}</div>
            <div style={{ fontSize:10,color,fontWeight:600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Valor investido vs atual */}
      {(totalInvested>0||totalValue>0)&&(
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16 }}>
          {totalInvested>0&&<div style={{ background:"#fffbeb",borderRadius:12,padding:"12px 16px",border:"1px solid #fde68a",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div><p style={{ margin:0,fontSize:11,color:"#92400e",fontWeight:600 }}>💰 Total investido</p><p style={{ margin:0,fontSize:11,color:"#b45309" }}>custo de aquisição</p></div>
            <span style={{ fontSize:20,fontWeight:800,color:"#92400e" }}>R$ {totalInvested.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>
          </div>}
          {totalValue>0&&<div style={{ background:C.greenLight,borderRadius:12,padding:"12px 16px",border:`1px solid ${C.green}55`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div><p style={{ margin:0,fontSize:11,color:C.greenDark,fontWeight:600 }}>📈 Valor atual</p><p style={{ margin:0,fontSize:11,color:C.green }}>soma dos preços de venda</p></div>
            <span style={{ fontSize:20,fontWeight:800,color:C.green }}>R$ {totalValue.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>
          </div>}
        </div>
      )}

      {/* Por clube */}
      {topClubs.length>0&&(
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"12px 16px",marginBottom:16 }}>
          <p style={{ margin:"0 0 10px",fontSize:12,fontWeight:700,color:C.gray900 }}>Por clube</p>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {topClubs.map(([club,n])=>(
              <div key={club} onClick={()=>{ setPortfolioSearch(club); setPortfolioTab("todos"); }}
                style={{ padding:"4px 12px",borderRadius:99,background:C.gray50,border:`1px solid ${C.gray200}`,display:"flex",alignItems:"center",gap:6,cursor:"pointer" }}>
                <span style={{ fontSize:13,fontWeight:600,color:C.gray900 }}>{club}</span>
                <span style={{ fontSize:11,fontWeight:800,color:C.green,background:C.greenLight,borderRadius:99,padding:"1px 7px" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas detalhadas */}
      {myAll.length>0&&(()=>{
        const byYear = {}, byCond = { Nova:0, Usada:0 }, bySize = {};
        myAll.forEach(s=>{
          if(s.year) byYear[s.year]=(byYear[s.year]||0)+1;
          if(s.condition) byCond[s.condition]=(byCond[s.condition]||0)+1;
          if(s.size) bySize[s.size]=(bySize[s.size]||0)+1;
        });
        const topYears = Object.entries(byYear).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const topSizes = Object.entries(bySize).sort((a,b)=>b[1]-a[1]);
        const mostVal  = myAll.filter(s=>s.price).sort((a,b)=>(b.price||0)-(a.price||0))[0];
        const roi      = totalInvested>0 ? Math.round(((totalValue-totalInvested)/totalInvested)*100) : null;
        return (
          <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"12px 16px",marginBottom:16 }}>
            <p style={{ margin:"0 0 12px",fontWeight:700,fontSize:12,color:C.gray900 }}>Estatísticas detalhadas</p>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10 }}>
              {topYears.length>0&&<div style={{ background:C.gray50,borderRadius:10,padding:"10px 12px" }}>
                <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray600 }}>Por ano</p>
                {topYears.map(([yr,n])=>(
                  <div key={yr} style={{ display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0" }}>
                    <span style={{ color:C.gray900 }}>{yr}</span><span style={{ fontWeight:700,color:C.green }}>{n}</span>
                  </div>
                ))}
              </div>}
              <div style={{ background:C.gray50,borderRadius:10,padding:"10px 12px" }}>
                <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray600 }}>Condição</p>
                {Object.entries(byCond).filter(([,n])=>n>0).map(([c,n])=>(
                  <div key={c} style={{ display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0" }}>
                    <span style={{ color:C.gray900 }}>{c}</span><span style={{ fontWeight:700,color:C.green }}>{n}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:C.gray50,borderRadius:10,padding:"10px 12px" }}>
                <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray600 }}>Por tamanho</p>
                {topSizes.map(([sz,n])=>(
                  <div key={sz} style={{ display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0" }}>
                    <span style={{ color:C.gray900 }}>{sz}</span><span style={{ fontWeight:700,color:C.green }}>{n}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:C.gray50,borderRadius:10,padding:"10px 12px" }}>
                <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray600 }}>Destaques</p>
                {mostVal&&<div style={{ marginBottom:4 }}>
                  <p style={{ margin:0,fontSize:10,color:C.gray400 }}>Mais valiosa</p>
                  <p style={{ margin:0,fontSize:12,fontWeight:600,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{mostVal.team}</p>
                  <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.green }}>R$ {Number(mostVal.price).toLocaleString("pt-BR")}</p>
                </div>}
                {roi!==null&&<div>
                  <p style={{ margin:0,fontSize:10,color:C.gray400 }}>Valorização</p>
                  <p style={{ margin:0,fontSize:16,fontWeight:800,color:roi>=0?C.green:C.red }}>{roi>=0?"+":""}{roi}%</p>
                </div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Busca */}
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:14 }}>🔍</span>
          <input value={portfolioSearch} onChange={e=>setPortfolioSearch(e.target.value)}
            placeholder="Buscar time, ano, jogador, cor..."
            style={{ width:"100%",padding:"8px 10px 8px 32px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:13,boxSizing:"border-box" }}
          />
          {portfolioSearch&&<button onClick={()=>setPortfolioSearch("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:16 }}>×</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,marginBottom:16,overflowX:"auto" }}>
        {TABS.map(([v,l,n])=>(
          <button key={v} onClick={()=>setPortfolioTab(v)}
            style={{ padding:"6px 12px",borderRadius:8,border:"none",background:portfolioTab===v?"#1d4ed8":"none",color:portfolioTab===v?"#fff":C.gray600,fontWeight:portfolioTab===v?700:400,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5 }}>
            {l} <span style={{ background:portfolioTab===v?"rgba(255,255,255,.25)":C.gray100,borderRadius:99,padding:"1px 6px",fontSize:11 }}>{n}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {tabFiltered.length===0?(
        <div style={{ textAlign:"center",padding:"3rem 1rem",color:C.gray400 }}>
          <div style={{ fontSize:48,marginBottom:12 }}>📭</div>
          <p style={{ fontSize:15,fontWeight:600 }}>{portfolioSearch?"Nenhuma camiseta encontrada":"Nenhuma camiseta nesta categoria"}</p>
          <p style={{ fontSize:13 }}>{portfolioSearch?`Busca: "${portfolioSearch}"`:"Adicione sua primeira camiseta!"}</p>
        </div>
      ):(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {tabFiltered.map(sh=>{
            const sm = STATUS_META[sh.status]||STATUS_META.disponivel;
            return (
              <div key={sh.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:60,height:60,borderRadius:10,overflow:"hidden",background:C.gray50,flexShrink:0 }}>
                  <ShirtPhoto value={(sh.photos||[])[0]||"⚽"} size={60} />
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                    <p style={{ margin:0,fontWeight:700,fontSize:14,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sh.team}</p>
                    <span style={{ flexShrink:0,fontSize:10,fontWeight:700,color:sm.color,background:sm.bg,padding:"2px 7px",borderRadius:99 }}>{sm.label}</span>
                  </div>
                  <p style={{ margin:"0 0 4px",fontSize:12,color:C.gray400 }}>{[sh.edition,sh.year,sh.size,sh.condition,sh.shirt_color,sh.player_name?`#${sh.player_name}`:""].filter(Boolean).join(" · ")}</p>
                  <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                    {sh.price&&<span style={{ fontSize:13,fontWeight:700,color:C.green }}>R$ {Number(sh.price).toLocaleString("pt-BR")}</span>}
                    {sh.acquisition_price&&<span style={{ fontSize:11,color:C.gray400 }}>Pago: R$ {Number(sh.acquisition_price).toLocaleString("pt-BR")}</span>}
                    {(sh.has_name||sh.has_number)&&<span style={{ fontSize:11,color:"#7c3aed" }}>{[sh.has_name?"nome":"",sh.has_number?"número":""].filter(Boolean).join("+")}</span>}
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                  <button onClick={()=>startEditShirt(sh)} style={{ padding:"5px 10px",background:C.white,border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:11,cursor:"pointer",color:C.gray600 }}>✏️ Editar</button>
                  <select value={sh.status} onChange={e=>changeShelfStatus(sh.id,e.target.value)}
                    style={{ padding:"5px 8px",border:`1px solid ${sm.color}`,borderRadius:8,fontSize:11,cursor:"pointer",color:sm.color,fontWeight:600,background:sm.bg,outline:"none" }}>
                    <option value="disponivel">🏷️ À venda</option>
                    <option value="na_colecao">📚 Coleção</option>
                    <option value="para_troca">🔄 Para troca</option>
                    <option value="vendido">✓ Vendida</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Para troca de outros colecionadores */}
      {(()=>{
        const myTeams = new Set(myAll.map(s=>s.team.toLowerCase()));
        const othersTroca = shirts.filter(s=>s.status==="para_troca"&&s.seller_id!==user.id&&!s.profiles?.blocked);
        const matching = othersTroca.filter(s=>myTeams.has(s.team.toLowerCase()));
        const others   = othersTroca.filter(s=>!myTeams.has(s.team.toLowerCase())).slice(0,6);
        if(othersTroca.length===0) return null;
        return (
          <div style={{ marginTop:24,borderTop:`1px solid ${C.gray200}`,paddingTop:20 }}>
            <p style={{ margin:"0 0 4px",fontWeight:700,fontSize:15,color:C.gray900 }}>🔄 Para troca de outros colecionadores</p>
            <p style={{ margin:"0 0 14px",fontSize:13,color:C.gray400 }}>Colecionadores que querem trocar camisetas que você também pode ter.</p>
            {matching.length>0&&<>
              <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:12,color:"#7c3aed" }}>⭐ Times que você coleciona</p>
              <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(220px,1fr))",gap:10,marginBottom:16 }}>
                {matching.slice(0,6).map(s=>(
                  <div key={s.id} onClick={()=>openShirt(s.id)} style={{ background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:12,padding:"10px 12px",cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}>
                    <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",background:C.white,flexShrink:0 }}><ShirtPhoto value={(s.photos||[])[0]||"⚽"} size={44} /></div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:"0 0 1px",fontWeight:700,fontSize:12,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.team}</p>
                      <p style={{ margin:0,fontSize:11,color:"#7c3aed",fontWeight:600 }}>🔄 Para troca</p>
                    </div>
                  </div>
                ))}
              </div>
            </>}
            {others.length>0&&<>
              <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:12,color:C.gray600 }}>Outros disponíveis para troca</p>
              <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
                {others.map(s=>(
                  <div key={s.id} onClick={()=>openShirt(s.id)} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"10px 12px",cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}>
                    <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",background:C.gray50,flexShrink:0 }}><ShirtPhoto value={(s.photos||[])[0]||"⚽"} size={44} /></div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:"0 0 1px",fontWeight:700,fontSize:12,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.team}</p>
                      <p style={{ margin:0,fontSize:11,color:"#7c3aed",fontWeight:600 }}>🔄 Para troca</p>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        );
      })()}
    </>
  );
}
