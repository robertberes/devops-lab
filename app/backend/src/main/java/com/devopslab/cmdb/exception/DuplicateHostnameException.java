package com.devopslab.cmdb.exception;

public class DuplicateHostnameException extends RuntimeException {
    public DuplicateHostnameException(String hostname) {
        super("A server with hostname '" + hostname + "' already exists");
    }
}
