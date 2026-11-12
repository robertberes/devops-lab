-- Converts rows that still use the retired enum values. (V2 was accidentally a no-op; this is the real conversion.)
UPDATE servers SET location = 'AZURE' WHERE location = 'VMWARE';
UPDATE servers SET purpose = 'CI_SERVER' WHERE purpose = 'JENKINS_MASTER';
