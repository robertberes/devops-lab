CREATE TABLE servers (
    id               UUID          PRIMARY KEY,
    hostname         VARCHAR(255)  NOT NULL,
    ip_address       VARCHAR(45),
    operating_system VARCHAR(32)   NOT NULL,
    os_version       VARCHAR(64),
    environment      VARCHAR(32)   NOT NULL,
    location         VARCHAR(32)   NOT NULL,
    organization     VARCHAR(128),
    ecu_family       VARCHAR(64),
    slave_pool       VARCHAR(128),
    purpose          VARCHAR(32)   NOT NULL,
    cpu_cores        INTEGER       CHECK (cpu_cores >= 0),
    memory_gb        INTEGER       CHECK (memory_gb >= 0),
    disk_gb          INTEGER       CHECK (disk_gb >= 0),
    status           VARCHAR(32)   NOT NULL,
    description      VARCHAR(2000),
    created_at       TIMESTAMPTZ   NOT NULL,
    updated_at       TIMESTAMPTZ   NOT NULL
);

-- Hostnames are unique regardless of case.
CREATE UNIQUE INDEX uq_servers_hostname_lower ON servers (LOWER(hostname));
CREATE INDEX idx_servers_environment ON servers (environment);
CREATE INDEX idx_servers_status ON servers (status);
CREATE INDEX idx_servers_created_at ON servers (created_at DESC);
