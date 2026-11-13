# devops-lab

This is a Kubernetes lab. It runs a small CMDB application (an inventory of servers in AWS and Azure) on a local
minikube cluster. The app is a Spring Boot backend, a React frontend and PostgreSQL. Around it I built what a small
production setup needs: a Helm chart, GitOps with Argo CD, a CI pipeline, autoscaling, network policies and monitoring.

## Design

```text
                       GitHub ──push──> GitHub Actions ──> images in ghcr.io
                         │                    │
                         │                    └── writes the new image tag into helm/cmdb/values.yaml
                         v
                      Argo CD ──syncs──> namespace cmdb
                                          user -> Ingress -> frontend -> backend -> PostgreSQL

                      namespace monitoring: Prometheus + Alertmanager
```

**The app.** The frontend is NGINX serving the React build. It also forwards `/api` to the backend, so the browser only
ever talks to one address. The backend is a REST API and keeps its data in PostgreSQL. The database runs as a StatefulSet
with a persistent volume.

**One Helm chart.** Everything the app needs is in `helm/cmdb`: Deployments, Services, Ingress, ConfigMaps, the
StatefulSet, NetworkPolicies, RBAC and autoscalers. I wanted the chart to be the only place where the app is defined,
so there are no loose manifests next to it. `infra/` only holds things that exist once per cluster.

**GitOps.** Argo CD watches the `main` branch and applies the chart to the `cmdb` namespace. Automated sync, prune and
self-heal are on, so the cluster follows Git and manual changes get reverted. There are four Argo CD applications in
`argocd/applications`: the app, the monitoring stack, the alert rules and Headlamp.

**CI/CD.** A push to `main` that changes something in `app/` starts the workflow. It runs the backend and frontend tests,
builds the images for amd64 and arm64, pushes them to GitHub Container Registry with the tag `sha-<commit>`, and then
commits that tag into `helm/cmdb/values.yaml`. Argo CD sees that commit and rolls out the new images. The packages
in GHCR need to be public, otherwise the cluster cannot pull them.

**Security.**
- NetworkPolicies deny everything by default in the `cmdb` namespace. Only these paths are open: ingress controller to
  frontend, frontend to backend, backend to PostgreSQL, and DNS. The ports in the policies are the ports the pods listen
  on (8080 and 5432), not the Service ports.
- RBAC: a `cmdb-readonly` role that can only read pods, services, configmaps and workloads. It cannot read Secrets.
- The frontend and backend run as non-root with a read-only filesystem and no extra Linux capabilities. No pod gets a
  Kubernetes API token.
- The database password is not in Git. It is a Secret called `cmdb-db-secret` that I create by hand.

**Scaling.** The frontend and backend each have a HorizontalPodAutoscaler (1 to 3 replicas, scale up at 70% CPU).
It needs metrics-server. PostgreSQL stays at one replica, so the database is not highly available.

**Monitoring.** Prometheus and Alertmanager (kube-prometheus-stack) run in the `monitoring` namespace. I wrote seven alert
rules for the app: frontend or backend down, PostgreSQL down, missing replicas, pod not ready, many restarts, memory
close to the limit and a nearly full database volume. The alerts use the metrics Kubernetes provides, because the backend
does not export its own metrics.

## Repository layout

```text
.github/workflows/ci-cd.yaml   the pipeline
app/                           backend and frontend code, Dockerfiles, docker-compose (see app/README.md)
helm/cmdb/                     the Helm chart
argocd/applications/           Argo CD applications
infra/cluster/                 namespaces, Argo CD ingress, Hubble
infra/monitoring/              settings for the monitoring stack and the alert rules
infra/headlamp/                settings for Headlamp
```

## Installation

I used minikube with three nodes and Cilium. You also need kubectl and helm.

**1. Cluster**

```bash
minikube start --nodes 3 --cni=cilium
minikube addons enable ingress
minikube addons enable metrics-server
kubectl apply -f infra/cluster/namespaces.yaml
```

**2. Argo CD**

```bash
kubectl create namespace argocd
kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

To open it through the ingress, Argo CD has to serve plain HTTP, because the ingress controller already handles it:

```bash
kubectl -n argocd patch configmap argocd-cmd-params-cm --type merge -p '{"data":{"server.insecure":"true"}}'
kubectl -n argocd rollout restart deploy argocd-server
kubectl apply -f infra/cluster/argocd-ingress.yaml
```

**3. Database password**

```bash
kubectl -n cmdb create secret generic cmdb-db-secret --from-literal=DB_PASSWORD='choose-a-password'
```

**4. Let Argo CD read the repository**

The repository is private, so Argo CD needs a read-only deploy key.

```bash
ssh-keygen -t ed25519 -N '' -f ./argocd-deploy-key
```

Add `argocd-deploy-key.pub` on GitHub under Settings, Deploy keys (leave "Allow write access" unchecked). Then:

```bash
kubectl -n argocd create secret generic repo-devops-lab \
  --from-literal=type=git \
  --from-literal=url=git@github.com:robertberes/devops-lab.git \
  --from-file=sshPrivateKey=./argocd-deploy-key
kubectl -n argocd label secret repo-devops-lab argocd.argoproj.io/secret-type=repository
rm ./argocd-deploy-key ./argocd-deploy-key.pub
```

**5. Deploy**

```bash
kubectl apply -f argocd/applications/cmdb.yaml
kubectl apply -f argocd/applications/monitoring.yaml
```

Wait until `monitoring` is healthy (the first sync takes a few minutes), then:

```bash
kubectl apply -f argocd/applications/cmdb-alerts.yaml
kubectl apply -f argocd/applications/headlamp.yaml
kubectl -n argocd get applications
```

The alert rules need the CRDs that the monitoring stack installs, which is why they come after it.

## Usage

Add this line to `/etc/hosts`:

```text
127.0.0.1 cmdb.local argocd.local prometheus.local alertmanager.local headlamp.local hubble.local
```

and keep one port-forward to the ingress controller running:

```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8080:80
```

Everything is then reachable on port 8080:

- the CMDB app: http://cmdb.local:8080
- Argo CD: http://argocd.local:8080 (user `admin`)
- Prometheus: http://prometheus.local:8080
- Alertmanager: http://alertmanager.local:8080
- Headlamp, a Kubernetes UI: http://headlamp.local:8080
- Hubble, Cilium's view of network traffic: http://hubble.local:8080

The Argo CD admin password and the Headlamp login token:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
kubectl -n headlamp create token headlamp
```

Headlamp is read-only. Its account is bound to the built-in `view` role, so it can look at the cluster but cannot change
anything or read Secrets. Prometheus and Alertmanager have no login, which is fine for a local lab but not for a shared
cluster.

In the app you can search and filter the servers, sort the list, open a server, and create, edit or delete servers. The
overview page shows some statistics. Sample servers are loaded when the database is empty (`backend.seedEnabled` in
`helm/cmdb/values.yaml`), so there is something to look at right away. Set it to `false` for a clean database.

### Changing something

Edit the chart, commit and push. Argo CD picks it up within a few minutes. For example, change
`autoscaling.backend.maxReplicas` and watch `kubectl -n cmdb get hpa`.

The settings you will probably touch are all in `helm/cmdb/values.yaml`: image tags (the pipeline sets these), the
Secret name, the volume size, the ingress host, the autoscaling limits and whether NetworkPolicies and RBAC are created.
You can also install the chart without Argo CD:

```bash
helm upgrade --install cmdb ./helm/cmdb --namespace cmdb
```

### Trying the autoscaler

Send a lot of requests to the app and watch the backend get more replicas:

```bash
kubectl -n cmdb get hpa -w
kubectl -n cmdb top pods
```

After the load stops, scaling back down takes about five minutes.

### Trying an alert

Scale the backend down to zero and wait about two minutes:

```bash
kubectl -n cmdb scale deploy/backend --replicas=0
```

`CmdbFrontendOrBackendDown` should show up in Prometheus under Alerts and in Alertmanager. Bring the backend back with
`--replicas=1`.

### Trying the network policies

Start a throwaway pod and try to reach the database. It should fail, and in Hubble (namespace `cmdb`, verdict `dropped`)
you can see the blocked connection:

```bash
kubectl -n cmdb run stray --image=busybox:1.37 --restart=Never --command -- sleep 180
kubectl -n cmdb exec stray -- nc -z -w 3 postgres 5432
kubectl -n cmdb delete pod stray
```

## Running the app without Kubernetes

`app/README.md` explains how to run the backend and the frontend on their own, how to run the tests, and how to start
everything with Docker Compose.

## Limitations

- PostgreSQL runs as a single replica.
- Alertmanager has a `null` receiver, so alerts show up in its UI but no email or chat message is sent.
- The backend has no metrics of its own, so the alerts are based on Kubernetes metrics only.
- The alert for a full database volume does not work on minikube, because its storage does not report volume metrics.
- The app itself has no login. Access is restricted only by the network.
