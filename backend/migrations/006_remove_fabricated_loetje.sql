-- Remove fabricated Loetje locations that do not exist on loetje.nl
DELETE FROM locations WHERE source_id IN ('loetje-007', 'loetje-008');
