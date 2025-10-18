-- =====================================================
-- SCRIPT PARA TRANSFORMAR USUÁRIO EM ADMINISTRADOR
-- Barber Analytics Pro - Supabase SQL Editor
-- =====================================================

-- PASSO 1: Verificar se o usuário existe
-- Execute esta query primeiro para confirmar que a conta foi criada
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'andrey@tratodebarbados.com';

-- PASSO 2: Atualizar metadados do usuário para administrador
-- Esta query transforma o usuário em administrador
UPDATE auth.users 
SET 
    raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'name', 'Andrey Administrador',
        'permissions', jsonb_build_array('admin', 'gerente', 'barbeiro')
    )
WHERE email = 'andrey@tratodebarbados.com';

-- PASSO 3: Verificar se a atualização foi bem-sucedida
-- Execute esta query para confirmar que o usuário agora é admin
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->'permissions' as permissions
FROM auth.users 
WHERE email = 'andrey@tratodebarbados.com';

-- PASSO 4: (OPCIONAL) Verificar tabelas relacionadas
-- Esta query verifica se existem registros relacionados nas tabelas do sistema
SELECT 
    'profissionais' as tabela,
    count(*) as registros
FROM profissionais p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'andrey@tratodebarbados.com'

UNION ALL

SELECT 
    'access_logs' as tabela,
    count(*) as registros  
FROM access_logs al
JOIN auth.users u ON al.user_id = u.id
WHERE u.email = 'andrey@tratodebarbados.com';

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- =====================================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para "SQL Editor" 
-- 3. Execute o PASSO 1 primeiro para verificar o usuário
-- 4. Execute o PASSO 2 para transformar em admin
-- 5. Execute o PASSO 3 para confirmar a mudança
-- 6. (Opcional) Execute o PASSO 4 para verificar relacionamentos
-- 
-- RESULTADO ESPERADO NO PASSO 3:
-- - role: 'admin'
-- - name: 'Andrey Administrador'
-- - permissions: ["admin", "gerente", "barbeiro"]
-- =====================================================

-- TROUBLESHOOTING:
-- Se o PASSO 1 não retornar nenhum resultado:
-- - Confirme que você criou a conta no Authentication > Users
-- - Verifique se o email está correto
--
-- Se o PASSO 2 falhar:
-- - Verifique se você tem permissões de admin no Supabase
-- - Confirme que está executando no projeto correto
--
-- Se o PASSO 3 mostrar role = null:
-- - Execute o PASSO 2 novamente
-- - Aguarde alguns segundos e execute o PASSO 3 novamente
-- =====================================================