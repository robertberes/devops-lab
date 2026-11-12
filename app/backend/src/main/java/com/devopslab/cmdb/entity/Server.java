package com.devopslab.cmdb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "servers")
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String hostname;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_system", nullable = false, length = 32)
    private OperatingSystem operatingSystem;

    @Column(name = "os_version", length = 64)
    private String osVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Environment environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Location location;

    @Column(length = 128)
    private String organization;

    @Column(name = "ecu_family", length = 64)
    private String ecuFamily;

    @Column(name = "slave_pool", length = 128)
    private String slavePool;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServerPurpose purpose;

    @Column(name = "cpu_cores")
    private Integer cpuCores;

    @Column(name = "memory_gb")
    private Integer memoryGb;

    @Column(name = "disk_gb")
    private Integer diskGb;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServerStatus status;

    @Column(length = 2000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public OperatingSystem getOperatingSystem() { return operatingSystem; }
    public void setOperatingSystem(OperatingSystem operatingSystem) { this.operatingSystem = operatingSystem; }
    public String getOsVersion() { return osVersion; }
    public void setOsVersion(String osVersion) { this.osVersion = osVersion; }
    public Environment getEnvironment() { return environment; }
    public void setEnvironment(Environment environment) { this.environment = environment; }
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }
    public String getEcuFamily() { return ecuFamily; }
    public void setEcuFamily(String ecuFamily) { this.ecuFamily = ecuFamily; }
    public String getSlavePool() { return slavePool; }
    public void setSlavePool(String slavePool) { this.slavePool = slavePool; }
    public ServerPurpose getPurpose() { return purpose; }
    public void setPurpose(ServerPurpose purpose) { this.purpose = purpose; }
    public Integer getCpuCores() { return cpuCores; }
    public void setCpuCores(Integer cpuCores) { this.cpuCores = cpuCores; }
    public Integer getMemoryGb() { return memoryGb; }
    public void setMemoryGb(Integer memoryGb) { this.memoryGb = memoryGb; }
    public Integer getDiskGb() { return diskGb; }
    public void setDiskGb(Integer diskGb) { this.diskGb = diskGb; }
    public ServerStatus getStatus() { return status; }
    public void setStatus(ServerStatus status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
