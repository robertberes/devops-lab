package com.devopslab.cmdb.service;

import com.devopslab.cmdb.dto.CountItem;
import com.devopslab.cmdb.dto.FilterOptionsResponse;
import com.devopslab.cmdb.dto.PageResponse;
import com.devopslab.cmdb.dto.ServerFilter;
import com.devopslab.cmdb.dto.ServerRequest;
import com.devopslab.cmdb.dto.ServerResponse;
import com.devopslab.cmdb.dto.ServerStatsResponse;
import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.OperatingSystem;
import com.devopslab.cmdb.entity.Server;
import com.devopslab.cmdb.entity.ServerPurpose;
import com.devopslab.cmdb.entity.ServerStatus;
import com.devopslab.cmdb.exception.DuplicateHostnameException;
import com.devopslab.cmdb.exception.InvalidRequestException;
import com.devopslab.cmdb.exception.ResourceNotFoundException;
import com.devopslab.cmdb.mapper.ServerMapper;
import com.devopslab.cmdb.repository.ServerRepository;
import com.devopslab.cmdb.repository.ServerSpecifications;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ServerService {

    static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("hostname", "ipAddress", "operatingSystem",
            "environment", "location", "purpose", "cpuCores", "memoryGb", "diskGb", "status", "createdAt",
            "updatedAt");

    private final ServerRepository repository;
    private final ServerMapper mapper;

    public ServerService(ServerRepository repository, ServerMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public PageResponse<ServerResponse> list(ServerFilter filter, Pageable pageable) {
        validateSort(pageable.getSort());
        Pageable bounded = PageRequest.of(pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), pageable.getSort());
        return PageResponse.from(repository.findAll(ServerSpecifications.from(filter), bounded)
                .map(mapper::toResponse));
    }

    public ServerResponse get(UUID id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public ServerResponse create(ServerRequest request) {
        String hostname = request.hostname().trim();
        if (repository.existsByHostnameIgnoreCase(hostname)) {
            throw new DuplicateHostnameException(hostname);
        }
        return mapper.toResponse(repository.saveAndFlush(mapper.toEntity(request)));
    }

    @Transactional
    public ServerResponse update(UUID id, ServerRequest request) {
        Server server = findOrThrow(id);
        String hostname = request.hostname().trim();
        if (repository.existsByHostnameIgnoreCaseAndIdNot(hostname, id)) {
            throw new DuplicateHostnameException(hostname);
        }
        mapper.apply(request, server);
        return mapper.toResponse(repository.saveAndFlush(server));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(findOrThrow(id));
    }

    public ServerStatsResponse stats() {
        Map<String, Long> statuses = counts(repository.countByStatus(), ServerStatus.values());
        long active = statuses.get(ServerStatus.ACTIVE.name());
        long inactive = statuses.get(ServerStatus.INACTIVE.name());
        long maintenance = statuses.get(ServerStatus.MAINTENANCE.name());

        return new ServerStatsResponse(
                active + inactive + maintenance, active, inactive, maintenance,
                toItems(counts(repository.countByEnvironment(), Environment.values())),
                toItems(counts(repository.countByOperatingSystem(), OperatingSystem.values())),
                toItems(counts(repository.countByLocation(), Location.values())),
                toItems(counts(repository.countByPurpose(), ServerPurpose.values())));
    }

    public FilterOptionsResponse filterOptions() {
        return new FilterOptionsResponse(names(OperatingSystem.values()), names(Environment.values()),
                names(Location.values()), names(ServerPurpose.values()), names(ServerStatus.values()));
    }

    private Server findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Server " + id + " not found"));
    }

    private void validateSort(Sort sort) {
        sort.forEach(order -> {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new InvalidRequestException("Cannot sort by '" + order.getProperty()
                        + "'. Allowed: " + String.join(", ", SORTABLE_FIELDS.stream().sorted().toList()));
            }
        });
    }

    /** Turns grouped rows into a map covering every enum constant, so categories with no servers show as 0. */
    private static Map<String, Long> counts(List<Object[]> rows, Enum<?>[] allValues) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Enum<?> value : allValues) {
            result.put(value.name(), 0L);
        }
        for (Object[] row : rows) {
            result.put(((Enum<?>) row[0]).name(), ((Number) row[1]).longValue());
        }
        return result;
    }

    private static List<CountItem> toItems(Map<String, Long> counts) {
        return counts.entrySet().stream().map(e -> new CountItem(e.getKey(), e.getValue())).toList();
    }

    private static List<String> names(Enum<?>[] values) {
        return Arrays.stream(values).map(Enum::name).toList();
    }
}
