<br>

<div align="center">

# 🚀 GitHub AI Agent — Web Dashboard

### Control your entire GitHub account through plain English commands

Powered by **Google Gemini**, **LangGraph ReAct**, and the **GitHub MCP Server** —
with a real-time streaming DevOps dashboard.

<br>

**Built & maintained by [Pavan Kalyan Pachuru](https://github.com/iam-pavanpachuru)**

[![GitHub](https://img.shields.io/badge/GitHub-iam--pavanpachuru-181717?style=flat&logo=github)](https://github.com/iam-pavanpachuru)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Pavan%20Kalyan%20Pachuru-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/pavan-kalyan-pachuru-538a4016b)
[![Email](https://img.shields.io/badge/Email-pavanpachuru1%40gmail.com-EA4335?style=flat&logo=gmail)](mailto:pavanpachuru1@gmail.com)

</div>

<br>

---

## 📋 Table of Contents

1. [What Is This?](#-what-is-this)
2. [How It Works](#-how-it-works)
3. [Architecture](#️-architecture)
4. [Prerequisites](#-prerequisites)
5. [Getting Your API Keys & Credentials](#-getting-your-api-keys--credentials)
6. [Local Deployment — Docker](#-local-deployment--docker)
7. [Cloud Deployment — AWS ECR + EKS](#️-cloud-deployment--aws-ecr--eks)
8. [CI/CD — GitHub Actions Workflow](#-cicd--github-actions-workflow)
9. [GitOps with ArgoCD](#-gitops-with-argocd-optional)
10. [Available MCP Tools](#️-available-mcp-tools)
11. [Project Structure](#-project-structure)
12. [Environment Variables Reference](#-environment-variables-reference)
13. [API Endpoints](#-api-endpoints)
14. [Troubleshooting](#-troubleshooting)

---

## 🤖 What Is This?

**GitHub AI Agent** is a self-hosted web dashboard that lets you manage GitHub repositories using natural language — no CLI, no scripting. Just describe what you want to do and the AI agent handles the rest.

**Example commands you can run:**

```
List ALL repositories for my GitHub account
Create a branch feat/dashboard in `devops-test-demo`
Push a README.md file to my `my-new-repo` repository
Create an issue titled "Fix login bug" in `my-app`
Fork the repository `spring-hello-pavan`
Delete the repository `test-repo`
Search all my repos that contain "terraform"
List all open pull requests in `gitops-security-pavan`
```

**💡 Tip — Available Tools Carousel:**
You can also browse and use the **Available MCP Tools** carousel on the dashboard instead of typing from scratch. Each tool card shows what it does, and clicking it **auto-fills a ready-to-run sample prompt** in the input bar — great for discovering what the agent can do without memorising any commands.

> The carousel supports live search, so you can filter tools by name instantly.

Every step the agent takes — tool calls, reasoning, results — streams live to your browser as it happens.

<img src="images/available_tools.png" alt="Available Tools" width="600">

---

## ⚙️ How It Works

1. You type a task in the dashboard input bar and click **Execute**
2. The FastAPI backend receives the task and starts an SSE stream back to your browser
3. A **LangGraph ReAct agent** is created, equipped with all GitHub MCP tools
4. The agent uses **Google Gemini** to reason about the task and decide which tools to call
5. Tool calls go to the **GitHub MCP Server** (a Node.js process), which calls the GitHub REST API
6. Every step — tool call, result, agent thought, final answer — streams back to the terminal in real time
7. For destructive actions (e.g. delete), the UI shows a **safety confirmation modal** before proceeding

The agent automatically falls back from `gemini-3.1-flash-lite-preview` → `gemini-2.5-flash` if the first model fails.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│       Browser (Dashboard UI)    │
│  HTML + CSS + Vanilla JS        │
│  • Tools carousel               │
│  • Live terminal log stream     │
│  • Activity feed + cmd history  │
│  • Delete confirmation modal    │
└────────────┬────────────────────┘
             │  HTTP + SSE (Server-Sent Events)
             ▼
┌─────────────────────────────────┐
│    FastAPI Backend  (app.py)    │
│  GET /                          │
│  GET /api/status                │
│  GET /api/stream-run            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   LangGraph ReAct Agent         │
│   create_react_agent(llm, tools)│
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Google Gemini LLM             │
│   Primary:  gemini-3.1-flash-   │
│             lite-preview        │
│   Fallback: gemini-2.5-flash    │
└────────────┬────────────────────┘
             │  reasons + selects tools
             ▼
┌─────────────────────────────────────────────┐
│  Tool Layer                                 │
│  ├── GitHub MCP Server (27 tools, Node.js)  │
│  │   @modelcontextprotocol/server-github    │
│  └── Custom Tool: delete_repository         │
│      (direct GitHub REST API call)          │
└────────────┬────────────────────────────────┘
             │
             ▼
      GitHub REST API
             │
             ▼
     Your GitHub Account
```

| Component | Technology |
|---|---|
| Web UI | Vanilla HTML / CSS / JavaScript |
| Backend | FastAPI + Uvicorn (async Python 3.11) |
| AI Agent | LangGraph `create_react_agent` |
| LLM — Primary | `gemini-3.1-flash-lite-preview` |
| LLM — Fallback | `gemini-2.5-flash` |
| GitHub Tools | `@modelcontextprotocol/server-github` (Node.js 20) |
| Real-time Streaming | Server-Sent Events (SSE) |
| Container | Docker multi-stage build (Python 3.11-slim + Node.js 20) |
| Cloud Registry | Amazon ECR |
| Cloud Orchestration | Amazon EKS (Kubernetes) |
| GitOps | ArgoCD |

---

## ✅ Prerequisites

### For Local Deployment (Docker)

| Tool | Minimum Version | Install Guide |
|---|---|---|
| Docker | 20.x | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| Git | Any | [git-scm.com](https://git-scm.com) |

### For Cloud Deployment (EKS)

| Tool | Minimum Version | Install Guide |
|---|---|---|
| Docker | 20.x | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| AWS CLI | v2 | [docs.aws.amazon.com/cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) |
| kubectl | 1.27+ | [kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/) |
| eksctl | Any | [eksctl.io](https://eksctl.io) |

---

## 🔑 Getting Your API Keys & Credentials

You need exactly **3 values** to run the application.

---

### 1 — Google Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key in new project**
4. Copy the key (starts with `AIza...`)

> ✅ The free tier is sufficient for this project. No credit card required.

---

### 2 — GitHub Personal Access Token (PAT)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a descriptive name, e.g. `github-ai-agent`
4. Set an expiration date as appropriate
5. Select the following scopes:

```
☑ repo              ← full repository read/write/create
☑ workflow          ← manage GitHub Actions workflows
☑ delete_repo       ← required for the Delete Repository tool
☑ read:user         ← read your profile and username
```

1. Click **Generate token** and copy immediately — it is only shown once

---

### 3 — Your GitHub Username

Your exact GitHub username as it appears in your profile URL.
Example: for `github.com/iam-pavanpachuru`, the username is `iam-pavanpachuru`

---

## 🐳 Local Deployment — Docker

This is the fastest way to run the application. Everything is packaged in a single Docker image.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/iam-pavanpachuru/github-ai-agent-web.git
cd github-ai-agent-web
```

---

### Step 2 — Create your `.env` file

In the project root, create a file named exactly `.env`:

```bash
# .env  —  DO NOT commit this file to version control
GOOGLE_API_KEY=AIzaSy...your_key_here
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...your_token_here
GITHUB_USERNAME=your-github-username
```

> ⚠️ The `.env` file is listed in `.gitignore` and will not be committed by accident.
> Never share or expose these credentials publicly.

---

### Step 3 — Build the Docker image

```bash
docker build -t github-ai-agent:latest .
```

The Dockerfile uses a **two-stage build**:

| Stage | What it does |
|---|---|
| `builder` | Installs Python deps + Node.js 20 + GitHub MCP npm package |
| `runtime` | Copies only what is needed — produces a lean final image |

> 🕐 The first build takes 3–5 minutes due to the npm install. Subsequent builds use Docker layer cache and are much faster.

---

### Step 4 — Run the container

```bash
docker run -d \
  --name github-ai-agent \
  --env-file .env \
  -p 8000:8000 \
  github-ai-agent:latest
```

| Flag | Purpose |
|---|---|
| `-d` | Run in background (detached) |
| `--name github-ai-agent` | Give the container a name for easy management |
| `--env-file .env` | Pass your credentials from the `.env` file |
| `-p 8000:8000` | Map host port 8000 → container port 8000 |

The container includes a **health check** that hits `/api/status` every 30 seconds. The container will show as `healthy` once everything initialises successfully.

---

### Step 5 — Open the dashboard

```
http://localhost:8000
```

You should see the **GitHub AI Agent Control Center** with all three status indicators showing green:

- 🟢 GitHub MCP Server
- 🟢 Gemini LLM API
- 🟢 Backend Service

---

### Useful Docker commands

```bash
# View live streaming logs
docker logs -f github-ai-agent

# Check container health status
docker inspect --format='{{.State.Health.Status}}' github-ai-agent

# Stop the running container
docker stop github-ai-agent

# Remove the container (not the image)
docker rm github-ai-agent

# Remove the image entirely
docker rmi github-ai-agent:latest

# One-liner: rebuild image and restart container
docker build -t github-ai-agent:latest . && \
  docker stop github-ai-agent && \
  docker rm github-ai-agent && \
  docker run -d \
    --name github-ai-agent \
    --env-file .env \
    -p 8000:8000 \
    github-ai-agent:latest
```

---

## ☁️ Cloud Deployment — AWS ECR + EKS

Deploy the application to the cloud so it is publicly accessible on a stable URL.

### Overview

```
Your Machine
     │
     │  docker build + push
     ▼
Amazon ECR  ──────────────────────────────────────────────
(Container Registry)                                      │
                                                          │ image pull
                                                          ▼
                                               Amazon EKS Cluster
                                               ┌─────────────────────┐
                                               │ Namespace:          │
                                               │   devops-agent      │
                                               │                     │
                                               │ Deployment:         │
                                               │   devops-agent      │
                                               │   1 replica         │
                                               │   cpu: 100m→500m    │
                                               │   mem: 256Mi→512Mi  │
                                               │                     │
                                               │ Service:            │
                                               │   LoadBalancer      │
                                               │   port 80 → 8000   │
                                               └────────┬────────────┘
                                                        │
                                                        ▼
                                               Public URL (EXTERNAL-IP)
                                               http://<elb-hostname>
```

---

### Phase 1 — Build and Push Image to Amazon ECR

#### 1.1 — Configure the AWS CLI

```bash
aws configure
```

Enter when prompted:

- **AWS Access Key ID** — from your IAM user
- **AWS Secret Access Key** — from your IAM user
- **Default region** — e.g. `eu-north-1`
- **Output format** — `json`

#### 1.2 — Create an ECR repository *(first time only)*

```bash
aws ecr create-repository \
  --repository-name pavan-devops-ecr \
  --region eu-north-1
```

The output will include a `repositoryUri` that looks like:

```
145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr
```

Save this URI — you will use it in every step below.

> Replace `145043400170` with your own AWS account ID and `eu-north-1` with your region throughout all commands.

#### 1.3 — Authenticate Docker with ECR

```bash
aws ecr get-login-password --region eu-north-1 | \
  docker login \
    --username AWS \
    --password-stdin \
    145043400170.dkr.ecr.eu-north-1.amazonaws.com
```

You should see: `Login Succeeded`

#### 1.4 — Build and tag the image for ECR

```bash
# Build
docker build -t github-ai-agent:latest .

# Tag with your ECR repository URI
docker tag github-ai-agent:latest \
  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest
```

#### 1.5 — Push to ECR

```bash
docker push \
  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest
```

You can verify the push succeeded in the AWS Console under **ECR → Repositories → pavan-devops-ecr**.

---

### Phase 2 — Deploy to Amazon EKS

#### 2.1 — Create the EKS cluster *(first time only)*

```bash
eksctl create cluster \
  --name devops-agent-cluster \
  --region eu-north-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed
```

> ⏳ This takes approximately 15 minutes. `eksctl` automatically updates your `~/.kube/config` when done.

#### 2.2 — Update kubeconfig *(if cluster already exists)*

```bash
aws eks update-kubeconfig \
  --region eu-north-1 \
  --name devops-agent-cluster
```

Confirm access:

```bash
kubectl get nodes
```

#### 2.3 — Create the namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

This creates the `devops-agent` namespace where all resources will live.

#### 2.4 — Create the Kubernetes Secret for credentials

Your API keys are injected at runtime via a Kubernetes Secret — they are never baked into the image.

```bash
kubectl create secret generic devops-agent-secret \
  --namespace devops-agent \
  --from-literal=GOOGLE_API_KEY=AIzaSy...your_key... \
  --from-literal=GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...your_token... \
  --from-literal=GITHUB_USERNAME=your-github-username
```

> The `deployment.yaml` already references this secret by name via `envFrom.secretRef.name: devops-agent-secret`. The container reads the env vars at startup.

Verify the secret was created:

```bash
kubectl get secret devops-agent-secret -n devops-agent
```

#### 2.5 — Update the image URI in `k8s/deployment.yaml`

Open `k8s/deployment.yaml` and update the `image:` field to point to your ECR repository:

```yaml
containers:
  - name: devops-agent
    image: 145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest
```

#### 2.6 — Grant EKS nodes permission to pull from ECR

The node group's IAM role must have permission to pull images from ECR.

```bash
# Find your node group role name
eksctl get nodegroup \
  --cluster devops-agent-cluster \
  --region eu-north-1

# Attach the ECR read-only policy to that role
aws iam attach-role-policy \
  --role-name <your-nodegroup-role-name> \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

#### 2.7 — Apply all Kubernetes manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Or apply the entire folder at once:

```bash
kubectl apply -f k8s/
```

#### 2.8 — Verify the deployment

```bash
# Watch pods start up
kubectl get pods -n devops-agent -w

# Check all resources in the namespace
kubectl get all -n devops-agent
```

Expected pod output once running:

```
NAME                             READY   STATUS    RESTARTS   AGE
devops-agent-7d9f6b8c4-xk2lm    1/1     Running   0          2m
```

#### 2.9 — Get the public URL

```bash
kubectl get service devops-agent-service -n devops-agent
```

Wait until the `EXTERNAL-IP` column is populated (1–2 minutes):

```
NAME                    TYPE           CLUSTER-IP     EXTERNAL-IP                                           PORT(S)
devops-agent-service    LoadBalancer   10.100.42.17   a531568bc9fa54bbe9b38-xxx.eu-north-1.elb.amazonaws.com   80:31234/TCP
```

Open the EXTERNAL-IP in your browser:

```
http://a531568bc9fa54bbe9b38-xxx.eu-north-1.elb.amazonaws.com
```

---

### Phase 3 — Rolling Updates (push new code)

When you update the application code, rebuild and push, then restart the deployment:

```bash
# 1. Rebuild and push the new image
docker build -t github-ai-agent:latest .
docker tag github-ai-agent:latest \
  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest
docker push \
  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest

# 2. Trigger a rolling restart (zero-downtime)
kubectl rollout restart deployment/devops-agent -n devops-agent

# 3. Watch the rollout
kubectl rollout status deployment/devops-agent -n devops-agent
```

---

## 🤖 CI/CD — GitHub Actions Workflow

The repository includes a ready-made GitHub Actions workflow at `.github/workflows/build-push-image.yml` that automatically **builds the Docker image and pushes it to Amazon ECR** every time you push to the `main` branch — or manually on demand.

This means you never need to run `docker build` and `docker push` on your local machine after the initial setup.

---

### What the workflow does

```
Push to main  ──or──  Manual trigger (workflow_dispatch)
        │
        ▼
1. Checkout code
        │
        ▼
2. Set image tag
   (custom tag from input  OR  Git commit SHA)
        │
        ▼
3. Set up Docker Buildx
        │
        ▼
4. Authenticate to AWS via OIDC (no long-lived keys)
        │
        ▼
5. Create ECR repository if it does not already exist
   (with image scanning + AES256 encryption enabled)
        │
        ▼
6. Login to Amazon ECR
        │
        ▼
7. Build Docker image (with GitHub Actions layer cache)
        │
        ▼
8. Push image to ECR
   • Tagged with Git SHA  →  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:<sha>
   • Tagged as latest     →  145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:latest
        │
        ▼
9. Print a summary table to the Actions run page
```

---

### Triggers

| Trigger | When it fires |
|---|---|
| `push` to `main` | Automatically on every commit merged to `main` |
| `workflow_dispatch` | Manually from the GitHub Actions UI — lets you specify a custom image tag |

When triggered manually, you can enter a custom image tag (e.g. `v1.2.0`). If left blank, the workflow uses the **Git commit SHA** as the tag, so every image is uniquely traceable to its source commit.

---

### One-time setup — AWS OIDC trust (no static keys)

The workflow authenticates to AWS using **OIDC** (OpenID Connect) — this means no AWS access keys are ever stored as GitHub secrets. Instead, GitHub gets a short-lived token that AWS trusts.

#### Step 1 — Create an IAM OIDC Identity Provider for GitHub

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

#### Step 2 — Create an IAM Role that GitHub Actions can assume

Create a file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<YOUR_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:iam-pavanpachuru/github-ai-agent-web:*"
        },
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

```bash
aws iam create-role \
  --role-name GitHubActionsECRRole \
  --assume-role-policy-document file://trust-policy.json

# Attach ECR push permissions
aws iam attach-role-policy \
  --role-name GitHubActionsECRRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

Copy the Role ARN from the output — it looks like:

```
arn:aws:iam::145043400170:role/GitHubActionsECRRole
```

#### Step 3 — Add the Role ARN as a GitHub Secret

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `AWS_ROLE_ARN`
5. Value: paste the Role ARN from the step above

That is the only secret required. No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed.

---

### How the image is tagged

| Scenario | Tag applied |
|---|---|
| Push to `main` (no custom tag) | `<git-commit-sha>` + `latest` |
| Manual trigger with custom tag | `<your-custom-tag>` + `latest` |

Both the SHA-tagged and `latest`-tagged images are pushed on every run, so:

- **`latest`** is always what the Kubernetes deployment pulls (`imagePullPolicy: Always`)
- **SHA tags** give you a full audit trail — you can roll back to any previous commit's image

---

### Workflow summary output

After every successful run, the workflow prints a summary table directly on the GitHub Actions run page:

```
| Field     | Value                                                              |
|-----------|---------------------------------------------------------------------|
| Image URI | 145043400170.dkr.ecr.eu-north-1.amazonaws.com/pavan-devops-ecr:<sha> |
| Tag       | <sha>                                                               |
| Region    | eu-north-1                                                          |
| ECR Repo  | pavan-devops-ecr                                                    |
| Git SHA   | <sha>                                                               |
| Python    | 3.11                                                                |
| Node.js   | 20                                                                  |
```

---

### Full CI/CD + GitOps flow (with ArgoCD)

When you combine this workflow with ArgoCD (covered in the next section), the full pipeline becomes completely automated:

```
Developer pushes code to main
        │
        ▼
GitHub Actions builds + pushes image to ECR  (this workflow)
        │
        ▼
Update k8s/deployment.yaml image tag in Git
        │
        ▼
ArgoCD detects the change and syncs to EKS automatically
        │
        ▼
New version is live — zero manual steps
```

---

## 🔄 GitOps with ArgoCD *(Optional)*

ArgoCD watches your Git repository and automatically syncs changes to your EKS cluster — no manual `kubectl apply` needed after the first setup.

The `argocd/application.yaml` in this repo configures ArgoCD to:

- Watch the `main` branch of your GitHub repo
- Sync changes to the `devops-agent` namespace
- **Auto-prune** resources removed from Git
- **Self-heal** if someone manually changes the cluster state

### Install ArgoCD on your cluster

```bash
kubectl create namespace argocd

kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Apply the ArgoCD Application manifest

```bash
kubectl apply -f argocd/application.yaml
```

### Access the ArgoCD UI

```bash
# Port-forward the ArgoCD server to your localhost
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get the auto-generated admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

Open `https://localhost:8080` in your browser.
Login with username `admin` and the password printed above.

From this point forward, any push to the `main` branch automatically updates the cluster.

---

## 🛠️ Available MCP Tools

The agent has access to **27 GitHub MCP tools** plus **1 custom tool** — 28 total.

The tools carousel on the dashboard shows all available tools. Clicking any card auto-fills a sample prompt.

| Tool Name | Label in UI | Description |
|---|---|---|
| `create_or_update_file` | Write File | Create or update a file in a repository |
| `search_repositories` | List Repositories | Search and display all repos under your account |
| `create_repository` | Create Repository | Create a new private repo with a default README |
| `get_file_contents` | Get File | Read the contents of any file in a repo |
| `push_files` | Push Files | Push one or more files to a branch |
| `create_issue` | Create Issue | File an issue in a target repository |
| `create_pull_request` | Pull Request | Open a PR from one branch to another |
| `create_branch` | Create Branch | Create a new branch in any repository |
| `list_branches` | *(auto-labelled)* | List all branches in a repository |
| `fork_repository` | Fork Repo | Fork a repository to your account |
| `merge_pull_request` | *(auto-labelled)* | Merge an open pull request |
| `get_pull_request` | *(auto-labelled)* | Get details of a specific pull request |
| `list_pull_requests` | *(auto-labelled)* | List open or closed PRs |
| `create_pull_request_review` | *(auto-labelled)* | Submit a review on a pull request |
| `get_issue` | *(auto-labelled)* | Get a specific issue by number |
| `list_issues` | List Issues | View all open issues in a repository |
| `update_issue` | Update Issue | Edit the title, body, or state of an issue |
| `add_issue_comment` | Comment on Issue | Post a comment on an existing issue |
| `search_code` | Search Code | Full-text code search across repositories |
| `search_issues` | *(auto-labelled)* | Search issues and PRs |
| `search_users` | Search Users | Find GitHub users by keyword |
| `get_commit` | *(auto-labelled)* | Get details of a specific commit |
| `list_commits` | List Commits | Browse commit history on any branch |
| `get_user` | *(auto-labelled)* | Get a GitHub user profile |
| `get_repository` | *(auto-labelled)* | Get repository metadata |
| `list_repository_contents` | *(auto-labelled)* | List files and folders in a repo |
| `create_release` | *(auto-labelled)* | Create a GitHub release |
| `delete_repository` ⚠️ | Delete Repository | **Custom tool** — permanently deletes a repo. Triggers the safety confirmation modal in the UI before proceeding. |

> ⚠️ The `delete_repository` tool requires you to type the repository name exactly in the confirmation modal before the action is executed. This cannot be bypassed.

---

## 📁 Project Structure

```
github-ai-agent-web/
│
├── app.py                     # FastAPI backend — ReAct agent, SSE streaming, delete tool
├── requirements.txt           # Python dependencies (langchain, langgraph, fastapi, etc.)
├── Dockerfile                 # Multi-stage build: Python 3.11-slim + Node.js 20
│
├── static/                    # Frontend — served by FastAPI at /static/
│   ├── index.html             # Dashboard layout — sidebar, carousel, terminal, input bar
│   ├── style.css              # Glassmorphic dark theme, responsive layout
│   └── app.js                 # SSE client, tool carousel, activity feed, delete modal
│
├── k8s/                       # Kubernetes manifests for EKS deployment
│   ├── namespace.yaml         # Creates the devops-agent namespace
│   ├── deployment.yaml        # Deployment: 1 replica, ECR image, Secret env injection
│   └── service.yaml           # LoadBalancer Service: port 80 → containerPort 8000
│
├── argocd/
│   └── application.yaml       # ArgoCD Application: GitOps auto-sync from main branch
│
├── .env                       # ⚠️ Your local credentials — never commit this file
├── .gitignore                 # Excludes .env, venv, __pycache__, node_modules, etc.
│
├── github_ai_agent.py         # Standalone CLI version of the agent (no web server)
├── inspect_mcp_tools.py       # Utility script — lists all available MCP tools
└── test_mcp_client.py         # Utility script — tests the MCP server connection
```

---

## 🔐 Environment Variables Reference

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Gemini API key | [aistudio.google.com](https://aistudio.google.com) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | ✅ | GitHub PAT | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `GITHUB_USERNAME` | ✅ | Your GitHub username | Your GitHub profile URL |

**Required GitHub PAT scopes:**

| Scope | Why it is needed |
|---|---|
| `repo` | Read, write, and create repositories |
| `workflow` | Manage GitHub Actions workflows |
| `delete_repo` | Required for the `delete_repository` custom tool |
| `read:user` | Read your GitHub profile and username |

---

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serves the web dashboard UI (`static/index.html`) |
| `GET` | `/api/status` | Returns system status, GitHub username, connected tools list, and available models |
| `GET` | `/api/stream-run?task=<text>&confirm=<bool>` | Executes the agent task; streams real-time SSE events back to the client |

**SSE event types** returned by `/api/stream-run`:

| Type | Meaning |
|---|---|
| `status` | Informational message (connecting, loading, etc.) |
| `tool_call` | Agent is calling a GitHub tool — includes tool name and args |
| `tool_result` | Result returned from the tool |
| `thought` | Agent's reasoning / intermediate message |
| `success` | Task completed — includes the final agent response |
| `warning` | Non-fatal issue (e.g. model fallback triggered) |
| `error` | Fatal error — task could not be completed |
| `confirm_required` | Delete detected without `confirm=true` — UI shows the modal |

---

## 🔧 Troubleshooting

### Status indicators show red after starting

The `/api/status` endpoint failed to connect to the MCP server or found missing credentials.

```bash
# Check credentials are passed correctly
docker exec github-ai-agent env | grep -E 'GOOGLE|GITHUB'

# Check the API response directly
curl http://localhost:8000/api/status
```

Common causes:

- `.env` file missing or has incorrect variable names
- GitHub PAT has expired or lacks the required scopes
- Gemini API key is invalid or quota is exhausted

---

### Container exits immediately after `docker run`

```bash
# Check exit reason
docker logs github-ai-agent
```

Usually caused by a missing or malformed `.env` file. Confirm the file exists and has no extra spaces or quotes around the values.

---

### `npx: command not found` error in logs

Node.js did not install correctly during the build.

```bash
# Verify Node.js is available in the image
docker run --rm github-ai-agent:latest node --version
docker run --rm github-ai-agent:latest npx --version
```

If these fail, rebuild the image from scratch:

```bash
docker build --no-cache -t github-ai-agent:latest .
```

---

### Agent times out or returns no results

The agent has a 60-second timeout per model call. It automatically tries `gemini-3.1-flash-lite-preview` first, then falls back to `gemini-2.5-flash`.

- Check your Gemini API quota at [aistudio.google.com](https://aistudio.google.com)
- Watch live logs: `docker logs -f github-ai-agent`
- Try a simpler command first to confirm the agent is functional

---

### EKS pods stuck in `ImagePullBackOff`

The EKS nodes cannot pull the image from ECR — missing IAM permission.

```bash
# Find the node group IAM role
eksctl get nodegroup \
  --cluster devops-agent-cluster \
  --region eu-north-1

# Attach the ECR pull policy
aws iam attach-role-policy \
  --role-name <nodegroup-role-name> \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

After attaching the policy, delete and let Kubernetes recreate the pod:

```bash
kubectl delete pod -n devops-agent -l app=devops-agent
```

---

### `kubectl` cannot connect after cluster creation

```bash
# Refresh kubeconfig
aws eks update-kubeconfig \
  --region eu-north-1 \
  --name devops-agent-cluster

# Verify nodes are visible
kubectl get nodes
```

---

### Kubernetes Secret not found — pod fails to start

If the pod shows `CreateContainerConfigError`, the secret is missing.

```bash
# Check if secret exists
kubectl get secret devops-agent-secret -n devops-agent

# Recreate if missing
kubectl create secret generic devops-agent-secret \
  --namespace devops-agent \
  --from-literal=GOOGLE_API_KEY=... \
  --from-literal=GITHUB_PERSONAL_ACCESS_TOKEN=... \
  --from-literal=GITHUB_USERNAME=...
```

---

### Delete confirmation modal — Confirm button stays disabled

The modal requires you to type the repository name **exactly as shown** in the warning box — it is case-sensitive and must be an exact character-for-character match. This is intentional to prevent accidental permanent deletions.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by [Pavan Kalyan Pachuru](https://github.com/iam-pavanpachuru)

</div>
