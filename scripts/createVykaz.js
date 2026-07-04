CREATE TABLE work_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,          -- Unikátní ID záznamu
    employee_id INT NOT NULL,                   -- ID zaměstnance (cizí klíč)
    hours_worked DECIMAL(5,2) NOT NULL,        -- Počet hodin (např. 7.50)
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,  -- Přesčasové hodiny (nad rámec úvazku)

    task_description TEXT NULL,                 -- Popis činnosti
    status ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
    submitted_at DATETIME NULL,                 -- Kdy bylo odesláno ke schválení
    approved_by INT NULL,                       -- ID manažera, který schválil
    approved_at DATETIME NULL,                  -- Datum schválení
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Cizí klíče (předpokládám existenci tabulek employees a projects)
    FOREIGN KEY (employee_id) REFERENCES employees(id),
 
    -- Indexy pro rychlé vyhledávání
    INDEX idx_employee_date (employee_id, work_date),
    INDEX idx_status (status),
    INDEX idx_date (work_date)
);