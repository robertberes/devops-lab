package com.devopslab.cmdb;

import com.devopslab.cmdb.dto.ServerRequest;
import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;

public final class TestData {

    private TestData() {
    }

    public static ServerRequest request(String hostname) {
        return new ServerRequest(hostname, "10.0.0.1", OperatingSystem.UBUNTU, "22.04", Environment.DEV,
                Location.AWS, "Platform", "m5.large", null, ServerPurpose.WORKER, 4, 16, 100,
                ServerStatus.ACTIVE, "test server");
    }

    public static ServerRequest request(String hostname, Environment env, Location location, ServerStatus status) {
        return new ServerRequest(hostname, null, OperatingSystem.UBUNTU, null, env, location, null, null, null,
                ServerPurpose.WORKER, null, null, null, status, null);
    }
}
