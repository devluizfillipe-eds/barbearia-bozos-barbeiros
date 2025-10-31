-- CreateDefaultAdmin
INSERT INTO "admins" ("nome", "login", "senha_hash", "data_criacao")
VALUES (
  'Administrador',
  'admin',
  '$2a$10$8DQS3E1kA9fgHUjIP6hfhO4CYO.9lyf/CP6oHbZ6wj3.EfiWDtPtO', -- senha: admin123
  CURRENT_TIMESTAMP
);