package com.devopslab.cmdb.controller;

import com.devopslab.cmdb.dto.FilterOptionsResponse;
import com.devopslab.cmdb.dto.PageResponse;
import com.devopslab.cmdb.dto.ServerFilter;
import com.devopslab.cmdb.dto.ServerRequest;
import com.devopslab.cmdb.dto.ServerResponse;
import com.devopslab.cmdb.dto.ServerStatsResponse;
import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;
import com.devopslab.cmdb.service.ServerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/servers")
@Tag(name = "Servers")
public class ServerController {

    private final ServerService service;

    public ServerController(ServerService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List servers with search, filters, sorting (?sort=hostname,asc) and pagination")
    public PageResponse<ServerResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OperatingSystem operatingSystem,
            @RequestParam(required = false) Environment environment,
            @RequestParam(required = false) Location location,
            @RequestParam(required = false) ServerPurpose purpose,
            @RequestParam(required = false) ServerStatus status,
            @PageableDefault(size = 20, sort = "hostname", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.list(new ServerFilter(search, operatingSystem, environment, location, purpose, status),
                pageable);
    }

    @GetMapping("/stats")
    @Operation(summary = "Aggregated statistics for the dashboard")
    public ServerStatsResponse stats() {
        return service.stats();
    }

    @GetMapping("/filters")
    @Operation(summary = "Available values for the filter dropdowns")
    public FilterOptionsResponse filters() {
        return service.filterOptions();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get server details")
    public ServerResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a server")
    public ResponseEntity<ServerResponse> create(@Valid @RequestBody ServerRequest request) {
        ServerResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a server")
    public ServerResponse update(@PathVariable UUID id, @Valid @RequestBody ServerRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a server")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
