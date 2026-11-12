package com.devopslab.cmdb.dto;

import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;

import java.time.Instant;
import java.util.UUID;

public record ServerResponse(
        UUID id,
        String hostname,
        String ipAddress,
        OperatingSystem operatingSystem,
        String osVersion,
        Environment environment,
        Location location,
        String organization,
        String ecuFamily,
        String slavePool,
        ServerPurpose purpose,
        Integer cpuCores,
        Integer memoryGb,
        Integer diskGb,
        ServerStatus status,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
