import { supabase } from "../supabase";
import { C, BANNER_THEMES, SIZES, REGIONS, isBoosted, BOOST_DAYS, parseImg, buildImgField, parsePosition, parseDeepLink, buildDeepLink, isUrl } from "./constants";
import { Avatar, ShirtPhoto, SectionHead } from "./ui";

export default function AdminPage({
  user, sellers, shirts, adminTab, setAdminTab,
  banners, adminBannerEdit, setAdminBannerEdit, bannerSaving, bannerErrors, setBannerErrors,
  adminQuestions, adminNotifs,
  handleToggleBlock, handleDeleteShirt, handleSaveBanner,
  handleActivateBoost, handleDeactivateBoost,
  loadAdminQuestions, loadAdminNotifs, addToast,
}) {
  return (
    <>
      <SectionHead icon="⚙️" sub="administração" title="Painel de Controle" />

      <div style={{ display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${C.gray200}`,paddingBottom:8,flexWrap:"wrap" }}>
        {[["users","👥 Usuários"],["shirts","🏷️ Anúncios"],["boosts","⚡ Boosts"],["banners","🖼️ Banners"],["questions","❓ Perguntas"],["emails","📧 E-mails"]].map(([v,l])=>(
          <button key={v} onClick={()=>{ setAdminTab(v); if(v==="questions") loadAdminQuestions(); if(v==="emails") loadAdminNotifs(); }}
            style={{ padding:"7px 16px",borderRadius:8,border:"none",background:adminTab===v?C.greenLight:"none",color:adminTab===v?C.green:C.gray600,fontWeight:adminTab===v?600:400,cursor:"pointer",fontSize:13 }}>{l}</button>
        ))}
      </div>

      {/* Tab: Usuários */}
      {adminTab==="users"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {sellers.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Carregando usuários...</p>}
          {sellers.map(sv=>{
            const count = shirts.filter(sh=>sh.seller_id===sv.id).length;
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
                  <button onClick={()=>handleToggleBlock(sv)}
                    style={{ flexShrink:0,padding:"6px 13px",borderRadius:8,border:`1px solid ${sv.blocked?C.green:C.red}`,background:"none",color:sv.blocked?C.green:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>
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
          {shirts.length===0&&<p style={{ color:C.gray400,fontSize:14 }}>Nenhum anúncio cadastrado.</p>}
          {shirts.map(sh=>{
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
                <button onClick={()=>handleDeleteShirt(sh.id)}
                  style={{ flexShrink:0,padding:"6px 10px",borderRadius:8,border:`1px solid ${C.red}`,background:C.redLight,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>🗑️ Excluir</button>
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
                {/* Preview */}
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
                          onChange={e=>{ const v=e.target.value; if(isUrl(v)) setField("img",buildImgField(v,cur.position,cur.size)); else setField("img",v); }}
                          placeholder="https://... ou emoji 🏆"
                          style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:13,boxSizing:"border-box" }}
                        />
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
                            <div>
                              <p style={{ margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.gray900 }}>Modo de exibição</p>
                              <div style={{ display:"flex",gap:8 }}>
                                <button onClick={()=>setField("img",buildImgField(cur.url,cur.position,"cover"))}
                                  style={{ flex:1,padding:"7px 10px",borderRadius:8,border:`2px solid ${cur.size==="cover"?"#14532d":C.gray200}`,background:cur.size==="cover"?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",lineHeight:1.5 }}>
                                  <span style={{ display:"block",fontWeight:700 }}>Cobrir {cur.size==="cover"&&"✓"}</span>
                                  <span style={{ fontWeight:400,color:C.gray400 }}>Preenche o banner; pode cortar bordas.</span>
                                </button>
                                <button onClick={()=>setField("img",buildImgField(cur.url,cur.position,"contain"))}
                                  style={{ flex:1,padding:"7px 10px",borderRadius:8,border:`2px solid ${cur.size==="contain"?"#14532d":C.gray200}`,background:cur.size==="contain"?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",lineHeight:1.5 }}>
                                  <span style={{ display:"block",fontWeight:700 }}>Conter {cur.size==="contain"&&"✓"}</span>
                                  <span style={{ fontWeight:400,color:C.gray400 }}>Foto inteira; pode sobrar espaço.</span>
                                </button>
                              </div>
                            </div>
                            <div>
                              <p style={{ margin:"0 0 2px",fontSize:11,fontWeight:700,color:C.gray900 }}>Ponto de foco</p>
                              <p style={{ margin:"0 0 6px",fontSize:11,color:C.gray400 }}>Clique ou arraste na foto para definir qual área fica centralizada no banner.</p>
                              <div
                                style={{ position:"relative",cursor:"crosshair",borderRadius:8,border:"2px solid #14532d",overflow:"hidden",aspectRatio:"3/1",background:"#000",userSelect:"none" }}
                                onClick={handleFocal}
                                onMouseDown={e=>e.preventDefault()}
                                onMouseMove={e=>{ if(e.buttons===1) handleFocal(e); }}
                              >
                                <img src={cur.url} draggable={false}
                                  style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:`${px}% ${py}%`,display:"block",pointerEvents:"none" }} alt="" />
                                <div style={{ position:"absolute",left:`${px}%`,top:0,bottom:0,width:1,background:"rgba(255,255,255,.3)",pointerEvents:"none" }} />
                                <div style={{ position:"absolute",top:`${py}%`,left:0,right:0,height:1,background:"rgba(255,255,255,.3)",pointerEvents:"none" }} />
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

                  {/* Tema de cor */}
                  <div>
                    <label style={{ fontSize:11,color:C.gray400,display:"block",marginBottom:6 }}>Tema de cor</label>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      {BANNER_THEMES.map(t=>(
                        <button key={t.id} onClick={()=>{ setField("grad",t.grad); setField("accent",t.accent); }}
                          style={{ padding:"5px 11px",borderRadius:8,border:`2px solid ${currentTheme?.id===t.id?"#111":"transparent"}`,background:t.grad,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:currentTheme?.id===t.id?"0 0 0 2px #111 inset":"none" }}>{t.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Destino do botão CTA */}
                  {(()=>{
                    const curLink = edit.link!==undefined ? edit.link : (b.link||"catalog");
                    const { page: dlPage, params: dlParams } = parseDeepLink(curLink);
                    const setDest = (pg, prm={}) => setField("link", buildDeepLink(pg, prm));
                    const updParam = (key, val) => { const np={...dlParams}; if(val) np[key]=val; else delete np[key]; setDest(dlPage,np); };
                    const DEST_BTNS = [["catalog","🗂 Catálogo"],["sellers","👥 Vendedores"],["home","🏠 Home"],["addProduct","➕ Anunciar"]];
                    const isCatalog = dlPage==="catalog";
                    const btnActive = (val) => dlPage===val && !isUrl(curLink);
                    const lErr = hasFieldErr("link");
                    return (
                      <div style={{ padding:lErr?"10px":0,borderRadius:lErr?9:0,border:lErr?"2px solid #ef4444":"none",background:lErr?"#fef2f2":"transparent" }}>
                        <label style={{ fontSize:11,color:lErr?"#b91c1c":C.gray400,display:"block",marginBottom:6 }}>
                          Destino do botão "{edit.cta||b.cta}"{lErr&&<span style={{ marginLeft:6,fontSize:10,fontWeight:700,color:"#ef4444" }}>⚠ coluna não existe no banco</span>}
                        </label>
                        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
                          {DEST_BTNS.map(([val,label])=>(
                            <button key={val} onClick={()=>setDest(val)}
                              style={{ padding:"5px 11px",borderRadius:8,border:`2px solid ${btnActive(val)?"#14532d":C.gray200}`,background:btnActive(val)?"#dcfce7":"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {isCatalog&&(
                          <div style={{ background:"#f0fdf4",borderRadius:10,border:"1px solid #d1fae5",padding:"10px 12px",display:"flex",flexDirection:"column",gap:9 }}>
                            <p style={{ margin:0,fontSize:11,fontWeight:700,color:"#166534" }}>Filtros do catálogo (opcional)</p>
                            <div>
                              <label style={{ fontSize:10,color:"#166534",display:"block",marginBottom:3 }}>Busca — time, edição, país, ano</label>
                              <input value={dlParams.search||""} onChange={e=>updParam("search",e.target.value)}
                                placeholder="Ex: Palmeiras, Barcelona, Brasil 2025..."
                                style={{ width:"100%",padding:"6px 10px",border:"1px solid #d1fae5",borderRadius:7,fontSize:12,boxSizing:"border-box",background:"#fff" }} />
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
                        {!isCatalog&&(
                          <div>
                            <input value={curLink} onChange={e=>setField("link",e.target.value)}
                              placeholder="sellers · home · item-{uuid} · https://..."
                              style={{ width:"100%",padding:"7px 10px",border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:12,boxSizing:"border-box" }} />
                            <p style={{ margin:"3px 0 0",fontSize:10,color:C.gray400 }}>Produto específico: <strong>item-{"{uuid}"}</strong> — copie o ID na página do produto (admin)</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Visibilidade */}
                  {(()=>{
                    const isVisible = edit.visible!==undefined ? edit.visible : b.visible!==false;
                    const vErr = hasFieldErr("visible");
                    return (
                      <div style={{ outline:vErr?"2px solid #ef4444":"none",outlineOffset:2,borderRadius:10 }}>
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

                  {/* Erro/migração */}
                  {bannerErrors[b.id]&&(()=>{
                    const bErr = bannerErrors[b.id];
                    return (
                      <div style={{ padding:"12px 14px",background:bErr.partialSave?"#fffbeb":"#fef2f2",borderRadius:10,border:`2px solid ${bErr.partialSave?"#f59e0b":"#ef4444"}` }}>
                        <p style={{ margin:"0 0 4px",fontSize:12,fontWeight:700,color:bErr.partialSave?"#92400e":"#991b1b" }}>
                          {bErr.partialSave?"⚠ Campos básicos salvos — migração pendente":"❌ Erro ao salvar o banner"}
                        </p>
                        {bErr.partialSave
                          ? <p style={{ margin:"0 0 8px",fontSize:11,color:"#92400e",lineHeight:1.5 }}>Título, imagem e tema foram salvos. As colunas <strong>visible</strong> e <strong>link</strong> ainda não existem no banco — execute a migração abaixo para ativar Visibilidade e Destino.</p>
                          : <p style={{ margin:"0 0 8px",fontSize:11,color:"#b91c1c",fontFamily:"monospace",lineHeight:1.6,wordBreak:"break-all",background:"#fff",padding:"6px 9px",borderRadius:6,border:"1px solid #fecaca" }}>{bErr.message}</p>
                        }
                        {bErr.needsMigration&&(
                          <>
                            <p style={{ margin:"0 0 4px",fontSize:11,fontWeight:600,color:bErr.partialSave?"#92400e":"#991b1b" }}>Execute no Supabase → SQL Editor:</p>
                            <pre style={{ margin:0,padding:"8px 10px",background:"#1e1e2e",color:"#a6e3a1",borderRadius:7,fontSize:11,overflowX:"auto",lineHeight:1.7,userSelect:"all" }}>{`ALTER TABLE banners ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;\nALTER TABLE banners ADD COLUMN IF NOT EXISTS link text DEFAULT 'catalog';`}</pre>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <button onClick={()=>handleSaveBanner(b.id)} disabled={bannerSaving===b.id}
                    style={{ padding:"9px 0",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:13,cursor:"pointer",opacity:bannerSaving===b.id?.7:1 }}>
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
            <div key={n.id} style={{ background:n.sent_at?C.greenLight:n.error_msg?C.redLight:C.white,border:`1px solid ${n.sent_at?C.green:n.error_msg?C.red:C.gray200}`,borderRadius:10,padding:"10px 14px" }}>
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
    </>
  );
}
