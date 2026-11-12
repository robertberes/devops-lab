package com.devopslab.cmdb.repository;

import com.devopslab.cmdb.dto.ServerFilter;
import com.devopslab.cmdb.entity.Server;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ServerSpecifications {

    private ServerSpecifications() {
    }

    public static Specification<Server> from(ServerFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + escapeLike(filter.search().trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("hostname")), pattern, '\\'),
                        cb.like(cb.lower(root.get("ipAddress")), pattern, '\\')));
            }
            if (filter.operatingSystem() != null) {
                predicates.add(cb.equal(root.get("operatingSystem"), filter.operatingSystem()));
            }
            if (filter.environment() != null) {
                predicates.add(cb.equal(root.get("environment"), filter.environment()));
            }
            if (filter.location() != null) {
                predicates.add(cb.equal(root.get("location"), filter.location()));
            }
            if (filter.purpose() != null) {
                predicates.add(cb.equal(root.get("purpose"), filter.purpose()));
            }
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
