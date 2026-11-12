package com.devopslab.cmdb.config;

import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.Server;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;
import com.devopslab.cmdb.repository.ServerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.devopslab.cmdb.entity.Environment.*;
import static com.devopslab.cmdb.entity.Location.*;
import static com.devopslab.cmdb.entity.OperatingSystem.*;
import static com.devopslab.cmdb.entity.ServerPurpose.*;
import static com.devopslab.cmdb.entity.ServerStatus.*;

/** Inserts sample inventory for local development. Enabled with APP_SEED_ENABLED=true; no-op if data exists. */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final ServerRepository repository;

    public DataSeeder(ServerRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            log.info("Seeder skipped: servers table is not empty");
            return;
        }
        List<Server> servers = List.of(
                server("jenkins-master-prod-01", "10.10.1.10", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "m5.2xlarge", null, CI_SERVER, 8, 32, 500, ACTIVE, "Primary Jenkins controller."),
                server("jenkins-master-uat-01", "10.20.1.10", UBUNTU, "22.04", UAT, AWS, "Platform Engineering", "m5.xlarge", null, CI_SERVER, 4, 16, 250, ACTIVE, "Jenkins controller for UAT pipelines."),
                server("jenkins-agent-prod-01", "10.10.2.11", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "c5.2xlarge", "linux-builders", WORKER, 8, 16, 200, ACTIVE, null),
                server("jenkins-agent-prod-02", "10.10.2.12", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "c5.2xlarge", "linux-builders", WORKER, 8, 16, 200, ACTIVE, null),
                server("jenkins-agent-prod-03", "10.10.2.13", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "c5.4xlarge", "linux-builders", WORKER, 16, 32, 200, MAINTENANCE, "Kernel upgrade in progress."),
                server("jenkins-agent-win-01", "10.10.2.21", WINDOWS, "Server 2022", PROD, AWS, "Platform Engineering", "m5.xlarge", "windows-builders", WORKER, 4, 16, 300, ACTIVE, "Builds .NET components."),
                server("jenkins-agent-dev-01", "10.30.2.11", UBUNTU, "24.04", DEV, AZURE, "Platform Engineering", "Standard_D4s_v5", "dev-builders", WORKER, 4, 8, 100, ACTIVE, null),
                server("jenkins-agent-dev-02", "10.30.2.12", UBUNTU, "24.04", DEV, AZURE, "Platform Engineering", "Standard_D4s_v5", "dev-builders", WORKER, 4, 8, 100, INACTIVE, "Decommissioning candidate."),
                server("proxy-prod-01", "10.10.3.5", UBUNTU, "22.04", PROD, AWS, "Network Operations", "t3.large", null, PROXY, 2, 8, 50, ACTIVE, "Outbound HTTP proxy."),
                server("proxy-prod-02", "10.10.3.6", UBUNTU, "22.04", PROD, AWS, "Network Operations", "t3.large", null, PROXY, 2, 8, 50, ACTIVE, "Outbound HTTP proxy (secondary)."),
                server("proxy-uat-01", "10.20.3.5", UBUNTU, "22.04", UAT, AZURE, "Network Operations", "Standard_B2s", null, PROXY, 2, 4, 40, ACTIVE, null),
                server("artifactory-prod-01", "10.10.4.10", UBUNTU, "22.04", PROD, AWS, "Release Engineering", "r5.2xlarge", null, ARTIFACTORY, 8, 64, 2000, ACTIVE, "Binary repository manager."),
                server("artifactory-dr-01", "10.40.4.10", UBUNTU, "22.04", PROD, AZURE, "Release Engineering", "Standard_D8s_v5", null, ARTIFACTORY, 8, 32, 2000, INACTIVE, "Disaster recovery replica."),
                server("storage-prod-01", "10.10.5.20", UBUNTU, "20.04", PROD, AWS, "Infrastructure", "i3.xlarge", null, STORAGE, 4, 30, 4000, ACTIVE, "NFS storage for build workspaces."),
                server("storage-test-01", "10.50.5.20", UBUNTU, "20.04", TEST, AZURE, "Infrastructure", "Standard_D8s_v5", null, STORAGE, 4, 16, 1000, ACTIVE, null),
                server("tools-storage-prod-01", "10.10.5.30", UBUNTU, "22.04", PROD, AWS, "Infrastructure", "m5.large", null, TOOLS_STORAGE, 2, 8, 1000, ACTIVE, "Stores toolchains and SDK bundles."),
                server("cache-prod-01", "10.10.6.10", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "r6g.large", null, CACHE, 2, 16, 100, ACTIVE, "Redis cache cluster node."),
                server("cache-prod-02", "10.10.6.11", UBUNTU, "22.04", PROD, AWS, "Platform Engineering", "r6g.large", null, CACHE, 2, 16, 100, ACTIVE, "Redis cache cluster node."),
                server("mq-prod-01", "10.10.7.10", UBUNTU, "22.04", PROD, AWS, "Messaging", "m5.xlarge", null, MQ, 4, 16, 200, ACTIVE, "RabbitMQ node."),
                server("mq-uat-01", "10.20.7.10", UBUNTU, "22.04", UAT, AZURE, "Messaging", "Standard_D4s_v5", null, MQ, 4, 8, 100, MAINTENANCE, "RabbitMQ upgrade testing."),
                server("monitoring-prod-01", "10.10.8.10", UBUNTU, "24.04", PROD, AWS, "SRE", "m5.xlarge", null, MONITORING, 4, 16, 500, ACTIVE, "Prometheus and Grafana."),
                server("monitoring-test-01", "10.50.8.10", UBUNTU, "24.04", TEST, AZURE, "SRE", "Standard_D4s_v5", null, MONITORING, 2, 8, 200, ACTIVE, null),
                server("systest-runner-01", "10.50.9.11", UBUNTU, "22.04", TEST, AZURE, "QA Automation", "Standard_D8s_v5", "system-tests", SYSTEM_TESTS, 8, 32, 300, ACTIVE, "Runs nightly system test suites."),
                server("systest-runner-02", "10.50.9.12", UBUNTU, "22.04", TEST, AZURE, "QA Automation", "Standard_D8s_v5", "system-tests", SYSTEM_TESTS, 8, 32, 300, ACTIVE, null),
                server("systest-win-01", "10.50.9.21", WINDOWS, "Server 2019", TEST, AZURE, "QA Automation", "Standard_D8s_v5", "system-tests", SYSTEM_TESTS, 8, 32, 300, INACTIVE, "Windows UI test host."),
                server("legacy-ftp-01", "10.30.10.5", OperatingSystem.OTHER, "CentOS 7", DEV, AZURE, "Infrastructure", "Standard_B2s", null, ServerPurpose.OTHER, 1, 2, 80, INACTIVE, "Legacy FTP host scheduled for removal."),
                server("bastion-prod-01", "10.10.0.5", UBUNTU, "22.04", PROD, AWS, "Security", "t3.small", null, ServerPurpose.OTHER, 2, 2, 30, ACTIVE, "SSH bastion."));
        repository.saveAll(servers);
        log.info("Seeded {} sample servers", servers.size());
    }

    private static Server server(String hostname, String ip, OperatingSystem os, String osVersion, Environment env,
                                 Location location, String organization, String ecuFamily, String slavePool,
                                 ServerPurpose purpose, int cpu, int memory, int disk, ServerStatus status,
                                 String description) {
        Server s = new Server();
        s.setHostname(hostname);
        s.setIpAddress(ip);
        s.setOperatingSystem(os);
        s.setOsVersion(osVersion);
        s.setEnvironment(env);
        s.setLocation(location);
        s.setOrganization(organization);
        s.setEcuFamily(ecuFamily);
        s.setSlavePool(slavePool);
        s.setPurpose(purpose);
        s.setCpuCores(cpu);
        s.setMemoryGb(memory);
        s.setDiskGb(disk);
        s.setStatus(status);
        s.setDescription(description);
        return s;
    }
}
