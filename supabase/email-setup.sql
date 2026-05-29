-- ═══════════════════════════════════════════════════════════════
-- FutShirt Market — Configuração de Email
-- Execute no Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 0. TABELA: direct_messages ──
-- Execute apenas uma vez. Se já existir, o IF NOT EXISTS evita erro.

CREATE TABLE IF NOT EXISTS direct_messages (
  id          uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid             REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid             REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text             NOT NULL CHECK (char_length(content) > 0),
  shirt_id    uuid             REFERENCES shirts(id) ON DELETE SET NULL,
  read_at     timestamptz,
  created_at  timestamptz      DEFAULT now() NOT NULL
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê apenas as suas mensagens (enviadas ou recebidas)
DROP POLICY IF EXISTS "dm_select" ON direct_messages;
CREATE POLICY "dm_select" ON direct_messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Só pode enviar com o próprio id
DROP POLICY IF EXISTS "dm_insert" ON direct_messages;
CREATE POLICY "dm_insert" ON direct_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Só o destinatário pode marcar como lida
DROP POLICY IF EXISTS "dm_update" ON direct_messages;
CREATE POLICY "dm_update" ON direct_messages
  FOR UPDATE USING (receiver_id = auth.uid());


-- ── 0b. TRIGGER: email quando mensagem direta é enviada ──

CREATE OR REPLACE FUNCTION notify_direct_message_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name    text;
  v_receiver_name  text;
  v_receiver_email text;
  v_shirt_team     text;
BEGIN
  SELECT p.name INTO v_sender_name
    FROM profiles p WHERE p.id = NEW.sender_id;

  SELECT p.name, u.email INTO v_receiver_name, v_receiver_email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = NEW.receiver_id;

  IF NEW.shirt_id IS NOT NULL THEN
    SELECT team INTO v_shirt_team FROM shirts WHERE id = NEW.shirt_id;
  END IF;

  INSERT INTO email_notifications (type, recipient_email, data)
  VALUES (
    'direct_message',
    v_receiver_email,
    jsonb_build_object(
      'sender_name',   COALESCE(v_sender_name,   'Usuário'),
      'receiver_name', COALESCE(v_receiver_name, 'Usuário'),
      'message',       NEW.content,
      'shirt_team',    COALESCE(v_shirt_team, ''),
      'shirt_id',      COALESCE(NEW.shirt_id::text, '')
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_direct_message_notify ON direct_messages;
CREATE TRIGGER on_direct_message_notify
  AFTER INSERT ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION notify_direct_message_email();


-- ── 0c. TRIGGER: email de queda de preço para quem tem na wishlist ──

CREATE OR REPLACE FUNCTION notify_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_discount integer;
  v_user     RECORD;
BEGIN
  -- Só dispara se o preço realmente caiu
  IF NEW.price >= OLD.price THEN RETURN NEW; END IF;

  v_discount := ROUND(((OLD.price - NEW.price)::numeric / OLD.price::numeric) * 100);

  FOR v_user IN
    SELECT p.name, u.email
    FROM wishlist w
    JOIN profiles p ON p.id = w.user_id
    JOIN auth.users u ON u.id = w.user_id
    WHERE w.shirt_id = NEW.id
      AND w.user_id <> NEW.seller_id   -- não notifica o próprio vendedor
  LOOP
    INSERT INTO email_notifications (type, recipient_email, data)
    VALUES (
      'price_drop',
      v_user.email,
      jsonb_build_object(
        'user_name',  COALESCE(v_user.name, 'Usuário'),
        'shirt_team', NEW.team,
        'shirt_id',   NEW.id::text,
        'old_price',  OLD.price::text,
        'new_price',  NEW.price::text,
        'discount',   v_discount::text
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_price_drop ON shirts;
CREATE TRIGGER on_price_drop
  AFTER UPDATE OF price ON shirts
  FOR EACH ROW EXECUTE FUNCTION notify_price_drop();


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
