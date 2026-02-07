# Vahter Project Setup Guide

This guide covers the manual steps to deploy and verify the Vahter (Python) application.

## 1. CI/CD & Secrets

### GitHub Secrets
Ensure your repository has write access to GHCR or add a `GHCR_PAT` if needed (same as the Node.js project).

### Kubernetes Pull Secret
If you haven't created it yet for the other project:
```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN \
  --namespace vahter
```

## 2. ArgoCD Setup

### Apply Application
```bash
kubectl apply -f vahter/argocd/application.yaml
```

**Note**: Ensure the `repoURL` in `vahter/argocd/application.yaml` matches your repository URL.

## 3. Accessing Vahter

### Port Forwarding
```bash
# Vahter App
kubectl port-forward svc/vahter -n vahter 30002:3000
```
Open [http://localhost:30002](http://localhost:30002).

### Metrics
Visit [http://localhost:30002/metrics](http://localhost:30002/metrics).

## 4. Local Run (Optional)

If you have Python installed:
```bash
cd vahter
pip install -r requirements.txt
python app.py
```
Visit http://localhost:3000.
