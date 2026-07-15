-- ==========================================
-- SCHEMA PARA EL CRM SAINT (SUPABASE)
-- ==========================================

-- 1. Tabla de Contactos
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  label TEXT DEFAULT 'Nuevo', -- 'Nuevo', 'Interesado', 'Cliente', 'Soporte', 'Sin Interés'
  notes TEXT DEFAULT '',
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Mensajes (Historial de Chats)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'client', 'agent', 'bot'
  content TEXT DEFAULT '',
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'audio', 'document'
  media_url TEXT DEFAULT '',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Seguimientos (Recordatorios y Tareas)
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar el Tiempo Real (Realtime) para las tablas en Supabase
-- Nota: En Supabase, esto agrega las tablas a la publicación de tiempo real.
BEGIN;
  -- Remover si ya existían para evitar conflictos
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS contacts;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS messages;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS follow_ups;
  
  -- Agregar tablas a la publicación de tiempo real
  ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE follow_ups;
COMMIT;

-- Indices recomendados para optimizar búsquedas y ordenamientos
CREATE INDEX IF NOT EXISTS idx_contacts_last_message_time ON contacts(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON follow_ups(scheduled_date ASC);
