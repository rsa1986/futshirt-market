// Referência local — o código deployado está na função "resend-email" no Supabase Dashboard
// Copie o conteúdo de dashboard-function.ts para o editor da função no Supabase

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export default {
  fetch: async (_req: Request): Promise<Response> => {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const BREVO_KEY    = Deno.env.get("BREVO_API_KEY")!;
    const dbHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
    };

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/email_notifications?sent_at=is.null&error_msg=is.null&order=created_at.asc&limit=50`,
      { headers: dbHeaders }
    );
    const pending = await r.json();

    if (!Array.isArray(pending) || !pending.length) {
      return new Response(JSON.stringify({ sent: 0, message: "Nenhuma notificação pendente." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const base = "https://futshirt-market.vercel.app";
    const btn  = "display:inline-block;padding:12px 28px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;";

    function shell(body: string) {
      return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;" cellpadding="0" cellspacing="0">
<tr><td style="background:#14532d;padding:18px 24px;border-radius:16px 16px 0 0;">
  <span style="font-weight:800;font-size:18px;color:#fff;">⚽ FutShirt Market</span>
</td></tr>
<tr><td style="padding:28px 24px;">${body}</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #f3f4f6;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">Você recebe este email por ter uma conta no FutShirt Market.</p>
</td></tr>
</table></td></tr></table></body></html>`;
    }

    function getSubject(type: string, d: Record<string, string>) {
      if (type === "new_question")      return "Nova pergunta no seu anúncio – FutShirt Market";
      if (type === "question_answered") return "Sua pergunta foi respondida – FutShirt Market";
      if (type === "direct_message")    return `${d.sender_name} te enviou uma mensagem – FutShirt Market`;
      if (type === "price_drop")        return `Preço baixou: ${d.shirt_team} – FutShirt Market`;
      return "Novidade no FutShirt Market";
    }

    function getHtml(type: string, d: Record<string, string>) {
      const link = d.shirt_id ? `${base}/#item-${d.shirt_id}` : base;

      if (type === "new_question") return shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Nova pergunta no seu anúncio</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Olá, <b>${d.seller_name}</b>! Alguém quer saber mais sobre sua camiseta.</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Anúncio</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">${d.shirt_team}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Pergunta de ${d.asker_name}</p>
          <p style="margin:0;font-size:15px;color:#111827;">"${d.question}"</p>
        </div>
        <a href="${link}" style="${btn}">Responder pergunta →</a>
      `);

      if (type === "question_answered") return shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Sua pergunta foi respondida! 🎉</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Olá, <b>${d.asker_name}</b>! O vendedor respondeu sua dúvida.</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Anúncio</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">${d.shirt_team}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Sua pergunta</p>
          <p style="margin:0 0 12px;font-size:14px;color:#4b5563;">"${d.question}"</p>
          <div style="border-left:3px solid #16a34a;padding-left:12px;">
            <p style="margin:0 0 4px;font-size:11px;color:#16a34a;font-weight:700;">Resposta de ${d.seller_name}</p>
            <p style="margin:0;font-size:15px;color:#111827;">"${d.answer}"</p>
          </div>
        </div>
        <a href="${link}" style="${btn}">Ver anúncio →</a>
      `);

      if (type === "direct_message") return shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Nova mensagem privada ✉️</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Olá, <b>${d.receiver_name}</b>! Você recebeu uma mensagem de <b>${d.sender_name}</b>.</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin-bottom:20px;">
          ${d.shirt_team ? `<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Sobre: <b style="color:#111827;">${d.shirt_team}</b></p>` : ""}
          <p style="margin:0;font-size:15px;color:#111827;line-height:1.5;">"${d.message}"</p>
        </div>
        <a href="${base}/#messages" style="${btn}">Ver mensagem →</a>
      `);

      if (type === "price_drop") return shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Preço baixou! 📉</h2>
        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Olá, <b>${d.user_name}</b>! Uma camiseta da sua lista de desejos ficou mais barata.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #d1fae5;">
          <p style="margin:0 0 4px;font-size:11px;color:#166534;font-weight:700;text-transform:uppercase;">Camiseta</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">${d.shirt_team}</p>
          <div style="display:flex;gap:16px;align-items:center;">
            <div><p style="margin:0;font-size:12px;color:#9ca3af;">Era</p><p style="margin:0;font-size:16px;color:#9ca3af;text-decoration:line-through;">R$ ${Number(d.old_price).toLocaleString("pt-BR")}</p></div>
            <div style="font-size:24px;">→</div>
            <div><p style="margin:0;font-size:12px;color:#166534;font-weight:700;">Agora</p><p style="margin:0;font-size:22px;font-weight:800;color:#16a34a;">R$ ${Number(d.new_price).toLocaleString("pt-BR")}</p></div>
            <div style="background:#dcfce7;border-radius:8px;padding:6px 12px;"><p style="margin:0;font-size:14px;font-weight:700;color:#166534;">-${d.discount}%</p></div>
          </div>
        </div>
        <a href="${link}" style="${btn}">Ver anúncio →</a>
      `);

      return shell(`<p>${JSON.stringify(d)}</p>`);
    }

    const results = [];
    for (const n of pending) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: { name: "FutShirt Market", email: "rodrigo.sagostinho@gmail.com" },
            to: [{ email: n.recipient_email }],
            subject: getSubject(n.type, n.data),
            htmlContent: getHtml(n.type, n.data),
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        await fetch(`${SUPABASE_URL}/rest/v1/email_notifications?id=eq.${n.id}`, {
          method: "PATCH", headers: dbHeaders, body: JSON.stringify({ sent_at: new Date().toISOString() }),
        });
        results.push({ id: n.id, status: "sent" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await fetch(`${SUPABASE_URL}/rest/v1/email_notifications?id=eq.${n.id}`, {
          method: "PATCH", headers: dbHeaders, body: JSON.stringify({ error_msg: msg }),
        });
        results.push({ id: n.id, status: "error", error: msg });
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
