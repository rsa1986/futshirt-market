-- ═══════════════════════════════════════════════════════════════
-- FutShirt Market — Configuração de Email
-- Execute no Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 1. TRIGGER: popula a fila quando uma pergunta é feita ou respondida ──

CREATE OR REPLACE FUNCTION notify_question_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asker_name   text;
  v_asker_email  text;
  v_seller_name  text;
  v_seller_email text;
  v_shirt_team   text;
BEGIN
  -- Busca dados do comprador
  SELECT p.name, u.email
  INTO v_asker_name, v_asker_email
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = NEW.asker_id;

  -- Busca dados do vendedor
  SELECT p.name, u.email
  INTO v_seller_name, v_seller_email
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = NEW.seller_id;

  -- Busca nome da camiseta
  SELECT team INTO v_shirt_team FROM shirts WHERE id = NEW.shirt_id;

  -- INSERT: nova pergunta → notifica o vendedor
  IF TG_OP = 'INSERT' THEN
    INSERT INTO email_notifications (type, recipient_email, data)
    VALUES (
      'new_question',
      v_seller_email,
      jsonb_build_object(
        'seller_name', COALESCE(v_seller_name, 'Vendedor'),
        'asker_name',  COALESCE(v_asker_name,  'Comprador'),
        'shirt_team',  COALESCE(v_shirt_team,  'Camiseta'),
        'shirt_id',    NEW.shirt_id::text,
        'question',    NEW.question
      )
    );
  END IF;

  -- UPDATE: resposta adicionada → notifica o comprador
  IF TG_OP = 'UPDATE' AND OLD.answer IS NULL AND NEW.answer IS NOT NULL THEN
    INSERT INTO email_notifications (type, recipient_email, data)
    VALUES (
      'question_answered',
      v_asker_email,
      jsonb_build_object(
        'asker_name',  COALESCE(v_asker_name,  'Comprador'),
        'seller_name', COALESCE(v_seller_name, 'Vendedor'),
        'shirt_team',  COALESCE(v_shirt_team,  'Camiseta'),
        'shirt_id',    NEW.shirt_id::text,
        'question',    NEW.question,
        'answer',      NEW.answer
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir e recria
DROP TRIGGER IF EXISTS on_question_notify ON questions;
CREATE TRIGGER on_question_notify
  AFTER INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION notify_question_email();


-- ── 2. CRON: chama a Edge Function a cada 5 minutos ──
-- Substitua os dois valores abaixo antes de executar:
--   SEU_PROJECT_REF  → encontre em Settings → API (ex: abcdefghijkl)
--   SEU_ANON_KEY     → encontre em Settings → API → "anon public"

SELECT cron.schedule(
  'send-email-notifications',        -- nome do job (único)
  '*/5 * * * *',                     -- a cada 5 minutos
  $$
  SELECT net.http_post(
    url     := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/send-email-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);
