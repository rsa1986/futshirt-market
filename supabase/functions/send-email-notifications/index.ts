import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type NotificationType = "new_question" | "question_answered";

interface EmailNotification {
  id: string;
  type: NotificationType;
  recipient_email: string;
  data: Record<string, string>;
}

function getSubject(type: NotificationType): string {
  return type === "new_question"
    ? "Nova pergunta no seu anúncio – FutShirt Market"
    : "Sua pergunta foi respondida – FutShirt Market";
}

function getHtml(type: NotificationType, d: Record<string, string>): string {
  const base = "https://futshirt-market.vercel.app";
  const link = d.shirt_id ? `${base}/#item-${d.shirt_id}` : base;
  const btn = `display:inline-block;padding:12px 28px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;`;

  const wrap = (body: string) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;" cellpadding="0" cellspacing="0">
  <tr><td style="background:#14532d;padding:18px 24px;">
    <span style="font-size:16px;">⚽</span>
    <span style="font-weight:800;font-size:18px;color:#ffffff;vertical-align:middle;margin-left:8px;">FutShirt Market</span>
  </td></tr>
  <tr><td style="padding:28px 24px 24px;">${body}</td></tr>
  <tr><td style="padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Você recebe este email porque tem uma conta no FutShirt Market.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  if (type === "new_question") {
    return wrap(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#111827;">Nova pergunta no seu anúncio</h2>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">Olá, <b>${d.seller_name}</b>! Alguém quer saber mais sobre a sua camiseta.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:18px;margin-bottom:24px;">
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Anúncio</p>
        <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#111827;">${d.shirt_team}</p>
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Pergunta de ${d.asker_name}</p>
        <p style="margin:0;font-size:15px;color:#111827;line-height:1.5;">"${d.question}"</p>
      </div>
      <a href="${link}" style="${btn}">Responder pergunta →</a>
    `);
  }

  return wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#111827;">Sua pergunta foi respondida! 🎉</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">Olá, <b>${d.asker_name}</b>! O vendedor respondeu sua dúvida.</p>
    <div style="background:#f3f4f6;border-radius:12px;padding:18px;margin-bottom:24px;">
      <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Anúncio</p>
      <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#111827;">${d.shirt_team}</p>
      <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Sua pergunta</p>
      <p style="margin:0 0 14px;font-size:14px;color:#4b5563;line-height:1.5;">"${d.question}"</p>
      <div style="border-left:3px solid #16a34a;padding-left:14px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#16a34a;">Resposta de ${d.seller_name}</p>
        <p style="margin:0;font-size:15px;color:#111827;line-height:1.5;">"${d.answer}"</p>
      </div>
    </div>
    <a href="${link}" style="${btn}">Ver anúncio →</a>
  `);
}

async function sendEmail(to: string, subj: string, body: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FutShirt Market <onboarding@resend.dev>",
      to: [to],
      subject: subj,
      html: body,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: pending, error } = await supabase
    .from("email_notifications")
    .select("*")
    .is("sent_at", null)
    .is("error_msg", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!pending?.length) {
    return new Response(JSON.stringify({ sent: 0, message: "Nenhuma notificação pendente." }));
  }

  const results: { id: string; status: string; error?: string }[] = [];

  for (const n of pending as EmailNotification[]) {
    try {
      await sendEmail(n.recipient_email, getSubject(n.type), getHtml(n.type, n.data));
      await supabase.from("email_notifications").update({ sent_at: new Date().toISOString() }).eq("id", n.id);
      results.push({ id: n.id, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("email_notifications").update({ error_msg: msg }).eq("id", n.id);
      results.push({ id: n.id, status: "error", error: msg });
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
