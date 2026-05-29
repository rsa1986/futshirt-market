import { C, BR_CLUBS, BR_STATES } from "./constants";
import { ShirtPhoto, Tag } from "./ui";
import PhotoUploader from "./PhotoUploader";

export default function AddShirtForm({
  user, form, setForm, formStep, setFormStep, formDone, formErrors, setFormErrors,
  formSaving, editingShirtId, isMobile, emptyForm,
  onBack, onNext, handleAddShirt,
}) {
  const isBrasil = form.type === "times" && form.region === "nacional";
  const clubList = isBrasil && form.club_state ? (BR_CLUBS[form.club_state] || []) : [];
  const isOtros = form.team === "__outros__";

  function validateStep1() {
    const errs = {};
    if(!form.type)   errs.type   = "Selecione a categoria";
    if(!form.region) errs.region = form.type==="selecoes" ? "Selecione o continente" : "Selecione a região";
    if(isBrasil && !form.club_state) errs.club_state = "Selecione o estado";
    if(!form.team.trim() || form.team === "__outros__") errs.team = "Informe o nome do time";
    if(!form.price||parseFloat(form.price)<=0) errs.price = "Informe um preço válido";
    if(!form.condition) errs.condition = "Selecione a condição";
    if(!form.size)      errs.size      = "Selecione o tamanho";
    const yr = parseInt(form.year);
    if(form.year&&(yr<1900||yr>new Date().getFullYear()+1)) errs.year = "Ano inválido";
    if(form.price_old&&parseFloat(form.price_old)<=parseFloat(form.price||0)) errs.price_old = "Deve ser maior que o preço atual";
    setFormErrors(errs);
    return Object.keys(errs).length===0;
  }

  if(user && !user.email_confirmed_at) return (
    <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
      <div style={{ fontSize:56,marginBottom:14 }}>📧</div>
      <h3 style={{ margin:"0 0 8px",fontWeight:700,fontSize:18,color:C.gray900 }}>Verifique seu email</h3>
      <p style={{ margin:"0 0 20px",fontSize:14,color:C.gray400,lineHeight:1.6,maxWidth:300,marginLeft:"auto",marginRight:"auto" }}>
        Para anunciar camisetas é necessário confirmar seu email. Verifique sua caixa de entrada e clique no link de confirmação.
      </p>
    </div>
  );

  if(formDone) return (
    <div style={{ textAlign:"center",padding:"3rem 1rem" }}>
      <div style={{ fontSize:56,marginBottom:12 }}>🎉</div>
      <h2 style={{ fontWeight:700 }}>{editingShirtId?"Anúncio atualizado!":"Anúncio publicado!"}</h2>
      <p style={{ color:C.gray400 }}>Sua camiseta já está visível no catálogo.</p>
      <button onClick={onBack} style={{ marginTop:12,padding:"10px 24px",background:C.green,color:C.white,border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600 }}>Ver catálogo →</button>
    </div>
  );

  return (
    <>
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0.5rem 0 1.5rem" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer" }}>←</button>
        <h2 style={{ margin:0,fontWeight:700,fontSize:18 }}>{editingShirtId?"Editar camiseta":"Cadastrar camiseta"}</h2>
      </div>
      <div style={{ display:"flex",gap:6,marginBottom:6 }}>{[1,2,3].map(n=><div key={n} style={{ flex:1,height:4,borderRadius:4,background:formStep>=n?C.green:C.gray200 }} />)}</div>
      <p style={{ margin:"0 0 1.5rem",fontSize:12,color:C.gray400 }}>Passo {formStep} de 3 — {["","Dados da camiseta","Fotos do produto","Revisão e publicação"][formStep]}</p>

      <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:18,padding:"1.5rem" }}>
        {formStep===1&&<div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12 }}>
          {/* Destino */}
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:6 }}>Destino desta camiseta</label>
            <div style={{ display:"flex",gap:6 }}>
              {[["disponivel","🏷️ Anunciar à venda"],["na_colecao","📚 Só minha coleção"],["para_troca","🔄 Para troca"]].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>setForm(f=>({...f,status:v}))}
                  style={{ flex:1,padding:"8px 6px",borderRadius:9,border:`2px solid ${form.status===v?C.green:C.gray200}`,background:form.status===v?C.greenLight:"#fff",fontSize:isMobile?11:12,fontWeight:form.status===v?700:400,cursor:"pointer",color:form.status===v?C.green:C.gray600 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize:12,color:formErrors.type?C.red:C.gray600,display:"block",marginBottom:4 }}>Categoria *</label>
            <select value={form.type} onChange={e=>{ setForm(f=>({...f,type:e.target.value,region:"",club_state:"",team:"",country:""})); setFormErrors(fe=>({...fe,type:null})); }}
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.type?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
              <option value="">Selecione...</option>
              <option value="times">🏟️ Time</option>
              <option value="selecoes">🌎 Seleção</option>
            </select>
            {formErrors.type&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.type}</p>}
          </div>

          {/* Se Time: Região */}
          {form.type==="times"&&<div>
            <label style={{ fontSize:12,color:formErrors.region?C.red:C.gray600,display:"block",marginBottom:4 }}>Região *</label>
            <select value={form.region} onChange={e=>{ setForm(f=>({...f,region:e.target.value,club_state:"",team:""})); setFormErrors(fe=>({...fe,region:null})); }}
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.region?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
              <option value="">Selecione...</option>
              <option value="nacional">🇧🇷 Nacional (Brasil)</option>
              <option value="europa">🌍 Europa</option>
              <option value="america_sul">🌎 América do Sul</option>
              <option value="america_norte">🌐 América do Norte</option>
              <option value="africa">🌍 África</option>
              <option value="asia">🌏 Ásia</option>
            </select>
            {formErrors.region&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.region}</p>}
          </div>}

          {/* Se Seleção: Continente */}
          {form.type==="selecoes"&&<div>
            <label style={{ fontSize:12,color:formErrors.region?C.red:C.gray600,display:"block",marginBottom:4 }}>Continente *</label>
            <select value={form.region} onChange={e=>{ setForm(f=>({...f,region:e.target.value})); setFormErrors(fe=>({...fe,region:null})); }}
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.region?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
              <option value="">Selecione...</option>
              <option value="america_sul">🌎 América do Sul</option>
              <option value="europa">🌍 Europa</option>
              <option value="africa">🌍 África</option>
              <option value="america_norte">🌐 América do Norte</option>
              <option value="asia">🌏 Ásia</option>
            </select>
            {formErrors.region&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.region}</p>}
          </div>}

          {/* Se Seleção + Continente: Nome da seleção */}
          {form.type==="selecoes"&&form.region&&<div>
            <label style={{ fontSize:12,color:formErrors.team?C.red:C.gray600,display:"block",marginBottom:4 }}>Seleção *</label>
            <input value={form.team} onChange={e=>{ setForm(f=>({...f,team:e.target.value,country:e.target.value})); setFormErrors(fe=>({...fe,team:null})); }}
              placeholder="Ex: Brasil, Argentina, França..."
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.team?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
            {formErrors.team&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.team}</p>}
          </div>}

          {/* Se Time Nacional: Estado do clube */}
          {isBrasil&&<div>
            <label style={{ fontSize:12,color:formErrors.club_state?C.red:C.gray600,display:"block",marginBottom:4 }}>Estado do clube *</label>
            <select value={form.club_state} onChange={e=>{ setForm(f=>({...f,club_state:e.target.value,team:""})); setFormErrors(fe=>({...fe,club_state:null})); }}
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.club_state?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
              <option value="">Selecione...</option>
              {BR_STATES.map(s=><option key={s.sigla} value={s.sigla}>{s.nome} ({s.sigla})</option>)}
            </select>
            {formErrors.club_state&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.club_state}</p>}
          </div>}

          {/* Se Time Nacional + Estado: Nome do clube */}
          {isBrasil&&form.club_state&&<div style={{ gridColumn:isMobile?"auto":"1/-1" }}>
            <label style={{ fontSize:12,color:formErrors.team?C.red:C.gray600,display:"block",marginBottom:4 }}>Clube *</label>
            {clubList.length>0?(
              <select value={isOtros?"__outros__":form.team}
                onChange={e=>{ setForm(f=>({...f,team:e.target.value})); setFormErrors(fe=>({...fe,team:null})); }}
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.team?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
                <option value="">Selecione...</option>
                {clubList.map(c=><option key={c} value={c}>{c}</option>)}
                <option value="__outros__">Outros (digitar manualmente)</option>
              </select>
            ):(
              <input value={form.team} onChange={e=>{ setForm(f=>({...f,team:e.target.value})); setFormErrors(fe=>({...fe,team:null})); }}
                placeholder="Nome do clube..."
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.team?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
            )}
            {formErrors.team&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.team}</p>}
          </div>}

          {/* Campo livre para "Outros" */}
          {isBrasil&&isOtros&&<div style={{ gridColumn:isMobile?"auto":"1/-1" }}>
            <label style={{ fontSize:12,color:formErrors.team?C.red:C.gray600,display:"block",marginBottom:4 }}>Nome do clube *</label>
            <input placeholder="Digite o nome do clube..."
              onChange={e=>{ setForm(f=>({...f,team:e.target.value==="__outros__"?"":e.target.value})); setFormErrors(fe=>({...fe,team:null})); }}
              style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.team?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
          </div>}

          {/* Se Time internacional: País + Nome do time */}
          {form.type==="times"&&form.region&&form.region!=="nacional"&&<>
            <div>
              <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>País</label>
              <input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}
                placeholder="Ex: Espanha, Inglaterra..."
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:12,color:formErrors.team?C.red:C.gray600,display:"block",marginBottom:4 }}>Nome do time *</label>
              <input value={form.team} onChange={e=>{ setForm(f=>({...f,team:e.target.value})); setFormErrors(fe=>({...fe,team:null})); }}
                placeholder="Ex: Real Madrid, Manchester City..."
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors.team?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              {formErrors.team&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors.team}</p>}
            </div>
          </>}

          {/* Campos comuns */}
          {[["Ano","year","number"],["Edição","edition","text"],["Preço (R$) *","price","number"],["Preço original","price_old","number"]].map(([l,k,t])=>(
            <div key={k} style={{ gridColumn:(!isMobile&&k==="price_old")?"1/-1":"auto" }}>
              <label style={{ fontSize:12,color:formErrors[k]?C.red:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
              <input type={t} value={form[k]} onChange={e=>{ setForm(f=>({...f,[k]:e.target.value})); if(formErrors[k]) setFormErrors(fe=>({...fe,[k]:null})); }}
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors[k]?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              {formErrors[k]&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors[k]}</p>}
            </div>
          ))}
          {[
            ["Condição *","condition",[["","Selecione..."],["Nova","Nova"],["Usada","Usada"]]],
            ["Tamanho *","size",[["","Selecione..."],["PP","PP"],["P","P"],["M","M"],["G","G"],["GG","GG"]]],
            ["Tipo (modelo)","model",[["","Selecione..."],["Modelo Jogador","Modelo Jogador"],["Modelo Torcedor","Modelo Torcedor"],["Utilizado em Jogo","Utilizado em Jogo"]]],
          ].map(([l,k,opts])=>(
            <div key={k}>
              <label style={{ fontSize:12,color:formErrors[k]?C.red:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
              <select value={form[k]} onChange={e=>{ setForm(f=>({...f,[k]:e.target.value})); if(formErrors[k]) setFormErrors(fe=>({...fe,[k]:null})); }}
                style={{ width:"100%",padding:"9px 12px",border:`1px solid ${formErrors[k]?C.red:C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }}>
                {opts.map(([v,lbl])=><option key={v} value={v}>{lbl}</option>)}
              </select>
              {formErrors[k]&&<p style={{ margin:"3px 0 0",fontSize:11,color:C.red }}>{formErrors[k]}</p>}
            </div>
          ))}
          <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Descrição</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
          {/* Campos do colecionador */}
          <div style={{ gridColumn:"1/-1",borderTop:`1px solid ${C.gray100}`,paddingTop:14,marginTop:2 }}>
            <p style={{ margin:"0 0 10px",fontSize:11,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:.5 }}>Detalhes do colecionador (opcional)</p>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10 }}>
              <div>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Preço pago (R$)</label>
                <input type="number" value={form.acquisition_price} onChange={e=>setForm(f=>({...f,acquisition_price:e.target.value}))} placeholder="0,00" style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Cor principal</label>
                <input value={form.shirt_color} onChange={e=>setForm(f=>({...f,shirt_color:e.target.value}))} placeholder="Ex: Verde, Branco, Preto" style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Nome do jogador (se tiver)</label>
                <input value={form.player_name} onChange={e=>setForm(f=>({...f,player_name:e.target.value}))} placeholder="Ex: Endrick, Veiga" style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:8 }}>Personalização nas costas</label>
                <div style={{ display:"flex",gap:16 }}>
                  <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14 }}><input type="checkbox" checked={form.has_name} onChange={e=>setForm(f=>({...f,has_name:e.target.checked}))} style={{ width:16,height:16 }} /> Nome</label>
                  <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14 }}><input type="checkbox" checked={form.has_number} onChange={e=>setForm(f=>({...f,has_number:e.target.checked}))} style={{ width:16,height:16 }} /> Número</label>
                </div>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>Notas pessoais</label>
                <input value={form.collection_note} onChange={e=>setForm(f=>({...f,collection_note:e.target.value}))} placeholder="Ex: Comprei no estádio, edição limitada comemorativa..." style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
              </div>
            </div>
          </div>
        </div>}

        {formStep===2&&(
          <div>
            <p style={{ margin:"0 0 1rem",fontSize:14 }}>Adicione até <b>6 fotos</b>. A primeira será a capa do anúncio.</p>
            <PhotoUploader
              userId={user.id}
              photos={form.photos}
              setPhotos={(next)=>setForm(f=>({ ...f, photos: typeof next==="function"?next(f.photos):next }))}
            />
          </div>
        )}

        {formStep===3&&<div>
          <div style={{ display:"flex",gap:14,marginBottom:16,alignItems:"flex-start" }}>
            <div style={{ background:C.gray50,borderRadius:12,overflow:"hidden",width:80,flexShrink:0 }}><ShirtPhoto value={form.photos[0]||"❓"} size={80} /></div>
            <div style={{ flex:1 }}><h3 style={{ margin:"0 0 3px",fontWeight:700,fontSize:16 }}>{form.team||"—"}</h3><p style={{ margin:"0 0 6px",fontSize:13,color:C.gray600 }}>{form.edition} · {form.year} · {form.country}</p><Tag rarity={form.rarity} /></div>
            <div style={{ textAlign:"right" }}><p style={{ margin:0,fontWeight:700,color:C.green,fontSize:20 }}>R$ {parseFloat(form.price||0).toLocaleString("pt-BR")}</p>{form.price_old&&<p style={{ margin:0,fontSize:12,color:C.gray400,textDecoration:"line-through" }}>R$ {parseFloat(form.price_old).toLocaleString("pt-BR")}</p>}</div>
          </div>
          {form.photos.length>0&&(
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
              {form.photos.map((url,i)=>(
                <div key={i} style={{ width:56,height:56,borderRadius:8,overflow:"hidden",border:i===0?"2px solid #16a34a":"1px solid #e5e7eb",position:"relative" }}>
                  <img src={url} alt="" loading="lazy" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                  {i===0&&<span style={{ position:"absolute",bottom:2,left:2,fontSize:8,background:"#16a34a",color:"#fff",borderRadius:3,padding:"1px 4px" }}>capa</span>}
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
    </>
  );
}
