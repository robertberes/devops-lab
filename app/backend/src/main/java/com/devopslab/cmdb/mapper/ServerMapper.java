package com.devopslab.cmdb.mapper;

import com.devopslab.cmdb.dto.ServerRequest;
import com.devopslab.cmdb.dto.ServerResponse;
import com.devopslab.cmdb.entity.Server;
import org.springframework.stereotype.Component;

@Component
public class ServerMapper {

    public ServerResponse toResponse(Server s) {
        return new ServerResponse(s.getId(), s.getHostname(), s.getIpAddress(), s.getOperatingSystem(),
                s.getOsVersion(), s.getEnvironment(), s.getLocation(), s.getOrganization(), s.getEcuFamily(),
                s.getSlavePool(), s.getPurpose(), s.getCpuCores(), s.getMemoryGb(), s.getDiskGb(), s.getStatus(),
                s.getDescription(), s.getCreatedAt(), s.getUpdatedAt());
    }

    public Server toEntity(ServerRequest request) {
        Server server = new Server();
        apply(request, server);
        return server;
    }

    /** Copies all request fields onto the entity; blank optional strings become null. */
    public void apply(ServerRequest r, Server s) {
        s.setHostname(r.hostname().trim());
        s.setIpAddress(blankToNull(r.ipAddress()));
        s.setOperatingSystem(r.operatingSystem());
        s.setOsVersion(blankToNull(r.osVersion()));
        s.setEnvironment(r.environment());
        s.setLocation(r.location());
        s.setOrganization(blankToNull(r.organization()));
        s.setEcuFamily(blankToNull(r.ecuFamily()));
        s.setSlavePool(blankToNull(r.slavePool()));
        s.setPurpose(r.purpose());
        s.setCpuCores(r.cpuCores());
        s.setMemoryGb(r.memoryGb());
        s.setDiskGb(r.diskGb());
        s.setStatus(r.status());
        s.setDescription(blankToNull(r.description()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
