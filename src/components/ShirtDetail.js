import { C, isUrl } from "./constants";
import { Avatar, ShirtCard, SectionHead, Spinner, Star, Tag, ShirtPhoto } from "./ui";

export default function ShirtDetail({
  selectedId, selectedShirt, profile, user, wishlist, available, isMobile,
  photoIdx, setPhotoIdx, setLightbox, shirtQuestions, questionText, setQuestionText,
  questionLoading, answerTexts, setAnswerTexts, answerLoading,
  onBack, openShirt, openSeller, toggleWishlist, handleShare, requireAuth,
  setContactModal, openDirectMessage, handleAskQuestion, handleAnswerQuestion, handleDeleteQuestion,
  setShowAuth, setAuthStep, setAuthError, addToast,
}) {
  return (
    <>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"0.25rem 0 1rem" }}>← Voltar</button>

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
            <div style={{ background:C.gray50,position:"relative",cursor:"zoom-in" }}
              onClick={()=>setLightbox((s.photos||[])[photoIdx]||null)}
            >
              <ShirtPhoto value={(s.photos||[])[photoIdx]||"?"} size={320} />
            </div>
            {(s.photos||[]).length > 1 && (
              <div style={{ display:"flex",justifyContent:"center",gap:8,padding:"10px",borderBottom:`1px solid ${C.gray100}`,flexWrap:"wrap" }}>
                {s.photos.map((p,i)=>(
                  <button key={i} onClick={()=>setPhotoIdx(i)}
                    style={{ width:48,height:48,borderRadius:9,border:i===photoIdx?`2px solid ${C.green}`:`1px solid ${C.gray200}`,background:C.gray50,cursor:"pointer",overflow:"hidden",padding:0 }}>
                    {isUrl(p) ? <img src={p} alt="" loading="lazy" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:20 }}>{p}</span>}
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
                  <div key={l} style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"9px 12px",textAlign:"center" }}>
                    <p style={{ margin:0,fontSize:11,color:C.gray400 }}>{l}</p>
                    <p style={{ margin:"3px 0 0",fontSize:13,fontWeight:600 }}>{v}</p>
                  </div>
                ))}
              </div>
              {sl&&<div onClick={()=>openSeller(s.seller_id)}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:C.gray50,borderRadius:12,cursor:"pointer",marginBottom:14,border:`1px solid ${C.gray200}` }}>
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
                <button onClick={()=>requireAuth(()=>sl&&openDirectMessage(sl.id, s.id))} style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:700 }}>💬 Entrar em contato</button>
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

            {/* Q&A */}
            <div style={{ marginTop:28 }}>
              <SectionHead icon="❓" sub="dúvidas" title={`${shirtQuestions.length} pergunta${shirtQuestions.length!==1?"s":""}`} />

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

              {shirtQuestions.length===0
                ?<p style={{ color:C.gray400,fontSize:14 }}>Nenhuma pergunta ainda. Seja o primeiro!</p>
                :<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {shirtQuestions.map(q=>(
                    <div key={q.id} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:"hidden" }}>
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
                          <button onClick={()=>handleDeleteQuestion(q.id,selectedShirt.id)} title="Remover"
                            style={{ background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:16,padding:"0 0 0 4px",flexShrink:0,lineHeight:1 }}>🗑️</button>
                        )}
                      </div>
                      {q.answer&&(
                        <div style={{ padding:"10px 14px",background:C.greenLight,borderTop:`1px solid ${C.gray200}`,display:"flex",gap:10,alignItems:"flex-start" }}>
                          <span style={{ fontSize:18,flexShrink:0 }}>💬</span>
                          <div>
                            <span style={{ fontWeight:600,fontSize:12,color:C.greenDark }}>Vendedor respondeu</span>
                            <p style={{ margin:"2px 0 0",fontSize:14,color:C.greenDark,lineHeight:1.5 }}>{q.answer}</p>
                          </div>
                        </div>
                      )}
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
    </>
  );
}
