import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────────
type NotificationType = "new_question" | "question_answered";

interface EmailNotification {
  id: string;
  type: NotificationType;
  recipient_email: string;
  data: Record<string, string>;
  created_at: string;
}

// ── Subjects ────────────────────────────────────────────────────────
function getSubject(type: NotificationType): string {
  switch (type) {
    case "new_question":
      return "Nova pergunta no seu anúncio – FutShirt Market";
    case "question_answered":
      return "Sua pergunta foi respondida – FutShirt Market";
  }
}

// ── Plain-text body (substituir por HTML quando o layout estiver pronto) ──
function getBody(type: NotificationType, data: Record<string, string>): string {
  const base = "https://futshirt-market.vercel.app";
  const link = data.shirt_id ? `${base}/#item-${data.shirt_id}` : base;

  switch (type) {
    case "new_question":
      return [
        `Olá, ${data.seller_name}!`,
        "",
        `${data.asker_name} fez uma pergunta no seu anúncio "${data.shirt_team}":`,
        "",
        `"${data.question}"`,
        "",
        `Acesse o anúncio para responder: ${link}`,
        "",
        "– FutShirt Market",
      ].join("\n");

    case "question_answered":
      return [
        `Olá, ${data.asker_name}!`,
        "",
        `O vendedor ${data.seller_name} respondeu sua pergunta sobre "${data.shirt_team}":`,
        "",
        `Sua pergunta: "${data.question}"`,
        `Resposta: "${data.answer}"`,
        "",
        `Ver anúncio: ${link}`,
        "",
        "– FutShirt Market",
      ].join("\n");
  }
}

// ── Send via provider ────────────────────────────────────────────────
// TODO: escolha um provedor e implemente o envio aqui.
// Sugestões: Resend (resend.com), SendGrid, Mailgun, AWS SES.
//
// Exemplo com Resend:
//
//   const res = await fetch("https://api.resend.com/emails", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       from: "FutShirt Market <noreply@futshirt.com.br>",
//       to: [to],
//       subject,
//       text: body,
//       // html: htmlBody,  // quando o layout estiver pronto
//     }),
//   });
//   if (!res.ok) throw new Error(await res.text());
//
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // Placeholder – remova este bloco e implemente acima quando escolher o provedor
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
  console.log(body);
}

// ── Handler ──────────────────────────────────────────────────────────
serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Busca notificações ainda não enviadas
  const { data: pending, error } = await supabase
    .from("email_notifications")
    .select("*")
    .is("sent_at", null)
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
      const subject = getSubject(n.type);
      const body = getBody(n.type, n.data);

      await sendEmail(n.recipient_email, subject, body);

      await supabase
        .from("email_notifications")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", n.id);

      results.push({ id: n.id, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      await supabase
        .from("email_notifications")
        .update({ error_msg: msg })
        .eq("id", n.id);

      results.push({ id: n.id, status: "error", error: msg });
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
