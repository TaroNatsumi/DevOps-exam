# Manual Steps for Project Completion

This guide outlines the steps you need to perform manually to complete the setup of the DevOps project.

## 1. Secrets Configuration

### GitHub Secrets
To allow the CI/CD pipeline to push images to the GitHub Container Registry (GHCR), you might need to ensure your repository settings allow write access to packages for GITHUB_TOKEN.
1.  Go to your Repository Settings -> Actions -> General.
2.  In "Workflow permissions", select "Read and write permissions".
3.  Click "Save".

Alternatively, if you are pushing to a different registry or need a Personal Access Token (PAT):
1.  Create a PAT with `write:packages` and `read:packages` scopes.
2.  Add it as a repository secret named `GHCR_PAT` (if you modified the workflow to use it, currently it uses `GITHUB_TOKEN` which is recommended).

### Kubernetes Pull Secret
To pull the image from GHCR in your Kubernetes cluster, you need a secret.
Replace `YOUR_TOKEN` with your GitHub PAT (Personal Access Token) that has `read:packages` scope.
Replace `YOUR_USERNAME` with your GitHub username.

```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN \
  --namespace helpdesk
```

## 2. ArgoCD Setup

### Install ArgoCD (if not already installed)
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Apply Applications
Apply the ArgoCD application manifests to deploy the monitoring stack and the application.

```bash
kubectl apply -f infra/k8s/argocd/apps.yaml
```

**Note**: Ensure the `repoURL` in `infra/k8s/argocd/apps.yaml` matches your repository URL.

## 3. Accessing Services

Once deployed, you can access the services using port-forwarding.

### ArgoCD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
Open [https://localhost:8080](https://localhost:8080).
Username: `admin`
Password: Get it via `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

### Application
```bash
kubectl port-forward svc/helpdesk -n helpdesk 8000:80
```
Open [http://localhost:8000](http://localhost:8000).

### Grafana
```bash
kubectl port-forward svc/grafana -n observability 3000:80
```
Open [http://localhost:3000](http://localhost:3000).
Default login (from values): `admin` / `admin` (or check the secret if changed).

## 4. Verification

1.  **Check metrics**:
    Visit [http://localhost:8000/metrics](http://localhost:8000/metrics) and look for `helpdesk_tickets_created_total` and `helpdesk_ticket_creation_duration_seconds`.

2.  **Generate Traffic**:
    Create some tickets in the UI to see metrics change.

3.  **Check Grafana**:
    Go to Grafana -> Dashboards to see if metrics are being scraped and logs are appearing from Loki.
