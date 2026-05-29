import { C } from "./constants";

export default function StaticPage({ page, onBack }) {
  if (!page) return null;

  return (
    <>
      <button onClick={onBack}
        style={{ background:"none",border:"none",color:C.gray400,fontSize:14,cursor:"pointer",padding:"0.25rem 0 1rem" }}>
        ← Voltar
      </button>
      <div style={{ background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"2rem",maxWidth:720,margin:"0 auto" }}>
        <h1 style={{ margin:"0 0 24px",fontSize:24,fontWeight:800,color:C.gray900 }}>{page.title}</h1>
        <div style={{ fontSize:15,color:C.gray600,lineHeight:1.8,whiteSpace:"pre-wrap" }}>
          {page.content}
        </div>
        <p style={{ margin:"32px 0 0",fontSize:12,color:C.gray400 }}>
          Atualizado em {new Date(page.updated_at).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </>
  );
}
