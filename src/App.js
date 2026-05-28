import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  C, emptyForm, isBoosted, hasProfanity, isUrl, parseDeepLink,
  BANNERS_DEFAULT, BOOST_PRICE, BOOST_DAYS,
} from "./components/constants";
import {
  Avatar, useMobile, ShirtCard, FilterBar, BannerCarousel, CategoryTiles,
  TrustBar, Footer, SectionHead, Spinner, SkeletonCard, EmptyState,
  ContactModal, CityStatePicker,
} from "./components/ui";
import PortfolioPage from "./components/PortfolioPage";
import PublicPortfolioPage from "./components/PublicPortfolioPage";
import SellerProfile from "./components/SellerProfile";
import ShirtDetail from "./components/ShirtDetail";
import AddShirtForm from "./components/AddShirtForm";
import MyProfile from "./components/MyProfile";
import AdminPage from "./components/AdminPage";

/* ══ MAIN APP ══ */
export default function App() {
  const [user,setUser]           = useState(null);
  const [profile,setProfile]     = useState(null);
  const [loading,setLoading]     = useState(true);
  const [authStep,setAuthStep]   = useState("login");
  const [authError,setAuthError] = useState("");
  const [authLoading,setAuthLoading] = useState(false);
  const [page,setPage]           = useState("home");
  const [shirts,setShirts]       = useState([]);
  const [shirtsLoading,setShirtsLoading] = useState(true);
  const [wishlist,setWishlist]   = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [following,setFollowing] = useState([]);
  const [selectedId,setSelectedId] = useState(null);
  const [selectedShirt,setSelectedShirt] = useState(null);
  const [sellerSlug,setSellerSlug] = useState(null);
  const [sellerProfile,setSellerProfile] = useState(null);
  const [photoIdx,setPhotoIdx]   = useState(0);
  const [lightbox,setLightbox]   = useState(null);
  const [search,setSearch]       = useState("");
  const [filters,setFilters]     = useState({ sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null });
  const [sortBy,setSortBy]       = useState("relevancia");
  const [formStep,setFormStep]   = useState(1);
  const [formDone,setFormDone]   = useState(false);
  const [formSaving,setFormSaving] = useState(false);
  const [form,setForm]           = useState(emptyForm);
  const [sellers,setSellers]           = useState([]);
  const [sellersLoading,setSellersLoading] = useState(false);
  const [editingShirtId,setEditingShirtId] = useState(null);
  const isMobile = useMobile();
  const [toasts,setToasts]             = useState([]);
  const [contactModal,setContactModal] = useState(null);
  const [profileForm,setProfileForm]   = useState({ name:"",location:"",state:"",city:"",bio:"",phone:"",username:"" });
  const [formErrors,setFormErrors]     = useState({});
  const [profileSaving,setProfileSaving] = useState(false);
  const [profileSaved,setProfileSaved] = useState(false);
  const [reg,setReg]             = useState({ name:"",email:"",password:"",state:"",city:"",bio:"" });
  const [loginData,setLoginData] = useState({ email:"",password:"" });
  const [showLoginPwd,setShowLoginPwd] = useState(false);
  const [showAuth,setShowAuth]         = useState(false);
  const [adminTab,setAdminTab]         = useState("users");
  const [banners,setBanners]           = useState(BANNERS_DEFAULT);
  const [adminBannerEdit,setAdminBannerEdit] = useState({});
  const [bannerSaving,setBannerSaving] = useState(null);
  const [bannerErrors,setBannerErrors] = useState({});
  const [sellerSearch,setSellerSearch] = useState("");
  const [myProfileTab,setMyProfileTab] = useState("dados");
  const [portfolioTab,setPortfolioTab] = useState("todos");
  const [portfolioSearch,setPortfolioSearch] = useState("");
  const [sellerReviews,setSellerReviews] = useState([]);
  const [reviewForm,setReviewForm]     = useState({ rating:5, comment:"" });
  const [reviewLoading,setReviewLoading] = useState(false);
  const [follows,setFollows]           = useState([]);
  const [shirtQuestions,setShirtQuestions] = useState([]);
  const [questionText,setQuestionText] = useState("");
  const [questionLoading,setQuestionLoading] = useState(false);
  const [answerTexts,setAnswerTexts]   = useState({});
  const [answerLoading,setAnswerLoading] = useState(null);
  const [adminQuestions,setAdminQuestions] = useState([]);
  const [adminNotifs,setAdminNotifs]   = useState([]);
  const [boostModal,setBoostModal]     = useState(null);
  const [boostLoading,setBoostLoading] = useState(false);
  const [alertTerms,setAlertTerms]     = useState(()=>{ try{return JSON.parse(localStorage.getItem("fsm_alerts")||"[]");}catch{return [];} });
  const [alertInput,setAlertInput]     = useState("");
  const [publicPortfolioId,setPublicPortfolioId] = useState(null);
  const [publicPortfolioData,setPublicPortfolioData] = useState({ profile:null,shirts:[] });
  const [showNotifs,setShowNotifs]     = useState(false);
  const [notifItems,setNotifItems]     = useState([]);
  const [notifBadge,setNotifBadge]     = useState(0);

  // ── load session ──
  useEffect(()=>{
    supabase.auth.getSession().then(({ data:{ session } })=>{
      setUser(session?.user||null);
      if(session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user||null);
      if(session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return ()=>subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(user) loadNotifications(); },[user]);

  useEffect(()=>{ loadShirts(); loadBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(adminTab==="banners"&&banners.length>0){
      const init = {};
      banners.forEach(b=>{ init[b.id]={ label:b.label,title:b.title,sub:b.sub,cta:b.cta,img:b.img,grad:b.grad,accent:b.accent }; });
      setAdminBannerEdit(init);
    }
  },[adminTab,banners]);

  useEffect(()=>{
    if(page==="sellers"||page==="admin") loadSellers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[page]);

  useEffect(()=>{
    if(!user&&!loading&&["addProduct","myProfile","wishlist","admin","portfolio"].includes(page)){
      setPage("home");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user,loading]);

  useEffect(()=>{
    const hash = window.location.hash.slice(1);
    if(hash.startsWith("seller-"))         openSeller(hash.replace("seller-",""));
    else if(hash.startsWith("item-"))      openShirt(hash.replace("item-",""));
    else if(hash.startsWith("portfolio-")) openPublicPortfolio(hash.replace("portfolio-",""));
    else if(["catalog","sellers","wishlist"].includes(hash)) setPage(hash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    const handlePop = () => {
      const hash = window.location.hash.slice(1);
      if(hash.startsWith("seller-")){
        setSelectedId(null); setSelectedShirt(null);
        openSeller(hash.replace("seller-",""));
      } else if(hash.startsWith("item-")){
        setSellerSlug(null); setSellerProfile(null);
        openShirt(hash.replace("item-",""));
      } else if(hash.startsWith("portfolio-")){
        openPublicPortfolio(hash.replace("portfolio-",""));
      } else {
        setSellerSlug(null); setSellerProfile(null);
        setSelectedId(null); setSelectedShirt(null);
        setPage(hash||"home");
      }
    };
    window.addEventListener("popstate",handlePop);
    return ()=>window.removeEventListener("popstate",handlePop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(page==="myProfile"&&profile){
      setProfileForm({ name:profile.name||"",location:profile.location||"",state:profile.state||"",city:profile.city||"",bio:profile.bio||"",phone:profile.phone||"",username:profile.username||"" });
      setProfileSaved(false);
    }
  },[page,profile]);

  /* ── DATA LOADERS ── */
  async function loadShirts() {
    setShirtsLoading(true);
    const { data } = await supabase.from("shirts").select("*, profiles(name, rating, blocked, state)").order("created_at",{ ascending:false });
    setShirts(data||[]);
    setShirtsLoading(false);
  }
  async function loadSellers() {
    setSellersLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("name",{ ascending:true });
    setSellers(data||[]);
    setSellersLoading(false);
  }
  async function loadBanners() {
    const { data } = await supabase.from("banners").select("*").order("order_index",{ ascending:true });
    if(data&&data.length>0) setBanners(data);
  }
  async function loadWishlist(uid) {
    const { data } = await supabase.from("wishlist").select("shirt_id").eq("user_id",uid);
    setWishlist((data||[]).map(r=>r.shirt_id));
  }
  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(data);
    loadWishlist(uid);
    loadFollows(uid);
    setLoading(false);
  }
  async function loadReviews(sellerId) {
    const { data } = await supabase.from("reviews").select("*, reviewer:profiles!reviewer_id(name, avatar_url)").eq("seller_id",sellerId).order("created_at",{ ascending:false });
    setSellerReviews(data||[]);
  }
  async function loadFollows(uid) {
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id",uid);
    setFollows((data||[]).map(r=>r.following_id));
  }
  async function loadAdminNotifs() {
    const { data } = await supabase.from("email_notifications").select("*").order("created_at",{ ascending:false }).limit(100);
    setAdminNotifs(data||[]);
  }
  async function loadAdminQuestions() {
    const { data } = await supabase.from("questions").select("*, asker:profiles!asker_id(name), shirt:shirts(team,edition)").order("created_at",{ ascending:false }).limit(100);
    setAdminQuestions(data||[]);
  }
  async function loadQuestions(shirtId) {
    const { data } = await supabase.from("questions").select("*, asker:profiles!asker_id(name,avatar_url)").eq("shirt_id",shirtId).order("created_at",{ ascending:true });
    setShirtQuestions(data||[]);
  }
  async function loadNotifications() {
    const lastSeen = parseInt(localStorage.getItem("fsm_notifs_seen")||"0");
    const since = new Date(lastSeen).toISOString();
    const [{ data:newQ },{ data:answeredQ }] = await Promise.all([
      supabase.from("questions").select("id, created_at, question, shirt:shirts(id,team,edition), asker:profiles!asker_id(name)").eq("seller_id",user.id).gt("created_at",since).order("created_at",{ascending:false}).limit(20),
      supabase.from("questions").select("id, answered_at, question, answer, shirt:shirts(id,team,edition)").eq("asker_id",user.id).not("answer","is",null).gt("answered_at",since).order("answered_at",{ascending:false}).limit(20),
    ]);
    const items = [
      ...(newQ||[]).map(q=>({ type:"new_question",id:q.id,date:q.created_at,text:`${q.asker?.name||"Alguém"} perguntou sobre ${q.shirt?.team||"seu anúncio"}`,sub:q.question,shirtId:q.shirt?.id })),
      ...(answeredQ||[]).map(q=>({ type:"answered",id:q.id,date:q.answered_at,text:`Sua pergunta sobre ${q.shirt?.team||"um anúncio"} foi respondida`,sub:q.answer,shirtId:q.shirt?.id })),
    ].sort((a,b)=>new Date(b.date)-new Date(a.date));
    setNotifItems(items);
    setNotifBadge(items.length);
  }

  /* ── AUTH ── */
  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email:loginData.email,password:loginData.password });
    if(error) setAuthError("Email ou senha incorretos.");
    else setShowAuth(false);
    setAuthLoading(false);
  }
  async function handleRegister() {
    setAuthLoading(true); setAuthError("");
    if(reg.name.trim().length<2){ setAuthError("Nome deve ter pelo menos 2 caracteres."); setAuthLoading(false); return; }
    if(!/\S+@\S+\.\S+/.test(reg.email)){ setAuthError("Informe um email válido."); setAuthLoading(false); return; }
    if(reg.password.length<6){ setAuthError("Senha deve ter pelo menos 6 caracteres."); setAuthLoading(false); return; }
    const { error } = await supabase.auth.signUp({ email:reg.email,password:reg.password,options:{ data:{ full_name:reg.name } } });
    if(error) setAuthError(error.message);
    else {
      const { data:{ session } } = await supabase.auth.getSession();
      if(session) await supabase.from("profiles").update({ state:reg.state,city:reg.city,location:[reg.city,reg.state].filter(Boolean).join(", ")||null,bio:reg.bio }).eq("id",session.user.id);
      setAuthError("✅ Conta criada! Verifique seu email para confirmar.");
    }
    setAuthLoading(false);
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    setPage("home");
  }

  /* ── WISHLIST / FOLLOW ── */
  async function toggleWishlist(shirtId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    if(wishlist.includes(shirtId)) {
      setWishlist(w=>w.filter(x=>x!==shirtId));
      await supabase.from("wishlist").delete().eq("user_id",user.id).eq("shirt_id",shirtId);
      addToast("Removido dos favoritos","info");
    } else {
      setWishlist(w=>[...w,shirtId]);
      await supabase.from("wishlist").insert({ user_id:user.id,shirt_id:shirtId });
      addToast("♥ Adicionado aos favoritos");
    }
  }
  async function handleToggleFollow(sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    const isFollowing = follows.includes(sellerId);
    if(isFollowing){
      setFollows(f=>f.filter(id=>id!==sellerId));
      setSellerProfile(p=>p?{...p,followers:Math.max(0,(p.followers||1)-1)}:p);
      await supabase.from("follows").delete().eq("follower_id",user.id).eq("following_id",sellerId);
      await supabase.from("profiles").update({ followers:Math.max(0,(sellerProfile?.followers||1)-1) }).eq("id",sellerId);
    } else {
      setFollows(f=>[...f,sellerId]);
      setSellerProfile(p=>p?{...p,followers:(p.followers||0)+1}:p);
      await supabase.from("follows").insert({ follower_id:user.id,following_id:sellerId });
      await supabase.from("profiles").update({ followers:(sellerProfile?.followers||0)+1 }).eq("id",sellerId);
    }
    addToast(isFollowing?"Deixou de seguir":"Seguindo! ✓",isFollowing?"info":"success");
  }

  /* ── SHIRTS ── */
  async function handleAddShirt() {
    setFormSaving(true);
    if(!editingShirtId) {
      const myShirts = shirts.filter(s=>s.seller_id===user.id);
      const dup = myShirts.find(s=>s.team.toLowerCase().trim()===form.team.toLowerCase().trim()&&String(s.year)===String(form.year)&&s.size===form.size);
      if(dup){ const ok=window.confirm(`Você já tem "${dup.team}${dup.year?" "+dup.year:""} (${dup.size})" na sua coleção.\n\nAdicionar mesmo assim?`); if(!ok){ setFormSaving(false); return; } }
    }
    const payload = {
      team:form.team,country:form.country,year:parseInt(form.year)||2024,edition:form.edition,condition:form.condition,
      price:parseFloat(form.price)||0,price_old:parseFloat(form.price_old)||null,size:form.size,model:form.model||null,
      type:form.type,region:form.region,description:form.description,photos:form.photos,status:form.status||"disponivel",
      acquisition_price:parseFloat(form.acquisition_price)||null,has_name:form.has_name||false,has_number:form.has_number||false,
      player_name:form.player_name||null,shirt_color:form.shirt_color||null,collection_note:form.collection_note||null,
    };
    const { error } = editingShirtId
      ? await supabase.from("shirts").update(payload).eq("id",editingShirtId)
      : await supabase.from("shirts").insert({ ...payload,seller_id:user.id,featured:false });
    if(!error){ await loadShirts(); setFormDone(true); addToast(editingShirtId?"Anúncio atualizado!":"Anúncio publicado! 🎉"); }
    else { alert("Erro ao salvar: "+error.message); addToast("Erro ao salvar anúncio","error"); }
    setFormSaving(false);
  }
  function startEditShirt(shirt) {
    setForm({
      team:shirt.team||"",country:shirt.country||"",year:shirt.year||"",edition:shirt.edition||"",
      condition:shirt.condition||"Nova",price:shirt.price||"",price_old:shirt.price_old||"",
      size:shirt.size||"M",model:shirt.model||"",type:shirt.type||"times",region:shirt.region||"nacional",
      description:shirt.description||"",photos:shirt.photos||[],status:shirt.status||"disponivel",
      acquisition_price:shirt.acquisition_price||"",has_name:shirt.has_name||false,has_number:shirt.has_number||false,
      player_name:shirt.player_name||"",shirt_color:shirt.shirt_color||"",collection_note:shirt.collection_note||"",
    });
    setEditingShirtId(shirt.id); setFormStep(1); setFormDone(false); setFormErrors({}); setPage("addProduct");
  }
  async function handleDeleteShirt(shirtId) {
    if(!window.confirm("Excluir este anúncio? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("shirts").delete().eq("id",shirtId);
    if(!error){ await loadShirts(); addToast("Anúncio excluído com sucesso"); }
    else addToast("Erro ao excluir anúncio","error");
  }
  async function handleToggleShirtStatus(shirtId,currentStatus) {
    const newStatus = currentStatus==="vendido"?"disponivel":"vendido";
    const { error } = await supabase.from("shirts").update({ status:newStatus }).eq("id",shirtId);
    if(!error){ setShirts(ss=>ss.map(s=>s.id===shirtId?{...s,status:newStatus}:s)); addToast(newStatus==="vendido"?"Marcado como vendido ✓":"Reativado no catálogo ✓"); }
    else addToast("Erro ao atualizar status","error");
  }
  async function handleToggleBlock(seller) {
    const newBlocked = !seller.blocked;
    const { error } = await supabase.from("profiles").update({ blocked:newBlocked }).eq("id",seller.id);
    if(!error){ setSellers(ss=>ss.map(s=>s.id===seller.id?{...s,blocked:newBlocked}:s)); await loadShirts(); addToast(newBlocked?`${seller.name} bloqueado`:`${seller.name} desbloqueado`,newBlocked?"error":"success"); }
    else addToast("Erro ao atualizar usuário","error");
  }

  /* ── PROFILE ── */
  async function handleSaveProfile() {
    setProfileSaving(true);
    const derivedLocation = [profileForm.city,profileForm.state].filter(Boolean).join(", ")||profileForm.location;
    const rawUsername = profileForm.username.trim().toLowerCase().replace(/[^a-z0-9_]/g,"");
    const usernameToSave = rawUsername.length>=3?rawUsername:null;
    const { error } = await supabase.from("profiles").update({ name:profileForm.name,location:derivedLocation,state:profileForm.state,city:profileForm.city,bio:profileForm.bio,phone:profileForm.phone,username:usernameToSave }).eq("id",user.id);
    if(!error){
      setProfile(p=>({ ...p,name:profileForm.name,location:derivedLocation,state:profileForm.state,city:profileForm.city,bio:profileForm.bio,phone:profileForm.phone,username:usernameToSave }));
      setProfileSaved(true); addToast("Perfil atualizado com sucesso!");
    } else if(error.message?.includes("unique")||error.message?.includes("duplicate")){
      addToast("Este @ já está em uso. Escolha outro.","error");
    } else addToast("Erro ao salvar perfil","error");
    setProfileSaving(false);
  }
  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if(!file) return;
    const AVATAR_TYPES = ["image/jpeg","image/png","image/webp"];
    if(!AVATAR_TYPES.includes(file.type)||file.size>5*1024*1024){ addToast("Use JPG, PNG ou WebP · máx. 5MB","error"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error:upErr } = await supabase.storage.from("avatars").upload(path,file,{ upsert:true });
    if(upErr){ addToast("Erro ao enviar foto: "+upErr.message,"error"); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl+"?t="+Date.now();
    await supabase.from("profiles").update({ avatar_url:avatarUrl }).eq("id",user.id);
    setProfile(p=>({ ...p,avatar_url:avatarUrl }));
    addToast("Foto de perfil atualizada!");
    e.target.value="";
  }

  /* ── REVIEWS / QUESTIONS ── */
  async function handleSubmitReview(sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    setReviewLoading(true);
    const { error } = await supabase.from("reviews").upsert({ reviewer_id:user.id,seller_id:sellerId,rating:reviewForm.rating,comment:reviewForm.comment.trim() },{ onConflict:"reviewer_id,seller_id" });
    if(!error){
      await loadReviews(sellerId);
      const { data:allR } = await supabase.from("reviews").select("rating").eq("seller_id",sellerId);
      if(allR?.length){ const avg=Math.round((allR.reduce((s,r)=>s+r.rating,0)/allR.length)*10)/10; await supabase.from("profiles").update({ rating:avg }).eq("id",sellerId); setSellerProfile(p=>p?{...p,rating:avg}:p); }
      addToast("Avaliação enviada! ⭐"); setReviewForm({ rating:5,comment:"" });
    } else addToast("Erro ao enviar avaliação","error");
    setReviewLoading(false);
  }
  async function handleAskQuestion(shirtId,sellerId) {
    if(!user){ setShowAuth(true); setAuthStep("login"); setAuthError(""); return; }
    const text = questionText.trim();
    if(!text) return;
    if(hasProfanity(text)){ addToast("Sua pergunta contém linguagem inadequada.","error"); return; }
    setQuestionLoading(true);
    const { error } = await supabase.from("questions").insert({ shirt_id:shirtId,asker_id:user.id,seller_id:sellerId,question:text });
    if(!error){ await loadQuestions(shirtId); setQuestionText(""); addToast("Pergunta enviada!"); }
    else addToast("Erro ao enviar pergunta","error");
    setQuestionLoading(false);
  }
  async function handleAnswerQuestion(questionId,shirtId) {
    const text = (answerTexts[questionId]||"").trim();
    if(!text) return;
    if(hasProfanity(text)){ addToast("Sua resposta contém linguagem inadequada.","error"); return; }
    setAnswerLoading(questionId);
    const { error } = await supabase.from("questions").update({ answer:text,answered_at:new Date().toISOString() }).eq("id",questionId);
    if(!error){ await loadQuestions(shirtId); setAnswerTexts(t=>({ ...t,[questionId]:"" })); addToast("Resposta publicada!"); }
    else addToast("Erro ao responder","error");
    setAnswerLoading(null);
  }
  async function handleDeleteQuestion(questionId,shirtId) {
    if(!window.confirm("Remover esta pergunta?")) return;
    const { error } = await supabase.from("questions").delete().eq("id",questionId);
    if(!error){ await loadQuestions(shirtId); addToast("Pergunta removida.","info"); }
    else addToast("Erro ao remover pergunta","error");
  }

  /* ── BOOST ── */
  async function handleRequestBoost(shirtId) {
    setBoostLoading(true);
    const { error } = await supabase.from("shirts").update({ boost_requested_at:new Date().toISOString() }).eq("id",shirtId);
    if(!error){ setShirts(ss=>ss.map(s=>s.id===shirtId?{...s,boost_requested_at:new Date().toISOString()}:s)); setBoostModal(null); addToast("Solicitação enviada! Aguarde a confirmação do pagamento."); }
    else addToast("Erro ao solicitar destaque","error");
    setBoostLoading(false);
  }
  async function handleActivateBoost(shirtId) {
    const until = new Date(Date.now()+BOOST_DAYS*24*60*60*1000).toISOString();
    const { error } = await supabase.from("shirts").update({ boosted:true,boosted_until:until,boost_requested_at:null }).eq("id",shirtId);
    if(!error){ await loadShirts(); addToast(`Destaque ativado por ${BOOST_DAYS} dias! ⚡`); }
    else addToast("Erro ao ativar destaque","error");
  }
  async function handleDeactivateBoost(shirtId) {
    const { error } = await supabase.from("shirts").update({ boosted:false,boosted_until:null,boost_requested_at:null }).eq("id",shirtId);
    if(!error){ await loadShirts(); addToast("Destaque removido.","info"); }
    else addToast("Erro ao remover destaque","error");
  }

  /* ── BANNER ── */
  async function handleSaveBanner(id) {
    setBannerSaving(id); setBannerErrors(prev=>({...prev,[id]:null}));
    const edit = adminBannerEdit[id];
    if(!edit||!Object.keys(edit).length){ addToast("Nenhuma alteração detectada.","error"); setBannerSaving(null); return; }
    const NEW_COLS = ["visible","link"];
    const isMissingCol = (msg)=>msg.includes("does not exist")||msg.includes("schema cache");
    const { error } = await supabase.from("banners").update(edit).eq("id",id);
    if(!error){ setBanners(bs=>bs.map(b=>b.id===id?{...b,...edit}:b)); addToast("Banner atualizado!"); setBannerSaving(null); return; }
    const msg = error.message||String(error);
    const missingCols = NEW_COLS.filter(c=>msg.toLowerCase().includes(c));
    const needsMigration = isMissingCol(msg)&&missingCols.length>0;
    if(needsMigration){
      const safeEdit = Object.fromEntries(Object.entries(edit).filter(([k])=>!NEW_COLS.includes(k)));
      if(Object.keys(safeEdit).length){
        const { error:err2 } = await supabase.from("banners").update(safeEdit).eq("id",id);
        if(!err2){ setBanners(bs=>bs.map(b=>b.id===id?{...b,...safeEdit}:b)); addToast("Campos básicos salvos. Execute a migração SQL para ativar Visibilidade e Destino.","error"); setBannerErrors(prev=>({...prev,[id]:{ message:msg,missingCols,needsMigration,partialSave:true }})); setBannerSaving(null); return; }
      }
    }
    const colMatch = msg.match(/column\s+"?(\w+)"?/i);
    setBannerErrors(prev=>({...prev,[id]:{ message:msg,badCol:colMatch?.[1]||null,missingCols,needsMigration }}));
    setBannerSaving(null);
  }

  /* ── MISC ── */
  function addToast(message,type="success") {
    const id = Date.now();
    setToasts(ts=>[...ts,{ id,message,type }]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)),3200);
  }
  async function openShirt(id) {
    window.history.pushState(null,"",`#item-${id}`);
    setSelectedId(id); setPhotoIdx(0); setShirtQuestions([]); setQuestionText(""); setAnswerTexts({});
    const { data } = await supabase.from("shirts").select("*, profiles(*)").eq("id",id).single();
    setSelectedShirt(data); loadQuestions(id);
  }
  async function openSeller(sellerId) {
    window.history.pushState(null,"",`#seller-${sellerId}`);
    const cached = sellers.find(s=>s.id===sellerId)||null;
    setSellerSlug(sellerId); setSellerProfile(cached); setSellerReviews([]); setReviewForm({ rating:5,comment:"" });
    loadReviews(sellerId);
    const { data } = await supabase.from("profiles").select("*").eq("id",sellerId).single();
    if(data) setSellerProfile(data);
  }
  async function openPublicPortfolio(input) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    let userId = input;
    if(!isUUID){ const { data:found } = await supabase.from("profiles").select("id").eq("username",input).single(); if(!found){ addToast("Portfólio não encontrado","error"); return; } userId=found.id; }
    setPublicPortfolioId(userId); setPublicPortfolioData({ profile:null,shirts:[] }); setPage("publicPortfolio");
    const [{ data:prof },{ data:shts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id",userId).single(),
      supabase.from("shirts").select("*").eq("seller_id",userId).neq("status","vendido").order("created_at",{ascending:false}),
    ]);
    const slug = prof?.username||userId;
    window.history.pushState(null,"",`#portfolio-${slug}`);
    setPublicPortfolioData({ profile:prof||null,shirts:shts||[] });
  }
  async function handleShare(shirt) {
    const url = window.location.href;
    const title = `${shirt.team}${shirt.edition?" – "+shirt.edition:""} | FutShirt Market`;
    const text = `Confira esta camiseta: ${shirt.team}${shirt.edition?" "+shirt.edition:""} por R$ ${Number(shirt.price).toLocaleString("pt-BR")}`;
    if(navigator.share){ try{ await navigator.share({ title,text,url }); }catch(e){} }
    else { try{ await navigator.clipboard.writeText(url); addToast("🔗 Link copiado!"); }catch{ addToast("Não foi possível copiar o link","error"); } }
  }
  function saveAlerts(terms) { setAlertTerms(terms); localStorage.setItem("fsm_alerts",JSON.stringify(terms)); }
  function requireAuth(fn) { if(user) fn(); else { setShowAuth(true); setAuthStep("login"); setAuthError(""); } }

  /* ── COMPUTED ── */
  function applyFilters(list) {
    return list.filter(s=>{
      if(s.profiles?.blocked) return false;
      if(s.status==="vendido") return false;
      if(s.status==="na_colecao") return false;
      if(search&&!`${s.team} ${s.edition} ${s.country} ${s.year}`.toLowerCase().includes(search.toLowerCase())) return false;
      if(filters.state     && s.profiles?.state!==filters.state)  return false;
      if(filters.type      && s.type      !==filters.type)         return false;
      if(filters.region    && s.region    !==filters.region)       return false;
      if(filters.condition && s.condition !==filters.condition)    return false;
      if(filters.model     && s.model     !==filters.model)        return false;
      if(filters.size      && s.size      !==filters.size)         return false;
      if(filters.price&&filters.price!=="all"){
        const [mn,mx]=filters.price==="2000+"?[2000,Infinity]:filters.price.split("-").map(Number);
        if(s.price<mn||s.price>mx) return false;
      }
      return true;
    }).sort((a,b)=>{
      const ab=isBoosted(a),bb=isBoosted(b);
      if(ab&&!bb) return -1; if(!ab&&bb) return 1;
      return sortBy==="preco_asc"?a.price-b.price:sortBy==="preco_desc"?b.price-a.price:sortBy==="avaliacao"?(b.rating||0)-(a.rating||0):0;
    });
  }
  const filtered   = applyFilters(shirts);
  const available  = shirts.filter(s=>s.status!=="vendido"&&s.status!=="na_colecao"&&!s.profiles?.blocked);
  const forSale    = available.filter(s=>s.status==="disponivel");
  const promos     = forSale.filter(s=>s.price_old);
  const recent     = forSale.slice(0,6);
  const topRated   = forSale.filter(s=>(s.rating||0)>=4).sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,6);
  const sevenDaysAgo = Date.now()-7*24*60*60*1000;
  const alertMatches = (user&&alertTerms.length) ? shirts.filter(s=>s.status==="disponivel"&&s.seller_id!==user.id&&new Date(s.created_at).getTime()>sevenDaysAgo&&alertTerms.some(t=>`${s.team} ${s.edition||""} ${s.country||""}`.toLowerCase().includes(t.toLowerCase()))) : [];

  /* ── GLOBAL LAYERS ── */
  const toastEl = toasts.length>0&&(
    <div style={{ position:"fixed",top:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:300,pointerEvents:"none" }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:t.type==="error"?C.redLight:t.type==="info"?C.blueLight:C.greenLight,color:t.type==="error"?C.red:t.type==="info"?C.blue:C.greenDark,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.12)",display:"flex",alignItems:"center",gap:8 }}>
          <span>{t.type==="error"?"❌":t.type==="info"?"ℹ️":"✅"}</span>{t.message}
        </div>
      ))}
    </div>
  );

  if(loading) return <div style={{ fontFamily:"system-ui,sans-serif",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;

  const authModal = showAuth&&(
    <div onClick={e=>{ if(e.target===e.currentTarget) setShowAuth(false); }} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto" }}>
      <div style={{ width:"100%",maxWidth:400,position:"relative" }}>
        <button onClick={()=>setShowAuth(false)} style={{ position:"absolute",top:-38,right:0,background:"rgba(255,255,255,.18)",border:"none",color:"#fff",borderRadius:8,padding:"5px 13px",cursor:"pointer",fontSize:13,fontWeight:500 }}>✕ Fechar</button>
        <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:20,padding:"1.75rem" }}>
          {authStep==="login"?<>
            <div style={{ textAlign:"center",marginBottom:"1.25rem" }}>
              <div style={{ width:40,height:40,borderRadius:10,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 8px" }}>⚽</div>
              <h3 style={{ margin:0,fontWeight:700,fontSize:17 }}>Entrar na conta</h3>
            </div>
            {authError&&<p style={{ margin:"0 0 12px",padding:"10px 14px",background:authError.startsWith("✅")?C.greenLight:C.redLight,color:authError.startsWith("✅")?C.greenDark:C.red,borderRadius:8,fontSize:13 }}>{authError}</p>}
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:"1.25rem" }}>
              {[["Email","email","email"],["Senha","password","password"]].map(([l,k,t])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:4 }}>{l}</label>
                  <div style={{ position:"relative" }}>
                    <input type={k==="password"?(showLoginPwd?"text":"password"):t} value={loginData[k]} onChange={e=>setLoginData(d=>({...d,[k]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ width:"100%",padding:"9px 40px 9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} />
                    {k==="password"&&<button type="button" onClick={()=>setShowLoginPwd(v=>!v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.gray400,padding:0,lineHeight:1 }}>{showLoginPwd?"🙈":"👁️"}</button>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleLogin} disabled={authLoading||!loginData.email||!loginData.password} style={{ width:"100%",padding:"12px 0",background:C.green,color:C.white,border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,opacity:authLoading?.7:1 }}>{authLoading?"Entrando...":"Entrar"}</button>
            <div style={{ display:"flex",alignItems:"center",gap:8,margin:"1rem 0" }}><div style={{ flex:1,height:1,background:C.gray200 }}/><span style={{ fontSize:12,color:C.gray400 }}>ou</span><div style={{ flex:1,height:1,background:C.gray200 }}/></div>
            <p style={{ textAlign:"center",fontSize:13,color:C.gray600,margin:0 }}>Não tem conta? <span onClick={()=>{ setAuthStep("register"); setAuthError(""); }} style={{ color:C.green,cursor:"pointer",fontWeight:600 }}>Criar conta grátis</span></p>
          </>:<>
            <button onClick={()=>{ setAuthStep("login"); setAuthError(""); }} style={{ background:"none",border:"none",color:C.gray400,fontSize:13,cursor:"pointer",padding:"0 0 1rem" }}>← Voltar</button>
            <h3 style={{ margin:"0 0 1.1rem",fontWeight:700,fontSize:17 }}>Criar conta</h3>
            {authError&&<p style={{ margin:"0 0 12px",padding:"10px 14px",background:authError.startsWith("✅")?C.greenLight:C.redLight,color:authError.startsWith("✅")?C.greenDark:C.red,borderRadius:8,fontSize:13 }}>{authError}</p>}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {[["Nome completo *","name","text"],["Email *","email","email"],["Senha *","password","password"]].map(([l,k,t])=>(
                <div key={k}><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>{l}</label><input type={t} value={reg[k]} onChange={e=>setReg(r=>({...r,[k]:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box" }} /></div>
              ))}
              <CityStatePicker stateVal={reg.state} cityVal={reg.city} onStateChange={v=>setReg(r=>({...r,state:v}))} onCityChange={v=>setReg(r=>({...r,city:v}))} />
              <div><label style={{ fontSize:12,color:C.gray600,display:"block",marginBottom:3 }}>Sobre você</label><textarea value={reg.bio} onChange={e=>setReg(r=>({...r,bio:e.target.value}))} rows={3} style={{ width:"100%",padding:"9px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,boxSizing:"border-box",resize:"none" }} /></div>
            </div>
            <button onClick={handleRegister} disabled={authLoading||!reg.name||!reg.email||!reg.password} style={{ marginTop:"1rem",width:"100%",padding:"12px 0",background:C.green,color:C.white,border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:600,opacity:authLoading?.7:1 }}>{authLoading?"Criando conta...":"Criar conta"}</button>
          </>}
        </div>
      </div>
    </div>
  );

  const notifsPanel = showNotifs&&(
    <div onClick={()=>setShowNotifs(false)} style={{ position:"fixed",inset:0,zIndex:3000 }}>
      <div onClick={e=>e.stopPropagation()} style={{ position:"absolute",top:56,right:isMobile?8:16,width:isMobile?"calc(100vw - 16px)":350,maxHeight:500,background:C.white,borderRadius:14,boxShadow:"0 8px 40px rgba(0,0,0,.2)",display:"flex",flexDirection:"column",overflow:"hidden",border:`1px solid ${C.gray200}` }}>
        <div style={{ padding:"12px 16px 10px",borderBottom:`1px solid ${C.gray100}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <p style={{ margin:0,fontWeight:700,fontSize:14,color:C.gray900 }}>🔔 Notificações</p>
          <button onClick={()=>setShowNotifs(false)} style={{ background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:20,lineHeight:1,padding:0 }}>×</button>
        </div>
        <div style={{ overflowY:"auto",flex:1 }}>
          {notifItems.length===0?(
            <div style={{ textAlign:"center",padding:"2.5rem 1rem",color:C.gray400 }}>
              <div style={{ fontSize:36,marginBottom:10 }}>🔔</div>
              <p style={{ fontSize:13,margin:0 }}>Nenhuma notificação nova</p>
              <p style={{ fontSize:11,margin:"4px 0 0",color:C.gray400 }}>Perguntas e respostas nos seus anúncios aparecerão aqui.</p>
            </div>
          ):notifItems.map(n=>(
            <div key={`${n.type}-${n.id}`} onClick={()=>{ if(n.shirtId){ openShirt(n.shirtId); setShowNotifs(false); } }}
              style={{ padding:"12px 16px",borderBottom:`1px solid ${C.gray100}`,cursor:n.shirtId?"pointer":"default",display:"flex",gap:10,alignItems:"flex-start",background:"#fff" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <span style={{ fontSize:22,flexShrink:0,lineHeight:1.2 }}>{n.type==="new_question"?"❓":"💬"}</span>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ margin:"0 0 2px",fontSize:13,fontWeight:600,color:C.gray900 }}>{n.text}</p>
                <p style={{ margin:"0 0 4px",fontSize:12,color:C.gray600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>"{n.sub}"</p>
                <p style={{ margin:0,fontSize:11,color:C.gray400 }}>{new Date(n.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
              </div>
            </div>
          ))}
        </div>
        {notifItems.length>0&&(
          <div style={{ padding:"8px 16px",borderTop:`1px solid ${C.gray100}` }}>
            <button onClick={()=>{ localStorage.setItem("fsm_notifs_seen",Date.now()); setNotifItems([]); setNotifBadge(0); setShowNotifs(false); }}
              style={{ width:"100%",padding:"8px 0",border:`1px solid ${C.gray200}`,borderRadius:8,background:C.white,color:C.gray600,fontSize:12,cursor:"pointer" }}>
              Marcar tudo como lido
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const boostModalEl = boostModal&&(
    <div onClick={e=>{ if(e.target===e.currentTarget) setBoostModal(null); }} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ background:C.white,borderRadius:"20px 20px 0 0",padding:"1.5rem",width:"100%",maxWidth:480,boxSizing:"border-box" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.gray200,margin:"0 auto 18px" }} />
        <h3 style={{ margin:"0 0 4px",fontWeight:700,fontSize:17 }}>⚡ Impulsionar Anúncio</h3>
        <p style={{ margin:"0 0 18px",fontSize:13,color:C.gray400 }}>{boostModal.team}{boostModal.edition?` · ${boostModal.edition}`:""}</p>
        <div style={{ background:"linear-gradient(120deg,#fef3c7,#fde68a)",borderRadius:14,padding:"1rem 1.25rem",marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <span style={{ fontWeight:700,fontSize:20,color:"#92400e" }}>{BOOST_PRICE}</span>
            <span style={{ fontSize:13,color:"#b45309",fontWeight:600 }}>{BOOST_DAYS} dias</span>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {["⚡ Aparece em destaque na home","🔝 Topo do catálogo","🏷️ Badge dourado no card"].map(t=>(
              <span key={t} style={{ fontSize:13,color:"#92400e" }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"12px 14px",marginBottom:16 }}>
          <p style={{ margin:"0 0 6px",fontWeight:600,fontSize:13,color:C.gray900 }}>Como pagar:</p>
          <p style={{ margin:"0 0 4px",fontSize:13,color:C.gray600 }}>1. Envie {BOOST_PRICE} via Pix para o admin</p>
          <p style={{ margin:"0 0 4px",fontSize:13,color:C.gray600 }}>2. Clique em "Solicitar Destaque" abaixo</p>
          <p style={{ margin:0,fontSize:13,color:C.gray600 }}>3. Após confirmação do pagamento, o destaque é ativado em até 24h</p>
        </div>
        <button onClick={()=>handleRequestBoost(boostModal.id)} disabled={boostLoading} style={{ width:"100%",padding:"13px 0",border:"none",borderRadius:12,background:"linear-gradient(90deg,#f59e0b,#f97316)",color:C.white,fontSize:15,fontWeight:700,cursor:"pointer",opacity:boostLoading?.7:1,marginBottom:8 }}>
          {boostLoading?"Enviando...":"Solicitar Destaque ⚡"}
        </button>
        <button onClick={()=>setBoostModal(null)} style={{ width:"100%",padding:"11px 0",border:`1px solid ${C.gray200}`,borderRadius:12,background:C.white,cursor:"pointer",fontSize:14,color:C.gray600 }}>Cancelar</button>
      </div>
    </div>
  );

  /* ── NAVIGATION ── */
  function navigate(target) {
    window.history.pushState(null,"",target==="home"?"#":`#${target}`);
    setPage(target); setSellerSlug(null); setSellerProfile(null); setSelectedId(null); setSelectedShirt(null);
  }
  function deepNavigate(link) {
    if(!link){ navigate("catalog"); return; }
    if(isUrl(link)){ window.open(link,"_blank"); return; }
    if(link.startsWith("item-"))  { openShirt(link.replace("item-","")); return; }
    if(link.startsWith("seller-")){ openSeller(link.replace("seller-","")); return; }
    if(link.includes("?")){
      const { page:pg,params } = parseDeepLink(link);
      if(params.search!==undefined) setSearch(params.search);
      const fKeys = ["type","region","condition","model","size","price","state"];
      const upd = {};
      fKeys.forEach(k=>{ if(params[k]) upd[k]=params[k]; });
      if(Object.keys(upd).length) setFilters(f=>({...f,...upd}));
      navigate(pg);
    } else { navigate(link); }
  }

  /* ── NAVBAR ── */
  const NavBar = () => (<>
    <div style={{ borderBottom:`1px solid ${C.gray100}`,marginBottom:20 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 0 0.6rem" }}>
        <div onClick={()=>navigate("home")} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
          <div style={{ width:30,height:30,borderRadius:8,background:C.greenDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>⚽</div>
          <span style={{ fontWeight:800,fontSize:16,color:C.gray900,letterSpacing:-.3 }}>FutShirt</span>
        </div>
        {!isMobile&&<div style={{ display:"flex",gap:4 }}>
          {[["home","Home"],["catalog","Catálogo"],["sellers","Vendedores"]].map(([v,l])=>(
            <button key={v} onClick={()=>navigate(v)} style={{ background:page===v?C.greenLight:"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page===v?600:400,color:page===v?C.green:C.gray600 }}>{l}</button>
          ))}
          {user&&<button onClick={()=>navigate("portfolio")} style={{ background:page==="portfolio"?"#eff6ff":"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page==="portfolio"?600:400,color:page==="portfolio"?"#1d4ed8":C.gray600 }}>📚 Portfólio</button>}
          {profile?.role==="admin"&&<button onClick={()=>navigate("admin")} style={{ background:page==="admin"?"#fef3c7":"none",border:"none",fontSize:13,cursor:"pointer",padding:"5px 10px",borderRadius:8,fontWeight:page==="admin"?600:400,color:page==="admin"?C.amber:C.gray600 }}>⚙️ Admin</button>}
        </div>}
        <div style={{ display:"flex",alignItems:"center",gap:isMobile?6:8 }}>
          {user?<>
            <button onClick={()=>navigate("wishlist")} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,color:page==="wishlist"?C.red:C.gray600 }}>
              ♥{wishlist.length>0&&<span style={{ background:C.red,color:C.white,borderRadius:99,fontSize:10,padding:"1px 5px",marginLeft:4 }}>{wishlist.length}</span>}
              {alertMatches.length>0&&<span style={{ background:C.amber,color:C.white,borderRadius:99,fontSize:10,padding:"1px 5px",marginLeft:4 }}>🔔{alertMatches.length}</span>}
            </button>
            <button onClick={()=>{ setShowNotifs(v=>{ if(!v){ localStorage.setItem("fsm_notifs_seen",Date.now()); setNotifBadge(0); } return !v; }); }} style={{ position:"relative",background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,color:showNotifs?C.green:C.gray600 }}>
              🔔{notifBadge>0&&<span style={{ position:"absolute",top:-5,right:-5,background:C.red,color:C.white,borderRadius:99,fontSize:9,padding:"1px 4px",fontWeight:700,lineHeight:1.4 }}>{notifBadge}</span>}
            </button>
            {!isMobile&&<button onClick={()=>navigate("addProduct")} style={{ padding:"6px 13px",borderRadius:9,border:"none",background:C.green,color:C.white,fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Anunciar</button>}
            <div onClick={()=>navigate("myProfile")} style={{ cursor:"pointer" }}><Avatar name={profile?.name||"?"} size={30} src={profile?.avatar_url} /></div>
            {!isMobile&&<button onClick={handleLogout} style={{ background:"none",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.gray600 }}>Sair</button>}
          </>:<>
            {!isMobile&&<button onClick={()=>{ setShowAuth(true); setAuthStep("login"); setAuthError(""); }} style={{ padding:"6px 14px",borderRadius:9,border:`1px solid ${C.green}`,background:C.white,color:C.green,fontSize:13,fontWeight:600,cursor:"pointer" }}>Entrar</button>}
            {!isMobile&&<button onClick={()=>{ setShowAuth(true); setAuthStep("register"); setAuthError(""); }} style={{ padding:"6px 14px",borderRadius:9,border:"none",background:C.green,color:C.white,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cadastrar</button>}
          </>}
        </div>
      </div>
      {isMobile&&<div style={{ display:"flex",gap:2,paddingBottom:"0.5rem",overflowX:"auto" }}>
        {[["home","🏠 Home"],["catalog","📋 Catálogo"],["sellers","👥 Vendedores"]].map(([v,l])=>(
          <button key={v} onClick={()=>navigate(v)} style={{ flex:1,background:page===v?C.greenLight:"none",border:"none",fontSize:11,cursor:"pointer",padding:"5px 2px",borderRadius:8,fontWeight:page===v?600:400,color:page===v?C.green:C.gray600,whiteSpace:"nowrap" }}>{l}</button>
        ))}
        {user?<>
          {profile?.role==="admin"&&<button onClick={()=>navigate("admin")} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:page==="admin"?"#fef3c7":"none",color:C.amber,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>⚙️ Admin</button>}
          <button onClick={()=>navigate("portfolio")} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:page==="portfolio"?"#eff6ff":"none",color:"#1d4ed8",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>📚 Portfólio</button>
          <button onClick={()=>navigate("addProduct")} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:C.green,color:C.white,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>+ Anunciar</button>
          <button onClick={handleLogout} style={{ flex:1,background:"none",border:"none",fontSize:11,cursor:"pointer",padding:"5px 2px",borderRadius:8,color:C.gray600,whiteSpace:"nowrap" }}>Sair</button>
        </>:<>
          <button onClick={()=>{ setShowAuth(true); setAuthStep("login"); setAuthError(""); }} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:`1px solid ${C.green}`,background:C.white,color:C.green,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>Entrar</button>
          <button onClick={()=>{ setShowAuth(true); setAuthStep("register"); setAuthError(""); }} style={{ flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:C.green,color:C.white,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>Cadastrar</button>
        </>}
      </div>}
    </div>
    {notifsPanel}
  </>);

  const wrap = (content, maxWidth=1200, extraLayers=null) => (
    <div style={{ fontFamily:"system-ui,sans-serif",maxWidth,margin:"0 auto",padding:"0 0 4rem" }}>
      <NavBar />
      {content}
      {extraLayers}
      {authModal}{toastEl}
    </div>
  );

  /* ══ ROUTING ══ */

  // ── ADD PRODUCT ──
  if(page==="addProduct") return wrap(
    <AddShirtForm
      user={user} form={form} setForm={setForm} formStep={formStep} setFormStep={setFormStep}
      formDone={formDone} formErrors={formErrors} setFormErrors={setFormErrors}
      formSaving={formSaving} editingShirtId={editingShirtId} isMobile={isMobile} emptyForm={emptyForm}
      onBack={()=>{ navigate(editingShirtId?"sellers":"home"); setEditingShirtId(null); setForm(emptyForm); setFormStep(1); }}
      handleAddShirt={handleAddShirt}
    />,
    760
  );

  // ── SELLER PROFILE ──
  if(sellerSlug) return wrap(
    <>
      <TrustBar />
      <SellerProfile
        sellerSlug={sellerSlug} sellerProfile={sellerProfile}
        user={user} profile={profile} shirts={shirts} wishlist={wishlist} toggleWishlist={toggleWishlist}
        follows={follows} isMobile={isMobile} sellerReviews={sellerReviews}
        reviewForm={reviewForm} setReviewForm={setReviewForm} reviewLoading={reviewLoading}
        onBack={()=>{ setSellerSlug(null); setSellerProfile(null); }}
        openShirt={openShirt} openSeller={openSeller}
        handleToggleFollow={handleToggleFollow} requireAuth={requireAuth} setContactModal={setContactModal}
        startEditShirt={startEditShirt} handleDeleteShirt={handleDeleteShirt} handleSubmitReview={handleSubmitReview}
      />
      <Footer onNavigate={navigate} />
    </>,
    1200,
    contactModal&&<ContactModal seller={contactModal} onClose={()=>setContactModal(null)} />
  );

  // ── ITEM DETAIL ──
  if(selectedId) return wrap(
    <>
      <TrustBar />
      <ShirtDetail
        selectedId={selectedId} selectedShirt={selectedShirt} profile={profile} user={user}
        wishlist={wishlist} available={available} isMobile={isMobile}
        photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} setLightbox={setLightbox}
        shirtQuestions={shirtQuestions} questionText={questionText} setQuestionText={setQuestionText}
        questionLoading={questionLoading} answerTexts={answerTexts} setAnswerTexts={setAnswerTexts}
        answerLoading={answerLoading}
        onBack={()=>{ setSelectedId(null); setSelectedShirt(null); }}
        openShirt={openShirt}
        openSeller={(id)=>{ setSelectedId(null); setSelectedShirt(null); openSeller(id); }}
        toggleWishlist={toggleWishlist} handleShare={handleShare} requireAuth={requireAuth}
        setContactModal={setContactModal} handleAskQuestion={handleAskQuestion}
        handleAnswerQuestion={handleAnswerQuestion} handleDeleteQuestion={handleDeleteQuestion}
        setShowAuth={setShowAuth} setAuthStep={setAuthStep} setAuthError={setAuthError} addToast={addToast}
      />
      <Footer onNavigate={navigate} />
    </>,
    1200,
    <>
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out" }}>
          <img src={lightbox} alt="" style={{ maxWidth:"95vw",maxHeight:"95vh",objectFit:"contain",borderRadius:12 }} />
          <button onClick={()=>setLightbox(null)} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer" }}>×</button>
        </div>
      )}
      {contactModal&&<ContactModal seller={contactModal} onClose={()=>setContactModal(null)} />}
    </>
  );

  // ── HOME ──
  if(page==="home") return wrap(
    <>
      <TrustBar />
      <BannerCarousel onCta={deepNavigate} banners={banners} />
      <CategoryTiles onNavigate={navigate} setFilters={setFilters} />
      {shirtsLoading&&<div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:30 }}>{[...Array(4)].map((_,i)=><SkeletonCard key={i} />)}</div>}
      {!shirtsLoading&&available.filter(isBoosted).length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="⚡" sub="anúncios impulsionados" title="Em Destaque" />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {available.filter(isBoosted).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {!shirtsLoading&&promos.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="🏷️" sub="seleção especial" title="Melhores Ofertas da Semana" action="Ver todas" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {promos.slice(0,4).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {!shirtsLoading&&topRated.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="⭐" sub="avaliados pela comunidade" title="Os Favoritos" action="Ver catálogo" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {topRated.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {!shirtsLoading&&recent.length>0&&<div style={{ marginBottom:30 }}>
        <SectionHead icon="🆕" sub="acabaram de chegar" title="Chegaram Agora" action="Ver todas" onAction={()=>navigate("catalog")} />
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
          {recent.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}
        </div>
      </div>}
      {!shirtsLoading&&available.length===0&&(
        <EmptyState emoji="⚽" title="Seja o primeiro a anunciar!" sub="O mercado ainda está vazio. Cadastre sua camiseta e encontre compradores." action="+ Anunciar camiseta" onAction={()=>requireAuth(()=>navigate("addProduct"))} />
      )}
      <Footer onNavigate={navigate} />
    </>
  );

  // ── CATALOG ──
  if(page==="catalog") return wrap(
    <>
      <TrustBar />
      {isMobile?(
        <>
          <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"6px 12px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer" }}>
              {[["relevancia","Relevância"],["preco_asc","Menor preço"],["preco_desc","Maior preço"],["avaliacao","Melhor avaliação"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {shirtsLoading
            ?<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>{[...Array(6)].map((_,i)=><SkeletonCard key={i} />)}</div>
            :<><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14 }}>{filtered.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>{filtered.length===0&&<EmptyState emoji="🔍" title="Nenhuma camiseta encontrada" sub="Tente outros filtros ou limpe a busca para ver todos os itens." action="Limpar filtros" onAction={()=>{ setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null}); setSearch(""); }} />}</>
          }
        </>
      ):(
        <div style={{ display:"flex",gap:24,alignItems:"flex-start" }}>
          <div style={{ width:280,flexShrink:0,position:"sticky",top:16,alignSelf:"flex-start" }}>
            <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <p style={{ margin:0,fontSize:13,color:C.gray400 }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"6px 12px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,background:C.white,cursor:"pointer" }}>
                {[["relevancia","Relevância"],["preco_asc","Menor preço"],["preco_desc","Maior preço"],["avaliacao","Melhor avaliação"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {shirtsLoading
              ?<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14 }}>{[...Array(6)].map((_,i)=><SkeletonCard key={i} />)}</div>
              :<><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14 }}>{filtered.map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>{filtered.length===0&&<EmptyState emoji="🔍" title="Nenhuma camiseta encontrada" sub="Tente outros filtros ou limpe a busca para ver todos os itens." action="Limpar filtros" onAction={()=>{ setFilters({sport:null,type:null,region:null,condition:null,model:null,size:null,price:null,state:null}); setSearch(""); }} />}</>
            }
          </div>
        </div>
      )}
      <Footer onNavigate={navigate} />
    </>
  );

  // ── SELLERS ──
  if(page==="sellers") {
    const activeSellers = sellers.filter(sv=>!sv.blocked&&shirts.some(sh=>sh.seller_id===sv.id));
    const filteredSellers = activeSellers.filter(sv=>{
      if(!sellerSearch.trim()) return true;
      const q = sellerSearch.toLowerCase();
      return (sv.name||"").toLowerCase().includes(q)||(sv.location||"").toLowerCase().includes(q);
    });
    return wrap(
      <>
        <TrustBar />
        <SectionHead icon="👥" sub="comunidade" title="Vendedores" />
        <div style={{ position:"relative",marginBottom:16 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.gray400,fontSize:16 }}>🔍</span>
          <input value={sellerSearch} onChange={e=>setSellerSearch(e.target.value)} placeholder="Buscar vendedor por nome ou cidade..."
            style={{ width:"100%",padding:"10px 38px 10px 40px",border:`1px solid ${C.gray200}`,borderRadius:12,fontSize:14,boxSizing:"border-box",outline:"none" }} />
          {sellerSearch&&<button onClick={()=>setSellerSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.gray400,cursor:"pointer",fontSize:18,lineHeight:1,padding:0 }}>×</button>}
        </div>
        {sellersLoading?<Spinner />:activeSellers.length===0?(
          <EmptyState emoji="👥" title="Nenhum vendedor ainda" sub="Seja o primeiro a publicar um anúncio e apareça aqui!" action="+ Anunciar camiseta" onAction={()=>requireAuth(()=>setPage("addProduct"))} />
        ):filteredSellers.length===0?(
          <EmptyState emoji="🔍" title="Nenhum vendedor encontrado" sub={`Não encontramos ninguém com "${sellerSearch}". Tente outro nome ou cidade.`} action="Limpar busca" onAction={()=>setSellerSearch("")} />
        ):(
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {filteredSellers.map(sv=>{
              const count = shirts.filter(sh=>sh.seller_id===sv.id).length;
              const avgRating = sv.rating?Number(sv.rating).toFixed(1):null;
              return (
                <div key={sv.id} onClick={()=>openSeller(sv.id)} style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14 }}>
                  <Avatar name={sv.name} size={50} src={sv.avatar_url} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.gray900 }}>{sv.name}</p>
                    {sv.location&&<p style={{ margin:"0 0 5px",fontSize:12,color:C.gray400 }}>📍 {sv.location}</p>}
                    <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                      <span style={{ fontSize:12,color:C.gray600 }}>🏷️ {count} anúncio{count!==1?"s":""}</span>
                      {avgRating&&<span style={{ fontSize:12,color:C.amber }}>★ {avgRating}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:14,color:C.gray400 }}>→</span>
                </div>
              );
            })}
          </div>
        )}
        <Footer onNavigate={navigate} />
      </>
    );
  }

  // ── WISHLIST ──
  if(page==="wishlist") return wrap(
    <>
      <SectionHead icon="♥" sub="minha lista" title="Lista de desejos" />
      <div style={{ background:"#fffbeb",border:"1px solid #fde68a",borderRadius:14,padding:"14px 16px",marginBottom:20 }}>
        <p style={{ margin:"0 0 4px",fontWeight:700,fontSize:13,color:"#92400e" }}>🔔 Alertas de busca</p>
        <p style={{ margin:"0 0 10px",fontSize:12,color:"#b45309" }}>Monitore times ou edições — avisamos quando aparecerem no catálogo.</p>
        <div style={{ display:"flex",gap:8,marginBottom:10 }}>
          <input value={alertInput} onChange={e=>setAlertInput(e.target.value)} placeholder="Ex: Palmeiras, Barcelona, Copa 2002..."
            onKeyDown={e=>{ if(e.key==="Enter"){const t=alertInput.trim();if(t&&!alertTerms.includes(t)){saveAlerts([...alertTerms,t]);setAlertInput("");}} }}
            style={{ flex:1,padding:"8px 12px",border:"1px solid #fde68a",borderRadius:9,fontSize:13,outline:"none" }} />
          <button onClick={()=>{ const t=alertInput.trim(); if(t&&!alertTerms.includes(t)){saveAlerts([...alertTerms,t]);setAlertInput("");} }}
            style={{ padding:"8px 14px",background:"#f59e0b",border:"none",borderRadius:9,color:"#fff",fontWeight:600,cursor:"pointer",fontSize:13,flexShrink:0 }}>
            + Alerta
          </button>
        </div>
        {alertTerms.length>0&&(
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:alertMatches.length>0?10:0 }}>
            {alertTerms.map(t=>(
              <span key={t} style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#fff",border:"1px solid #fde68a",borderRadius:99,padding:"3px 10px",fontSize:12,color:"#92400e" }}>
                🔍 {t}
                <button onClick={()=>saveAlerts(alertTerms.filter(x=>x!==t))} style={{ background:"none",border:"none",color:"#f59e0b",cursor:"pointer",fontSize:15,padding:0,lineHeight:1 }}>×</button>
              </span>
            ))}
          </div>
        )}
        {alertMatches.length>0&&(
          <div style={{ padding:"10px 12px",background:"#fff",borderRadius:10,border:"1px solid #fde68a" }}>
            <p style={{ margin:"0 0 8px",fontWeight:600,fontSize:12,color:"#92400e" }}>🆕 {alertMatches.length} camiseta{alertMatches.length!==1?"s":""} nos últimos 7 dias:</p>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {alertMatches.slice(0,5).map(s=>(
                <div key={s.id} onClick={()=>openShirt(s.id)} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"6px 8px",borderRadius:8,background:"#fffbeb" }}>
                  <div style={{ width:36,height:36,borderRadius:7,overflow:"hidden",background:C.gray50,flexShrink:0 }}><img src={(s.photos||[])[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /></div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:0,fontWeight:600,fontSize:12,color:C.gray900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.team}{s.edition?` · ${s.edition}`:""}</p>
                    <p style={{ margin:0,fontSize:11,color:C.gray400 }}>{s.year} · R$ {Number(s.price).toLocaleString("pt-BR")}</p>
                  </div>
                  <span style={{ fontSize:11,color:C.green,fontWeight:600,flexShrink:0 }}>Ver →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {wishlist.length===0
        ?<EmptyState emoji="♡" title="Sua lista está vazia" sub="Salve as camisetas que você curtir clicando no coração e encontre-as aqui depois." action="Explorar catálogo →" onAction={()=>setPage("catalog")} />
        :<div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(auto-fit,minmax(150px,1fr))":"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>{shirts.filter(s=>wishlist.includes(s.id)).map(s=><ShirtCard key={s.id} s={s} wishlist={wishlist} toggleWishlist={toggleWishlist} onOpen={openShirt} />)}</div>
      }
      <Footer onNavigate={navigate} />
    </>
  );

  // ── PORTFOLIO ──
  if(page==="portfolio") {
    if(!user){ navigate("home"); return null; }
    return wrap(
      <>
        <TrustBar />
        <PortfolioPage
          user={user} profile={profile} shirts={shirts} isMobile={isMobile}
          portfolioTab={portfolioTab} setPortfolioTab={setPortfolioTab}
          portfolioSearch={portfolioSearch} setPortfolioSearch={setPortfolioSearch}
          onAddShirt={()=>{ setForm(emptyForm); setFormStep(1); setFormDone(false); setEditingShirtId(null); setPage("addProduct"); }}
          startEditShirt={startEditShirt} openShirt={openShirt} navigate={navigate}
          addToast={addToast} loadShirts={loadShirts}
        />
        <Footer onNavigate={navigate} />
      </>
    );
  }

  // ── PUBLIC PORTFOLIO ──
  if(page==="publicPortfolio") return wrap(
    <>
      <TrustBar />
      <PublicPortfolioPage
        publicPortfolioData={publicPortfolioData} publicPortfolioId={publicPortfolioId}
        isMobile={isMobile} openShirt={openShirt} openSeller={openSeller}
      />
      <Footer onNavigate={navigate} />
    </>
  );

  // ── MY PROFILE ──
  if(page==="myProfile") return wrap(
    <MyProfile
      user={user} profile={profile} profileForm={profileForm} setProfileForm={setProfileForm}
      profileSaving={profileSaving} profileSaved={profileSaved}
      myProfileTab={myProfileTab} setMyProfileTab={setMyProfileTab}
      shirts={shirts} isMobile={isMobile}
      handleSaveProfile={handleSaveProfile} handleAvatarUpload={handleAvatarUpload}
      handleLogout={handleLogout} openSeller={openSeller} openPublicPortfolio={openPublicPortfolio}
      startEditShirt={startEditShirt} handleToggleShirtStatus={handleToggleShirtStatus}
      setBoostModal={setBoostModal} navigate={navigate}
      setForm={setForm} setFormStep={setFormStep} setFormDone={setFormDone}
      setEditingShirtId={setEditingShirtId} setPage={setPage} emptyForm={emptyForm}
    />,
    760,
    boostModalEl
  );

  // ── ADMIN ──
  if(page==="admin"&&profile?.role==="admin") return wrap(
    <AdminPage
      user={user} sellers={sellers} shirts={shirts}
      adminTab={adminTab} setAdminTab={setAdminTab}
      banners={banners} adminBannerEdit={adminBannerEdit} setAdminBannerEdit={setAdminBannerEdit}
      bannerSaving={bannerSaving} bannerErrors={bannerErrors} setBannerErrors={setBannerErrors}
      adminQuestions={adminQuestions} adminNotifs={adminNotifs}
      handleToggleBlock={handleToggleBlock} handleDeleteShirt={handleDeleteShirt}
      handleSaveBanner={handleSaveBanner} handleActivateBoost={handleActivateBoost}
      handleDeactivateBoost={handleDeactivateBoost}
      loadAdminQuestions={loadAdminQuestions} loadAdminNotifs={loadAdminNotifs} addToast={addToast}
    />
  );

  return null;
}
