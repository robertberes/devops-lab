package com.devopslab.cmdb.dto;

import java.util.List;

public record FilterOptionsResponse(
        List<String> operatingSystems,
        List<String> environments,
        List<String> locations,
        List<String> purposes,
        List<String> statuses
) {
}
