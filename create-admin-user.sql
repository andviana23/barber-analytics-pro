-- ==========================================
-- SCRIPT DE CRIAÇÃO DE USUÁRIO ADMIN
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- PASSO 1: Primeiro, crie o usuário através do Auth do Supabase
-- (Via Dashboard: Authentication > Users > Add User)
-- Email: andrey@tratodebarbados.com
-- Senha: @Aa30019258

-- PASSO 2: Após criar o usuário, execute este script para associá-lo
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário criado

-- Exemplo de como atualizar o user_metadata via SQL:
-- UPDATE auth.users 
-- SET 
--   user_metadata = jsonb_build_object(
--     'role', 'admin',
--     'full_name', 'Andrey - Administrador',
--     'created_by', 'system'
--   )
-- WHERE email = 'andrey@tratodebarbados.com';

-- PASSO 3: Criar uma unidade de teste para o usuário (opcional)
-- INSERT INTO units (name, user_id, status, is_active) 
-- VALUES (
--   'Unidade Admin - Teste',
--   'USER_ID_AQUI', -- Substitua pelo ID real
--   TRUE,
--   TRUE
-- );

-- PASSO 4: Verificar se o usuário foi criado corretamente
SELECT 
  id,
  email,
  user_metadata,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'andrey@tratodebarbados.com';

-- PASSO 5: Verificar se as policies RLS estão funcionando
-- (Execute após fazer login com o usuário criado)
-- SELECT * FROM units WHERE user_id = auth.uid();

SELECT 'Usuário admin deve ser criado via Supabase Dashboard primeiro!' as importante;