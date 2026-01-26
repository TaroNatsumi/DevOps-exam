# DevOps-exam

Simple helpdesk portal (non-ecommerce) with Docker, Helm, ArgoCD, Grafana, Loki, and database metrics.

## What is included

- **Helpdesk site**: Node.js (Express) + server-side HTML.
- **Database**: Postgres.
- **DB metrics**: postgres_exporter scraped by Prometheus.
- **App metrics**: `/metrics` from Express.
- **Logs**: Promtail ships logs to Loki.
- **Visualization**: Grafana with Prometheus + Loki data sources.
- **GitOps**: ArgoCD application manifests.

## Local run (Docker Compose)

```bash
docker-compose up --build
```

- App: http://localhost:8000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (login: `admin` / `admin`)
- Loki: http://localhost:3100

Prometheus targets:
- `app:8000/metrics`
- `postgres_exporter:9187/metrics`

## Kubernetes (Helm)

```bash
helm install helpdesk infra/helm/helpdesk
```

The chart deploys:
- app + service (annotated for Prometheus scrape)
- Postgres statefulset
- postgres_exporter

## Container image (GHCR)

Build and push the backend image:

```bash
docker build -t ghcr.io/taronatsumi/helpdesk:v0.1.0 ./backend
docker push ghcr.io/taronatsumi/helpdesk:v0.1.0
```

If the image is private, create an imagePullSecret in your cluster and reference it in the chart.
Example:

```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=taronatsumi \
  --docker-password=YOUR_TOKEN \
  --namespace helpdesk
```

```yaml
imagePullSecrets:
  - name: ghcr-pull
```

## Kubernetes (ArgoCD)

Apply ArgoCD applications:

```bash
kubectl apply -f infra/k8s/argocd/apps.yaml
```

This creates:
- `helpdesk-app` (Helm chart from `infra/helm/helpdesk`)
- `observability` (Kustomize from `infra/k8s/observability`)

## Repo setup

```bash
echo "# DevOps-exam" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TaroNatsumi/DevOps-exam.git
git push -u origin main
```
