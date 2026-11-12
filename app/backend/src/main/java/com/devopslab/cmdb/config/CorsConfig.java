package com.devopslab.cmdb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS is only needed when the frontend is served from a different origin than the API
 * (e.g. a standalone Vite dev server). Behind the NGINX proxy it stays disabled (empty list).
 */
@Configuration
public class CorsConfig {

    @Bean
    WebMvcConfigurer corsConfigurer(@Value("${app.cors.allowed-origins:}") String[] allowedOrigins) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                if (allowedOrigins.length > 0 && !allowedOrigins[0].isBlank()) {
                    registry.addMapping("/api/**")
                            .allowedOrigins(allowedOrigins)
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
                }
            }
        };
    }
}
