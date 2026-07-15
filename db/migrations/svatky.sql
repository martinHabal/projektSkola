CREATE TABLE svatky (
    id INT AUTO_INCREMENT PRIMARY KEY,
    datum DATE NOT NULL,
    nazev VARCHAR(100) NOT NULL,
    den_v_tydnu VARCHAR(20),
    UNIQUE KEY unique_datum (datum)
);

-- Procedura pro generování všech svátků v roce
DELIMITER //

CREATE PROCEDURE GenerateHolidays(IN p_rok INT)
BEGIN
    -- Proměnné pro pohyblivé svátky
    DECLARE velikonoce DATE;
    DECLARE velky_patek DATE;
    DECLARE velikonocni_pondeli DATE;
    
    -- Výpočet Velikonoc (Gaussův algoritmus)
    SET velikonoce = CalculateEaster(p_rok);
    SET velky_patek = DATE_SUB(velikonoce, INTERVAL 2 DAY);
    SET velikonocni_pondeli = DATE_ADD(velikonoce, INTERVAL 1 DAY);
    
    -- Vložení fixních svátků
    INSERT IGNORE INTO svatky (datum, nazev, typ) VALUES
    (CONCAT(p_rok, '-01-01'), 'Den obnovy samostatného českého státu', 'statni'),
    (CONCAT(p_rok, '-05-01'), 'Svátek práce', 'statni'),
    (CONCAT(p_rok, '-05-08'), 'Den vítězství', 'statni'),
    (CONCAT(p_rok, '-07-05'), 'Den slovanských věrozvěstů Cyrila a Metoděje', 'statni'),
    (CONCAT(p_rok, '-07-06'), 'Den upálení mistra Jana Husa', 'statni'),
    (CONCAT(p_rok, '-09-28'), 'Den české státnosti', 'statni'),
    (CONCAT(p_rok, '-10-28'), 'Den vzniku samostatného československého státu', 'statni'),
    (CONCAT(p_rok, '-11-17'), 'Den boje za svobodu a demokracii', 'statni');
    
    -- Vložení pohyblivých svátků
    INSERT IGNORE INTO svatky (datum, nazev, typ) VALUES
    (velky_patek, 'Velký pátek', 'krestansky'),
    (velikonocni_pondeli, 'Velikonoční pondělí', 'krestansky'),
    (CONCAT(p_rok, '-12-24'), 'Štědrý den', 'krestansky'),
    (CONCAT(p_rok, '-12-25'), '1. svátek vánoční', 'krestansky'),
    (CONCAT(p_rok, '-12-26'), '2. svátek vánoční', 'krestansky');
END //

DELIMITER ;

//dotaz pro vyber -> tena pak pujde spolu s prazdnami do routy

-- Zobrazení všech svátků v roce 2026
SELECT * FROM svatky WHERE YEAR(datum) = 2026 ORDER BY datum;

-- Zobrazení pouze státních svátků
SELECT * FROM svatky WHERE typ = 'statni' AND YEAR(datum) = 2026;

-- Zobrazení svátků podle měsíce
SELECT MONTH(datum) as mesic, COUNT(*) as pocet_svatku 
FROM svatky 
WHERE YEAR(datum) = 2026 
GROUP BY MONTH(datum) 
ORDER BY mesic;

-- Zjištění, zda je daný den svátkem
SELECT COUNT(*) > 0 as je_svatek 
FROM svatky 
WHERE datum = '2026-05-08';

-- Výpis svátků s dny v týdnu
SELECT datum, den_v_tydnu, nazev, typ 
FROM svatky 
WHERE YEAR(datum) = 2026 
ORDER BY datum;