-- AZURE location replaced by AZURE; CI_SERVER purpose replaced by CI_SERVER.
UPDATE servers SET location = 'AZURE' WHERE location = 'AZURE';
UPDATE servers SET purpose = 'CI_SERVER' WHERE purpose = 'CI_SERVER';
