package com.devopslab.cmdb.dto;

import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ServerRequest(
        @NotBlank(message = "Hostname is required")
        @Size(max = 255, message = "Hostname must be at most 255 characters")
        @Pattern(regexp = "^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?$",
                message = "Hostname may contain only letters, digits, '.', '-' and '_'")
        String hostname,

        @Pattern(regexp = ServerRequest.IP_REGEX, message = "Must be a valid IPv4 or IPv6 address")
        String ipAddress,

        @NotNull(message = "Operating system is required") OperatingSystem operatingSystem,
        @Size(max = 64, message = "OS version must be at most 64 characters") String osVersion,
        @NotNull(message = "Environment is required") Environment environment,
        @NotNull(message = "Location is required") Location location,
        @Size(max = 128, message = "Organization must be at most 128 characters") String organization,
        @Size(max = 64, message = "ECU family must be at most 64 characters") String ecuFamily,
        @Size(max = 128, message = "Slave pool must be at most 128 characters") String slavePool,
        @NotNull(message = "Purpose is required") ServerPurpose purpose,
        @PositiveOrZero(message = "CPU cores must not be negative") Integer cpuCores,
        @PositiveOrZero(message = "Memory must not be negative") Integer memoryGb,
        @PositiveOrZero(message = "Disk must not be negative") Integer diskGb,
        @NotNull(message = "Status is required") ServerStatus status,
        @Size(max = 2000, message = "Description must be at most 2000 characters") String description
) {
    static final String IPV4 = "((25[0-5]|2[0-4]\\d|1?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|1?\\d?\\d)){3})";
    static final String IPV6 = "([0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}";
    // Empty string is accepted: the mapper normalizes blank optional values to null.
    static final String IP_REGEX = "^(|" + IPV4 + "|" + IPV6 + ")$";
}
