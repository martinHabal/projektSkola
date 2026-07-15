-- Vytvoření tabulky pro prázdniny
CREATE TABLE prazdniny (
    id INT AUTO_INCREMENT PRIMARY KEY,
    datum_zacatku DATE NOT NULL,
    datum_konce DATE NOT NULL,
    nazev VARCHAR(100) NOT NULL,
    delka_dnu INT,
    poznamka TEXT,
    UNIQUE KEY unique_prazdniny (datum_zacatku, datum_konce, nazev)
);

-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX idx_datum_zacatku ON prazdniny(datum_zacatku);
CREATE INDEX idx_datum_konce ON prazdniny(datum_konce);


//procedura pro generovani prazdnin
DELIMITER //

CREATE PROCEDURE GenerateHolidays2026()
BEGIN
    -- Proměnné pro výpočet
    DECLARE v_rok INT DEFAULT 2026;
    DECLARE v_datum DATE;
    DECLARE v_den INT;
    
    -- Smazání starých dat pro rok 2026
    DELETE FROM prazdniny WHERE YEAR(datum_zacatku) = v_rok OR YEAR(datum_konce) = v_rok;
    
    -- Hlavní prázdniny
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu) VALUES
    (CONCAT(v_rok, '-06-27'), CONCAT(v_rok, '-08-31'), 'Hlavní prázdniny', 'skolni', 66);
    
    -- Podzimní prázdniny
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu) VALUES
    (CONCAT(v_rok, '-10-26'), CONCAT(v_rok, '-10-30'), 'Podzimní prázdniny', 'skolni', 5);
    
    -- Vánoční prázdniny
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu) VALUES
    (CONCAT(v_rok, '-12-23'), CONCAT(v_rok+1, '-01-03'), 'Vánoční prázdniny', 'skolni', 12);
    
    -- Pololetní prázdniny
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu) VALUES
    (CONCAT(v_rok, '-01-30'), CONCAT(v_rok, '-01-30'), 'Pololetní prázdniny', 'skolni', 1);
    
    -- Generování jarních prázdnin podle krajů
    CALL GenerateSpringHolidays(v_rok);
    
    -- Velikonoční prázdniny
    CALL GenerateEasterHolidays(v_rok);
    
    -- Státní svátky
    CALL GenerateStateHolidays(v_rok);
END //

-- Procedura pro generování jarních prázdnin
CREATE PROCEDURE GenerateSpringHolidays(IN p_rok INT)
BEGIN
    -- Jarní prázdniny podle krajů (2026)
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu, poznamka) VALUES
    (CONCAT(p_rok, '-02-02'), CONCAT(p_rok, '-02-08'), 'Jarní prázdniny - Praha', 'skolni', 7, 'Praha a okolí'),
    (CONCAT(p_rok, '-02-09'), CONCAT(p_rok, '-02-15'), 'Jarní prázdniny - Středočeský kraj', 'skolni', 7, 'Středočeský kraj'),
    (CONCAT(p_rok, '-02-16'), CONCAT(p_rok, '-02-22'), 'Jarní prázdniny - Jihočeský kraj', 'skolni', 7, 'Jihočeský kraj'),
    (CONCAT(p_rok, '-02-23'), CONCAT(p_rok, '-03-01'), 'Jarní prázdniny - Plzeňský kraj', 'skolni', 7, 'Plzeňský kraj'),
    (CONCAT(p_rok, '-03-02'), CONCAT(p_rok, '-03-08'), 'Jarní prázdniny - Karlovarský kraj', 'skolni', 7, 'Karlovarský kraj'),
    (CONCAT(p_rok, '-03-09'), CONCAT(p_rok, '-03-15'), 'Jarní prázdniny - Ústecký kraj', 'skolni', 7, 'Ústecký kraj'),
    (CONCAT(p_rok, '-03-16'), CONCAT(p_rok, '-03-22'), 'Jarní prázdniny - Liberecký kraj', 'skolni', 7, 'Liberecký kraj'),
    (CONCAT(p_rok, '-03-23'), CONCAT(p_rok, '-03-29'), 'Jarní prázdniny - Královéhradecký kraj', 'skolni', 7, 'Královéhradecký kraj'),
    (CONCAT(p_rok, '-03-30'), CONCAT(p_rok, '-04-05'), 'Jarní prázdniny - Pardubický kraj', 'skolni', 7, 'Pardubický kraj'),
    (CONCAT(p_rok, '-04-06'), CONCAT(p_rok, '-04-12'), 'Jarní prázdniny - Kraj Vysočina', 'skolni', 7, 'Kraj Vysočina'),
    (CONCAT(p_rok, '-04-13'), CONCAT(p_rok, '-04-19'), 'Jarní prázdniny - Jihomoravský kraj', 'skolni', 7, 'Jihomoravský kraj'),
    (CONCAT(p_rok, '-04-20'), CONCAT(p_rok, '-04-26'), 'Jarní prázdniny - Olomoucký kraj', 'skolni', 7, 'Olomoucký kraj'),
    (CONCAT(p_rok, '-04-27'), CONCAT(p_rok, '-05-03'), 'Jarní prázdniny - Moravskoslezský kraj', 'skolni', 7, 'Moravskoslezský kraj'),
    (CONCAT(p_rok, '-05-04'), CONCAT(p_rok, '-05-10'), 'Jarní prázdniny - Zlínský kraj', 'skolni', 7, 'Zlínský kraj');
END //

-- Procedura pro generování Velikonočních prázdnin
CREATE PROCEDURE GenerateEasterHolidays(IN p_rok INT)
BEGIN
    DECLARE v_velikonoce DATE;
    DECLARE v_velky_patek DATE;
    DECLARE v_velikonocni_pondeli DATE;
    
    -- Výpočet Velikonoc (Gaussův algoritmus)
    SET v_velikonoce = CalculateEaster(p_rok);
    SET v_velky_patek = DATE_SUB(v_velikonoce, INTERVAL 2 DAY);
    SET v_velikonocni_pondeli = DATE_ADD(v_velikonoce, INTERVAL 1 DAY);
    
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu, poznamka) VALUES
    (v_velky_patek, v_velikonocni_pondeli, 'Velikonoční prázdniny', 'skolni', 4, 'Velký pátek a Velikonoční pondělí');
END //

-- Procedura pro generování státních svátků
CREATE PROCEDURE GenerateStateHolidays(IN p_rok INT)
BEGIN
    INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, typ, delka_dnu) VALUES
    (CONCAT(p_rok, '-01-01'), CONCAT(p_rok, '-01-01'), 'Den obnovy samostatnosti', 'statni', 1),
    (CONCAT(p_rok, '-05-01'), CONCAT(p_rok, '-05-01'), 'Svátek práce', 'statni', 1),
    (CONCAT(p_rok, '-05-08'), CONCAT(p_rok, '-05-08'), 'Den vítězství', 'statni', 1),
    (CONCAT(p_rok, '-07-05'), CONCAT(p_rok, '-07-06'), 'Cyril a Metoděj + Jan Hus', 'statni', 2),
    (CONCAT(p_rok, '-09-28'), CONCAT(p_rok, '-09-28'), 'Den české státnosti', 'statni', 1),
    (CONCAT(p_rok, '-10-28'), CONCAT(p_rok, '-10-28'), 'Den vzniku ČSR', 'statni', 1),
    (CONCAT(p_rok, '-11-17'), CONCAT(p_rok, '-11-17'), 'Den boje za svobodu', 'statni', 1);
END //

DELIMITER ;

-- Spuštění procedury
CALL GenerateHolidays2026();


//dotaz ktery pak spojim se svatkama
-- Zobrazení všech prázdnin v roce 2026
SELECT * FROM prazdniny 
WHERE YEAR(datum_zacatku) = 2026 OR YEAR(datum_konce) = 2026
ORDER BY datum_zacatku;

-- Zobrazení školních prázdnin
SELECT * FROM prazdniny 
WHERE typ = 'skolni' AND YEAR(datum_zacatku) = 2026
ORDER BY datum_zacatku;

-- Zobrazení prázdnin podle měsíce
SELECT 
    MONTH(datum_zacatku) as mesic,
    COUNT(*) as pocet_prázdnin,
    SUM(delka_dnu) as celkem_dnu
FROM prazdniny 
WHERE YEAR(datum_zacatku) = 2026
GROUP BY MONTH(datum_zacatku)
ORDER BY mesic;

-- Nejdelší prázdniny v roce
SELECT nazev, delka_dnu, datum_zacatku, datum_konce
FROM prazdniny 
WHERE YEAR(datum_zacatku) = 2026
ORDER BY delka_dnu DESC
LIMIT 5;

-- Prázdniny podle krajů (jarní)
SELECT * FROM prazdniny 
WHERE nazev LIKE 'Jarní prázdniny%'
AND YEAR(datum_zacatku) = 2026
ORDER BY datum_zacatku;

-- Kolik dní volna mají studenti v roce 2026
SELECT SUM(delka_dnu) as total_holiday_days
FROM prazdniny 
WHERE typ = 'skolni' 
AND (YEAR(datum_zacatku) = 2026 OR YEAR(datum_konce) = 2026);

-- Prázdniny podle typu
SELECT 
    typ,
    COUNT(*) as pocet,
    SUM(delka_dnu) as celkem_dnu,
    AVG(delka_dnu) as prumerna_delka
FROM prazdniny 
WHERE YEAR(datum_zacatku) = 2026
GROUP BY typ;

-- Zobrazení aktuálních prázdnin
SELECT * FROM prazdniny 
WHERE CURDATE() BETWEEN datum_zacatku AND datum_konce;

-- Prázdniny v konkrétním měsíci
SELECT * FROM prazdniny 
WHERE MONTH(datum_zacatku) = 7 AND YEAR(datum_zacatku) = 2026
ORDER BY datum_zacatku;

-- Překrývající se prázdniny
SELECT 
    a.nazev as prázdniny1,
    b.nazev as prázdniny2,
    GREATEST(a.datum_zacatku, b.datum_zacatku) as prekryv_zacatek,
    LEAST(a.datum_konce, b.datum_konce) as prekryv_konec
FROM prazdniny a
JOIN prazdniny b ON 
    a.id < b.id AND
    a.datum_zacatku <= b