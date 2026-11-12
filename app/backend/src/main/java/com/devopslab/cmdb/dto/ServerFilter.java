package com.devopslab.cmdb.dto;

import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;

public record ServerFilter(
        String search,
        OperatingSystem operatingSystem,
        Environment environment,
        Location location,
        ServerPurpose purpose,
        ServerStatus status
) {
}
