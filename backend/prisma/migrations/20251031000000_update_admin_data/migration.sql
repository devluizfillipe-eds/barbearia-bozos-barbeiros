-- Atualizar o admin existente
UPDATE "Admin"
SET 
  "nome" = 'Adriano',
  "login" = 'adriano.adm',
  "senha_hash" = '$2a$12$7nqkDT4Fu2nhaMMDPWVj5OzRaJux.MEjzSS/jgkX4LLNElL2h2w/S' -- hash para senha '123456'
WHERE "login" = 'admin';