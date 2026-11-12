package com.devopslab.cmdb.service;

import com.devopslab.cmdb.TestData;
import com.devopslab.cmdb.dto.ServerFilter;
import com.devopslab.cmdb.dto.ServerResponse;
import com.devopslab.cmdb.dto.ServerStatsResponse;
import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Server;
import com.devopslab.cmdb.entity.ServerStatus;
import com.devopslab.cmdb.exception.DuplicateHostnameException;
import com.devopslab.cmdb.exception.InvalidRequestException;
import com.devopslab.cmdb.exception.ResourceNotFoundException;
import com.devopslab.cmdb.mapper.ServerMapper;
import com.devopslab.cmdb.repository.ServerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServerServiceTest {

    @Mock
    ServerRepository repository;
    @Spy
    ServerMapper mapper = new ServerMapper();

    ServerService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        service = new ServerService(repository, mapper);
    }

    @Test
    void createSavesServerAndReturnsResponse() {
        when(repository.existsByHostnameIgnoreCase("web-01")).thenReturn(false);
        when(repository.saveAndFlush(any(Server.class))).thenAnswer(inv -> inv.getArgument(0));

        ServerResponse response = service.create(TestData.request(" web-01 "));

        assertThat(response.hostname()).isEqualTo("web-01");
        assertThat(response.status()).isEqualTo(ServerStatus.ACTIVE);
    }

    @Test
    void createRejectsDuplicateHostname() {
        when(repository.existsByHostnameIgnoreCase("web-01")).thenReturn(true);

        assertThatThrownBy(() -> service.create(TestData.request("web-01")))
                .isInstanceOf(DuplicateHostnameException.class);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void getThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(id)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getReturnsServer() {
        UUID id = UUID.randomUUID();
        Server server = mapper.toEntity(TestData.request("web-01"));
        when(repository.findById(id)).thenReturn(Optional.of(server));

        assertThat(service.get(id).hostname()).isEqualTo("web-01");
    }

    @Test
    void updateAppliesChanges() {
        UUID id = UUID.randomUUID();
        Server existing = mapper.toEntity(TestData.request("web-01"));
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.existsByHostnameIgnoreCaseAndIdNot("web-02", id)).thenReturn(false);
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        ServerResponse response = service.update(id, TestData.request("web-02"));

        assertThat(response.hostname()).isEqualTo("web-02");
    }

    @Test
    void updateRejectsHostnameUsedByAnotherServer() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(new Server()));
        when(repository.existsByHostnameIgnoreCaseAndIdNot("taken", id)).thenReturn(true);

        assertThatThrownBy(() -> service.update(id, TestData.request("taken")))
                .isInstanceOf(DuplicateHostnameException.class);
    }

    @Test
    void deleteRemovesServer() {
        UUID id = UUID.randomUUID();
        Server server = new Server();
        when(repository.findById(id)).thenReturn(Optional.of(server));

        service.delete(id);

        verify(repository).delete(server);
    }

    @Test
    void deleteThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void listBuildsSpecificationAndCapsPageSize() {
        Page<Server> page = new PageImpl<>(List.of(mapper.toEntity(TestData.request("web-01"))));
        when(repository.findAll(any(Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var result = service.list(new ServerFilter("web", null, Environment.DEV, null, null, null),
                PageRequest.of(0, 5000, Sort.by("hostname")));

        assertThat(result.content()).hasSize(1);
        ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        verify(repository).findAll(any(Specification.class), captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(ServerService.MAX_PAGE_SIZE);
    }

    @Test
    void listRejectsUnknownSortField() {
        assertThatThrownBy(() -> service.list(new ServerFilter(null, null, null, null, null, null),
                PageRequest.of(0, 10, Sort.by("password"))))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void statsAggregatesCountsAndFillsMissingCategories() {
        when(repository.countByStatus()).thenReturn(List.of(
                new Object[]{ServerStatus.ACTIVE, 5L}, new Object[]{ServerStatus.MAINTENANCE, 2L}));
        when(repository.countByEnvironment()).thenReturn(List.<Object[]>of(new Object[]{Environment.PROD, 7L}));
        when(repository.countByOperatingSystem()).thenReturn(List.of());
        when(repository.countByLocation()).thenReturn(List.of());
        when(repository.countByPurpose()).thenReturn(List.of());

        ServerStatsResponse stats = service.stats();

        assertThat(stats.total()).isEqualTo(7);
        assertThat(stats.active()).isEqualTo(5);
        assertThat(stats.inactive()).isZero();
        assertThat(stats.maintenance()).isEqualTo(2);
        assertThat(stats.byEnvironment()).hasSize(Environment.values().length);
        assertThat(stats.byEnvironment()).anyMatch(i -> i.label().equals("PROD") && i.count() == 7);
        assertThat(stats.byEnvironment()).anyMatch(i -> i.label().equals("DEV") && i.count() == 0);
    }
}
