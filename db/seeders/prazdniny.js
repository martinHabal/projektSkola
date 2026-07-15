-- Vložení všech prázdnin pro rok 2026 (bez sloupce typ)
INSERT INTO prazdniny (datum_zacatku, datum_konce, nazev, delka_dnu, poznamka) VALUES

-- Školní prázdniny
('2026-01-30', '2026-01-30', 'Pololetní prázdniny', 1, 'Pololetní prázdniny 2025/2026'),

-- Jarní prázdniny podle krajů
('2026-02-02', '2026-02-08', 'Jarní prázdniny - Praha', 7, 'Praha a okolí'),
('2026-02-09', '2026-02-15', 'Jarní prázdniny - Středočeský kraj', 7, 'Středočeský kraj'),
('2026-02-16', '2026-02-22', 'Jarní prázdniny - Jihočeský kraj', 7, 'Jihočeský kraj'),
('2026-02-23', '2026-03-01', 'Jarní prázdniny - Plzeňský kraj', 7, 'Plzeňský kraj'),
('2026-03-02', '2026-03-08', 'Jarní prázdniny - Karlovarský kraj', 7, 'Karlovarský kraj'),
('2026-03-09', '2026-03-15', 'Jarní prázdniny - Ústecký kraj', 7, 'Ústecký kraj'),
('2026-03-16', '2026-03-22', 'Jarní prázdniny - Liberecký kraj', 7, 'Liberecký kraj'),
('2026-03-23', '2026-03-29', 'Jarní prázdniny - Královéhradecký kraj', 7, 'Královéhradecký kraj'),
('2026-03-30', '2026-04-05', 'Jarní prázdniny - Pardubický kraj', 7, 'Pardubický kraj'),
('2026-04-06', '2026-04-12', 'Jarní prázdniny - Kraj Vysočina', 7, 'Kraj Vysočina'),
('2026-04-13', '2026-04-19', 'Jarní prázdniny - Jihomoravský kraj', 7, 'Jihomoravský kraj'),
('2026-04-20', '2026-04-26', 'Jarní prázdniny - Olomoucký kraj', 7, 'Olomoucký kraj'),
('2026-04-27', '2026-05-03', 'Jarní prázdniny - Moravskoslezský kraj', 7, 'Moravskoslezský kraj'),
('2026-05-04', '2026-05-10', 'Jarní prázdniny - Zlínský kraj', 7, 'Zlínský kraj'),

-- Velikonoční prázdniny
('2026-04-03', '2026-04-06', 'Velikonoční prázdniny', 4, 'Velký pátek a Velikonoční pondělí'),

-- Hlavní prázdniny
('2026-06-27', '2026-08-31', 'Hlavní prázdniny', 66, 'Letní prázdniny - celá ČR'),

-- Podzimní prázdniny
('2026-10-26', '2026-10-30', 'Podzimní prázdniny', 5, 'Podzimní prázdniny'),

-- Vánoční prázdniny
('2026-12-23', '2027-01-03', 'Vánoční prázdniny', 12, 'Vánoční prázdniny 2026/2027'),

-- Státní svátky (volné dny)
('2026-01-01', '2026-01-01', 'Den obnovy samostatnosti', 1, 'Státní svátek'),
('2026-05-01', '2026-05-01', 'Svátek práce', 1, 'Státní svátek'),
('2026-05-08', '2026-05-08', 'Den vítězství', 1, 'Státní svátek'),
('2026-07-05', '2026-07-06', 'Cyril a Metoděj + Jan Hus', 2, 'Dva státní svátky za sebou'),
('2026-09-28', '2026-09-28', 'Den české státnosti', 1, 'Státní svátek'),
('2026-10-28', '2026-10-28', 'Den vzniku ČSR', 1, 'Státní svátek'),
('2026-11-17', '2026-11-17', 'Den boje za svobodu', 1, 'Státní svátek'),
('2026-12-24', '2026-12-26', 'Vánoční svátky', 3, 'Štědrý den a dva svátky vánoční'),

-- Firemní a ostatní prázdniny
('2026-07-01', '2026-07-31', 'Firemní prázdniny - výroba', 31, 'Celozávodní dovolená'),
('2026-08-01', '2026-08-15', 'Firemní prázdniny - management', 15, 'Dovolená vedení');