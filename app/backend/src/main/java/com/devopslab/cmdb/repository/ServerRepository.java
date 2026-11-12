package com.devopslab.cmdb.repository;

import com.devopslab.cmdb.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ServerRepository extends JpaRepository<Server, UUID>, JpaSpecificationExecutor<Server> {

    boolean existsByHostnameIgnoreCase(String hostname);

    boolean existsByHostnameIgnoreCaseAndIdNot(String hostname, UUID id);

    // Each aggregate returns rows of [enum value, count]; grouping is done in the database.
    @Query("select s.status, count(s) from Server s group by s.status")
    List<Object[]> countByStatus();

    @Query("select s.environment, count(s) from Server s group by s.environment")
    List<Object[]> countByEnvironment();

    @Query("select s.operatingSystem, count(s) from Server s group by s.operatingSystem")
    List<Object[]> countByOperatingSystem();

    @Query("select s.location, count(s) from Server s group by s.location")
    List<Object[]> countByLocation();

    @Query("select s.purpose, count(s) from Server s group by s.purpose")
    List<Object[]> countByPurpose();
}
