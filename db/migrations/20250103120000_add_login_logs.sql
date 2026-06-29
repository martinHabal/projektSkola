-- 20250103120000_add_login_logs.sql
-- Tabulka pro logování přihlašovacích pokusů

CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'ID uživatele (pokud je znám)',
    username VARCHAR(50) NOT NULL COMMENT 'Zadané uživatelské jméno',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP adresa klienta (IPv4/IPv6)',
    user_agent VARCHAR(255) NOT NULL COMMENT 'User-Agent prohlížeče',
    success BOOLEAN NOT NULL COMMENT 'Zda bylo přihlášení úspěšné',
    error_message VARCHAR(255) NULL COMMENT 'Chybové hlášení (pokud selhalo)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Cizí klíč na tabulku users (volitelný)
    CONSTRAINT fk_login_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL,
    
    -- Indexy pro rychlé vyhledávání
    INDEX idx_login_logs_user (user_id),
    INDEX idx_login_logs_username (username),
    INDEX idx_login_logs_success (success),
    INDEX idx_login_logs_created (created_at),
    INDEX idx_login_logs_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Logy přihlašovacích pokusů';