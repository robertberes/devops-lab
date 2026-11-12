package com.devopslab.cmdb.dto;

import java.util.List;

public record ServerStatsResponse(
        long total,
        long active,
        long inactive,
        long maintenance,
        List<CountItem> byEnvironment,
        List<CountItem> byOperatingSystem,
        List<CountItem> byLocation,
        List<CountItem> byPurpose
) {
}
