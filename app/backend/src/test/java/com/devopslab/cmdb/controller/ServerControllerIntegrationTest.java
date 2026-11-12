package com.devopslab.cmdb.controller;

import com.devopslab.cmdb.TestData;
import com.devopslab.cmdb.entity.Environment;
import com.devopslab.cmdb.entity.Location;
import com.devopslab.cmdb.entity.ServerStatus;
import com.devopslab.cmdb.repository.ServerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full-stack tests against an in-memory H2 database (PostgreSQL mode). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ServerControllerIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ServerRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    private String create(Object body) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/servers").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void crudLifecycle() throws Exception {
        String id = create(TestData.request("web-01"));

        mvc.perform(get("/api/v1/servers/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostname").value("web-01"))
                .andExpect(jsonPath("$.createdAt").exists());

        mvc.perform(put("/api/v1/servers/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(TestData.request("web-renamed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostname").value("web-renamed"));

        mvc.perform(delete("/api/v1/servers/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/servers/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void duplicateHostnameReturnsConflict() throws Exception {
        create(TestData.request("web-01"));

        mvc.perform(post("/api/v1/servers").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(TestData.request("WEB-01"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.hostname").exists());
    }

    @Test
    void invalidInputReturnsFieldErrors() throws Exception {
        String body = """
                {"hostname":"","ipAddress":"999.1.1.1","operatingSystem":"UBUNTU","environment":"DEV",
                 "location":"AWS","purpose":"WORKER","status":"ACTIVE","cpuCores":-1,"memoryGb":-4}
                """;
        mvc.perform(post("/api/v1/servers").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.hostname").exists())
                .andExpect(jsonPath("$.fieldErrors.ipAddress").exists())
                .andExpect(jsonPath("$.fieldErrors.cpuCores").exists())
                .andExpect(jsonPath("$.fieldErrors.memoryGb").exists());
    }

    @Test
    void invalidEnumValueReturnsBadRequest() throws Exception {
        String body = """
                {"hostname":"x1","operatingSystem":"UBUNTU","environment":"STAGING",
                 "location":"AWS","purpose":"WORKER","status":"ACTIVE"}
                """;
        mvc.perform(post("/api/v1/servers").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listSupportsSearchFiltersSortingAndPagination() throws Exception {
        create(TestData.request("alpha-dev", Environment.DEV, Location.AWS, ServerStatus.ACTIVE));
        create(TestData.request("beta-prod", Environment.PROD, Location.AWS, ServerStatus.INACTIVE));
        create(TestData.request("gamma-prod", Environment.PROD, Location.AZURE, ServerStatus.ACTIVE));
        create(TestData.request(TestData.request("ip-host").hostname()));

        mvc.perform(get("/api/v1/servers").param("environment", "PROD"))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/v1/servers").param("environment", "PROD").param("location", "AZURE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].hostname").value("gamma-prod"));
        mvc.perform(get("/api/v1/servers").param("status", "INACTIVE"))
                .andExpect(jsonPath("$.content[0].hostname").value("beta-prod"));
        mvc.perform(get("/api/v1/servers").param("search", "BETA"))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/v1/servers").param("search", "10.0.0"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].hostname").value("ip-host"));
        mvc.perform(get("/api/v1/servers").param("sort", "hostname,desc").param("size", "2"))
                .andExpect(jsonPath("$.content[0].hostname").value("ip-host"))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));
        mvc.perform(get("/api/v1/servers").param("sort", "nonsense,asc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void statsAreAggregatedFromDatabase() throws Exception {
        create(TestData.request("a", Environment.DEV, Location.AWS, ServerStatus.ACTIVE));
        create(TestData.request("b", Environment.PROD, Location.AWS, ServerStatus.ACTIVE));
        create(TestData.request("c", Environment.PROD, Location.AZURE, ServerStatus.MAINTENANCE));

        MvcResult result = mvc.perform(get("/api/v1/servers/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.active").value(2))
                .andExpect(jsonPath("$.inactive").value(0))
                .andExpect(jsonPath("$.maintenance").value(1))
                .andReturn();
        assertThat(result.getResponse().getContentAsString())
                .contains("{\"label\":\"PROD\",\"count\":2}", "{\"label\":\"AWS\",\"count\":2}");
    }

    @Test
    void filterOptionsListEnumValues() throws Exception {
        mvc.perform(get("/api/v1/servers/filters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.environments[3]").value("PROD"))
                .andExpect(jsonPath("$.purposes.length()").value(11));
    }

    @Test
    void healthProbesAreExposed() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
    }
}
