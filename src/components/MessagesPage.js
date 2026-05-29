import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { C } from "./constants";
import { Avatar, Spinner } from "./ui";

export default function MessagesPage({ user, dmTarget, clearDmTarget }) {
  const [messages,    setMessages]    = useState([]);
  const [profiles,    setProfiles]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [activeId,    setActiveId]    = useState(null);
  const [newMessage,  setNewMessage]  = useState("");
  const [sending,     setSending]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    if(dmTarget?.userId) {
      setActiveId(dmTarget.userId);
      clearDmTarget();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmTarget]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, activeId]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending:true });
    const msgs = data || [];
    setMessages(msgs);

    const otherIds = [...new Set(msgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
    if(dmTarget?.userId && !otherIds.includes(dmTarget.userId)) otherIds.push(dmTarget.userId);
    if(otherIds.length) {
      const { data:profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", otherIds);
      const map = {};
      (profs||[]).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }

  async function handleSend() {
    const text = newMessage.trim();
    if(!text || !activeId || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("direct_messages").insert({
      sender_id: user.id, receiver_id: activeId, content: text,
      shirt_id: dmTarget?.shirtId || null,
    }).select().single();
    if(!error) { setMessages(ms => [...ms, data]); setNewMessage(""); }
    setSending(false);
  }

  async function markRead(otherId) {
    await supabase.from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", user.id).eq("sender_id", otherId).is("read_at", null);
    setMessages(ms => ms.map(m =>
      m.sender_id === otherId && m.receiver_id === user.id && !m.read_at
        ? { ...m, read_at: new Date().toISOString() } : m
    ));
  }

  // Agrupa mensagens por conversa
  const convMap = {};
  messages.forEach(m => {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
    if(!convMap[otherId]) convMap[otherId] = { otherId, msgs:[], unread:0 };
    convMap[otherId].msgs.push(m);
    if(m.receiver_id === user.id && !m.read_at) convMap[otherId].unread++;
  });
  const conversations = Object.values(convMap).sort((a,b) => {
    const aL = a.msgs[a.msgs.length-1]?.created_at || "";
    const bL = b.msgs[b.msgs.length-1]?.created_at || "";
    return bL.localeCompare(aL);
  });

  const threadMsgs    = activeId ? (convMap[activeId]?.msgs || []) : [];
  const otherProfile  = activeId ? profiles[activeId] : null;

  if(loading) return <Spinner />;

  /* ── THREAD ── */
  if(activeId) return (
    <>
      <div style={{ display:"flex",alignItems:"center",gap:12,paddingBottom:16,borderBottom:`1px solid ${C.gray200}`,marginBottom:16 }}>
        <button onClick={()=>setActiveId(null)} style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer" }}>←</button>
        <Avatar name={otherProfile?.name||"?"} size={36} src={otherProfile?.avatar_url} />
        <p style={{ margin:0,fontWeight:700,fontSize:15,color:C.gray900 }}>{otherProfile?.name||"Usuário"}</p>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:8,minHeight:200,maxHeight:"52vh",overflowY:"auto",marginBottom:16,padding:"4px 0" }}>
        {threadMsgs.length===0&&(
          <p style={{ textAlign:"center",color:C.gray400,fontSize:14,padding:"3rem 0" }}>Nenhuma mensagem ainda. Inicie a conversa!</p>
        )}
        {threadMsgs.map(m => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} style={{ display:"flex",justifyContent:mine?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"75%",padding:"10px 14px",borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",background:mine?C.green:C.gray100,color:mine?C.white:C.gray900,fontSize:14,lineHeight:1.5 }}>
                {m.content}
                <div style={{ fontSize:10,color:mine?"rgba(255,255,255,.6)":C.gray400,marginTop:4,textAlign:"right" }}>
                  {new Date(m.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
        <textarea
          value={newMessage}
          onChange={e=>setNewMessage(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); } }}
          placeholder="Escreva sua mensagem... (Enter para enviar)"
          rows={2} maxLength={1000}
          style={{ flex:1,padding:"10px 12px",border:`1px solid ${C.gray200}`,borderRadius:10,fontSize:14,resize:"none",boxSizing:"border-box",outline:"none" }}
        />
        <button onClick={handleSend} disabled={sending||!newMessage.trim()}
          style={{ padding:"10px 20px",border:"none",borderRadius:10,background:C.green,color:C.white,fontWeight:600,fontSize:14,cursor:"pointer",opacity:(sending||!newMessage.trim())?.6:1,flexShrink:0,alignSelf:"stretch" }}>
          {sending?"...":"Enviar"}
        </button>
      </div>
    </>
  );

  /* ── INBOX ── */
  return (
    <>
      <h2 style={{ margin:"0 0 20px",fontWeight:800,fontSize:20 }}>✉️ Mensagens</h2>
      {conversations.length===0 ? (
        <div style={{ textAlign:"center",padding:"3rem 1rem",color:C.gray400 }}>
          <div style={{ fontSize:48,marginBottom:12 }}>✉️</div>
          <p style={{ fontSize:15,fontWeight:600,margin:"0 0 6px" }}>Nenhuma mensagem ainda</p>
          <p style={{ fontSize:13,margin:0 }}>Visite o perfil de um vendedor para iniciar uma conversa privada.</p>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {conversations.map(conv => {
            const prof = profiles[conv.otherId];
            const last = conv.msgs[conv.msgs.length-1];
            const hasUnread = conv.unread > 0;
            return (
              <div key={conv.otherId}
                onClick={()=>{ setActiveId(conv.otherId); markRead(conv.otherId); }}
                style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:`1px solid ${hasUnread?C.green:C.gray200}`,background:hasUnread?C.greenLight:C.white,cursor:"pointer" }}>
                <Avatar name={prof?.name||"?"} size={44} src={prof?.avatar_url} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                    <p style={{ margin:0,fontWeight:hasUnread?700:600,fontSize:14,color:C.gray900 }}>{prof?.name||"Usuário"}</p>
                    <span style={{ fontSize:11,color:C.gray400,flexShrink:0 }}>
                      {last?new Date(last.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):""}
                    </span>
                  </div>
                  <p style={{ margin:0,fontSize:13,color:hasUnread?C.green:C.gray600,fontWeight:hasUnread?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {last?.sender_id===user.id?"Você: ":""}{last?.content||""}
                  </p>
                </div>
                {hasUnread&&<span style={{ background:C.green,color:C.white,borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px",flexShrink:0 }}>{conv.unread}</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
