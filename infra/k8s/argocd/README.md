# ArgoCD bootstrap

## Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## Access UI

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Open https://localhost:8080 (accept the self-signed cert).

Get the initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 --decode
```

## Register repo (if private)

```bash
argocd repo add https://github.com/TaroNatsumi/DevOps-exam.git \
  --username <github-username> \
  --password <github-token>
```

## Apply applications

```bash
kubectl apply -k infra/k8s/argocd
```

## GHCR image pull (if private)

Create a pull secret in the `helpdesk` namespace:

```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=taronatsumi \
  --docker-password=YOUR_TOKEN \
  --namespace helpdesk
```

Then set in `infra/helm/helpdesk/values.yaml`:

```yaml
imagePullSecrets:
  - name: ghcr-pull
```
