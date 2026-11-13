# devops-lab

Mini CMDB (server inventory) used as a DevOps lab: Spring Boot backend, React frontend and PostgreSQL, deployed to
Kubernetes with one Helm chart and Argo CD, with images built and pushed by GitHub Actions.

```text
Ingress -> frontend (NGINX) -> backend (Spring Boot) -> PostgreSQL
```

## Layout

```text
.github/workflows/ci-cd.yaml   tests, image build and push, image tag update in the chart
app/backend, app/frontend      application code and Dockerfiles
app/docker-compose.yml         run everything locally with Docker
helm/cmdb                      Helm chart with all Kubernetes resources of the application
argocd/applications/cmdb.yaml  Argo CD Application
infra/cluster                  namespaces and cluster setup notes
infra/monitoring               monitoring notes
```

## Flow

1. Push to `main` changes something in `app/`.
2. GitHub Actions runs the tests and builds `linux/amd64` and `linux/arm64` images.
3. The images are pushed to `ghcr.io/robertberes/cmdb-frontend` and `cmdb-backend` with the tag `sha-<commit>`.
4. The workflow writes the new tags to `helm/cmdb/values.yaml` and commits them with `[skip ci]`.
5. Argo CD sees the commit and syncs the chart into the `cmdb` namespace.
