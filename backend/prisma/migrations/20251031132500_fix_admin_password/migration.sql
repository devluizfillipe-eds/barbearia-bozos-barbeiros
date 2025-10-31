-- UpdateAdminPassword
UPDATE "admins"
SET "senha_hash" = '$2b$10$BLoo1S.woYGUWIeqdxXIgOOueUuOnAl0XNCIVb60N51spO8BlKzqe'
WHERE "login" = 'admin';