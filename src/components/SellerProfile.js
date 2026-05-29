import { C, badgeIcon } from "./constants";
import { Avatar, ShirtCard, SectionHead, Spinner, StarPicker, Star } from "./ui";

export default function SellerProfile({
  sellerSlug, sellerProfile, user, profile, shirts, wishlist, toggleWishlist, follows, isMobile,
  sellerReviews, reviewForm, setReviewForm, reviewLoading,
  onBack, openShirt, openSeller, handleToggleFollow, requireAuth, setContactModal,
  startEditShirt, handleDeleteShirt, handleSubmitReview, openDirectMessage,
}) {
  const sellerShirts = shirts.filter(sh => sh.seller_id === sellerSlug);

  return (
    <>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"0.25rem 0 1rem" }}>← Voltar</button>
      {!sellerProfile ? <Spinner /> : <>
        <div style={{ background:`linear-gradient(120deg,${C.greenDark},${C.green})`,borderRadius:18,height:90 }} />
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 4px",marginTop:-32,marginBottom:14 }}>
          <div style={{ border:`3px solid ${C.white}`,borderRadius:"50%" }}>
            <Avatar name={sellerProfile.name} size={64} src={sellerProfile.avatar_url} />
          </div>
          <div style={{ display:"flex",gap:8,marginBottom:4 }}>
            {user?.id !== sellerSlug && (
              <button onClick={()=>handleToggleFollow(sellerSlug)}
                style={{ padding:"6px 14px",border:`1px solid ${follows.includes(sellerSlug)?C.green:C.gray200}`,borderRadius:9,background:follows.includes(sellerSlug)?C.greenLight:C.white,color:follows.includes(sellerSlug)?C.greenDark:C.gray600,cursor:"pointer",fontSize:13,fontWeight:follows.includes(sellerSlug)?600:400 }}>
                {follows.includes(sellerSlug)?"✓ Seguindo":"+ Seguir"}
              </button>
            )}
            {user?.id !== sellerSlug&&(
              <button onClick={()=>openDirectMessage(sellerSlug)}
                style={{ padding:"6px 14px",border:"none",borderRadius:9,background:C.green,color:C.white,cursor:"pointer",fontSize:13,fontWeight:600 }}>
                💬 Entrar em contato
              </button>
            )}
          </div>
        </div>
        <h2 style={{ margin:"0 0 2px",fontWeight:700,fontSize:20 }}>{sellerProfile.name}</h2>
        <p style={{ margin:"0 0 8px",color:C.gray400,fontSize:13 }}>📍 {sellerProfile.location||"—"}</p>
        <p style={{ margin:"0 0 14px",fontSize:14,color:C.gray600,lineHeight:1.6 }}>{sellerProfile.bio||""}</p>
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14 }}>
          {[["Vendas",sellerProfile.sales||0],["Seguidores",sellerProfile.followers||0],["Avaliação",`${Number(sellerProfile.rating||5).toFixed(1)} ★`],["Desde",sellerProfile.created_at?new Date(sellerProfile.created_at).toLocaleDateString("pt-BR",{month:"short",year:"numeric"}):sellerProfile.joined||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"0.7rem",textAlign:"center" }}>
              <p style={{ margin:0,fontSize:18,fontWeight:700 }}>{v}</p>
              <p style={{ margin:"2px 0 0",fontSize:11,color:C.gray400 }}>{l}</p>
            </div>
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
              <ShirtCard s={sh} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />
              {sellerSlug===user?.id&&(
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={()=>startEditShirt(sh)} style={{ flex:1,padding:"6px 0",background:C.white,border:`1px solid ${C.gray200}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.gray600 }}>✏️ Editar</button>
                  <button onClick={()=>handleDeleteShirt(sh.id)} style={{ padding:"6px 10px",background:C.redLight,border:`1px solid ${C.red}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:C.red }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reviews */}
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
              <button onClick={()=>handleSubmitReview(sellerSlug)} disabled={reviewLoading}
                style={{ marginTop:10,padding:"9px 20px",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:13,cursor:"pointer",opacity:reviewLoading?.7:1 }}>
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
    </>
  );
}
