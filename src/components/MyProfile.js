import { C, isBoosted } from "./constants";
import { Avatar, Tag, ShirtPhoto, maskPhone, CityStatePicker } from "./ui";

export default function MyProfile({
  user, profile, profileForm, setProfileForm, profileSaving, profileSaved,
  myProfileTab, setMyProfileTab, shirts, isMobile,
  handleSaveProfile, handleAvatarUpload, handleLogout,
  openSeller, openPublicPortfolio,
  startEditShirt, handleToggleShirtStatus, setBoostModal,
  navigate, setForm, setFormStep, setFormDone, setEditingShirtId, setPage, emptyForm,
}) {
  const myShirts = shirts.filter(s => s.seller_id === user?.id);
  const emailVerified = !!user?.email_confirmed_at;

  return (
    <>
      <h2 style={{ margin:"0 0 1rem",fontWeight:700,fontSize:18 }}>Meu Perfil</h2>

      {!emailVerified&&(
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,marginBottom:16 }}>
          <span style={{ fontSize:20,flexShrink:0 }}>📧</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 2px",fontWeight:600,fontSize:14,color:"#92400e" }}>Verifique seu email</p>
            <p style={{ margin:0,fontSize:13,color:"#b45309" }}>Confirme o email <b>{user.email}</b> para poder anunciar camisetas.</p>
          </div>
        </div>
      )}

      <div style={{ display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${C.gray200}`,paddingBottom:8 }}>
        {[["dados","👤 Dados"],["anuncios",`🏷️ Anúncios (${myShirts.length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setMyProfileTab(v)} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:myProfileTab===v?C.greenLight:"none",color:myProfileTab===v?C.green:C.gray600,fontWeight:myProfileTab===v?600:400,cursor:"pointer",fontSize:13 }}>{l}</button>
        ))}
      </div>

      {myProfileTab==="dados"&&<>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:24 }}>
          <label style={{ position:"relative",cursor:"pointer",display:"inline-block" }}>
            <Avatar name={profileForm.name||profile?.name||"?"} size={72} src={profile?.avatar_url} />
            <span style={{ position:"absolute",bottom:2,right:2,width:22,height:22,background:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.white,border:`2px solid ${C.white}`,pointerEvents:"none" }}>📷</span>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:"none" }} />
          </label>
          <p style={{ margin:0,fontSize:12,color:C.gray400 }}>{user.email}</p>
          <p style={{ margin:0,fontSize:11,color:C.gray400 }}>Toque na foto para alterar</p>
        </div>

        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,padding:"1.5rem",display:"flex",flexDirection:"column",gap:14 }}>
          {[["Nome completo","name","text"],["WhatsApp / Telefone","phone","tel"]].map(([l,k,t])=>(
            <div key={k}>
              <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
              <input type={t} value={profileForm[k]}
                onChange={e=>setProfileForm(f=>({...f,[k]:k==="phone"?maskPhone(e.target.value):e.target.value}))}
                placeholder={k==="phone"?"(11) 99999-9999":""}
                maxLength={k==="phone"?15:undefined}
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
            </div>
          ))}
          <CityStatePicker
            stateVal={profileForm.state} cityVal={profileForm.city}
            onStateChange={v=>setProfileForm(f=>({...f,state:v}))}
            onCityChange={v=>setProfileForm(f=>({...f,city:v}))}
          />
          <div>
            <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Bio / Sobre você</label>
            <textarea value={profileForm.bio} onChange={e=>setProfileForm(f=>({...f,bio:e.target.value}))} rows={3}
              placeholder="Conte um pouco sobre você como colecionador..."
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} />
          </div>
          <div>
            <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>@ Username — URL do portfólio público</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:14,fontWeight:600 }}>@</span>
              <input value={profileForm.username}
                onChange={e=>setProfileForm(f=>({...f,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}))}
                placeholder="meu_usuario" maxLength={20}
                style={{ width:"100%",padding:"9px 12px 9px 28px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
            </div>
            {profileForm.username.length>=3&&(
              <p style={{ margin:"4px 0 0",fontSize:11,color:C.gray400 }}>
                Link: <span style={{ color:C.blue,cursor:"pointer" }} onClick={()=>openPublicPortfolio(profileForm.username)}>
                  #portfolio-{profileForm.username}
                </span>
              </p>
            )}
            <p style={{ margin:"3px 0 0",fontSize:11,color:C.gray400 }}>Mínimo 3 caracteres · só letras, números e _</p>
          </div>

          {profileSaved&&<p style={{ margin:0,padding:"8px 12px",background:C.greenLight,color:C.greenDark,borderRadius:8,fontSize:13 }}>✅ Perfil atualizado com sucesso!</p>}

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={handleSaveProfile} disabled={profileSaving}
              style={{ flex:2,padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600,opacity:profileSaving?.7:1 }}>
              {profileSaving?"Salvando...":"Salvar alterações"}
            </button>
            <button onClick={()=>openSeller(user.id)}
              style={{ flex:1,padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:13,color:C.gray600 }}>
              Ver público
            </button>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ width:"100%",marginTop:12,padding:"11px 0",border:`1px solid ${C.red}`,borderRadius:12,background:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,color:C.red }}>
          Sair da conta
        </button>
      </>}

      {myProfileTab==="anuncios"&&<>
        <button onClick={()=>{ setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); setPage("addProduct"); }}
          style={{ width:"100%",padding:"11px 0",border:"none",borderRadius:12,background:C.green,color:C.white,cursor:"pointer",fontSize:14,fontWeight:600,marginBottom:16 }}>
          + Novo anúncio
        </button>
        {myShirts.length===0 ? (
          <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
            <div style={{ fontSize:52,marginBottom:14 }}>🏷️</div>
            <h3 style={{ margin:"0 0 8px",fontWeight:700,fontSize:17 }}>Você ainda não tem anúncios</h3>
            <p style={{ margin:"0 0 18px",fontSize:14,color:"#9ca3af" }}>Publique sua primeira camiseta e comece a vender!</p>
            <button onClick={()=>{ setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); setPage("addProduct"); }}
              style={{ padding:"10px 26px",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>
              + Criar primeiro anúncio
            </button>
          </div>
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
                  <button onClick={()=>handleToggleShirtStatus(sh.id, sh.status)}
                    style={{ padding:"6px 10px",background:sh.status==="vendido"?C.greenLight:C.amberLight,border:`1px solid ${sh.status==="vendido"?C.green:C.amber}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,color:sh.status==="vendido"?C.greenDark:C.amber }}>
                    {sh.status==="vendido"?"↩ Reativar":"✓ Vendido"}
                  </button>
                  {isBoosted(sh)
                    ? <span style={{ padding:"6px 10px",background:"linear-gradient(90deg,#fef3c7,#fde68a)",border:`1px solid ${C.amber}`,borderRadius:8,fontSize:11,fontWeight:600,color:"#92400e",textAlign:"center" }}>⚡ Ativo até {new Date(sh.boosted_until).toLocaleDateString("pt-BR")}</span>
                    : sh.boost_requested_at
                      ? <span style={{ padding:"6px 10px",background:C.blueLight,border:`1px solid ${C.blue}`,borderRadius:8,fontSize:11,fontWeight:500,color:C.blue,textAlign:"center" }}>⏳ Aguardando</span>
                      : <button onClick={()=>setBoostModal(sh)} style={{ padding:"6px 10px",background:"linear-gradient(90deg,#f59e0b,#f97316)",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,color:C.white }}>⚡ Impulsionar</button>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </>}
    </>
  );
}
