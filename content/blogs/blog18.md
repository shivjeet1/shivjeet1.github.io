---
title: "Stop Paying for AI Agents: n8n Local AI Stack + SearXNG + Docker"
slug: "n8n-local-ai-stack-searxng-docker"
aliases:
  - /blogs/blog18/
  - /blogs/blog18/index.html
date: 2026-09-13
tags: ["Automation", "Docker", "n8n", "AI", "SearXNG", "Self-Hosted"]
description: "How to run a fully containerized, offline-capable n8n AI Assistant sandbox with local web search and auto-syncing workflows."
summary: "Ditching cloud automation and paid AI agent platforms by self-hosting an n8n AI stack using Docker, complete with local SearXNG and a secure code sandbox."
weight: 82
type: post
image: "/images/blogs/n8n-docker.jpg"
showTableOfContents: true
draft: false
---

## Introduction

Cloud AI agent platforms are a scam. 

Services charge you for every single "task" or "step" executed by an autonomous agent. You write a simple prompt to search the web and summarize data, and suddenly you are hitting a paywall because your AI looped 500 times in a day. 

Now comes the real part:
**Running a fully containerized, offline-capable n8n Community Edition deployment featuring an autonomous AI Assistant sandbox and local web search.**

This blog explains how to deploy an **n8n Local AI Stack** on your machine. It uses Docker to give you a secure DinD (Docker-in-Docker) environment for your AI to execute code autonomously, completely bypassing cloud subscription limits.

![Local n8n Docker Setup](/images/blogs/n8n-docker.jpg "Local n8n Docker Setup")

---

## What This Setup Achieves

By containerizing this AI stack locally, we get:

- Absolute zero cost. Free forever.
- Unlimited workflow executions (`N8N_ENFORCEMENT_EDITION=community`).
- Private, local metasearch engine (SearXNG) allowing AI agents to query the live internet without requiring paid APIs.
- **AI Code Sandbox:** A Docker-in-Docker environment (`sandbox-runner-1`) that allows the n8n Assistant to safely write and execute code autonomously.
- Easy workflow management: Automatically sync local JSON workflows into the n8n SQLite database on boot.
- A portable offline bundle that can be run completely offline using cached Docker images.

Minimal architecture, infinite automation.

---

## Prerequisites

- Docker Engine and Docker Compose v2 installed
- A free [OpenRouter](https://openrouter.ai/) API key (for the AI Assistant model)
- Another free [Google AI studio](https://ai.google/studio/welcome) API key (for the Google Search model)

---

## Step 1: Clone the Repo & Configure Environment

Do not run massive, unreadable CLI commands from scratch. Let's pull the pre-configured repository.

```bash
git clone https://github.com/backtovedas/n8n-local.git
cd n8n-local
```

Ensure your `.env` contains your API keys for the AI providers and the internal container secrets for mTLS.

```bash
# Internal Container Secrets (used for mTLS / container auth)
SANDBOX_API_KEYS=sandbox-secret-key-92837492
SANDBOX_API_RUNNER_REGISTRATION_TOKEN=runner-token-47291047
SANDBOX_API_RUNNER_API_KEY=runner-key-83746291

# Must match SANDBOX_API_KEYS so n8n can authenticate to sandbox-api
N8N_SANDBOX_SERVICE_API_KEY=sandbox-secret-key-92837492

# Secret key for the local SearXNG metasearch instance
SEARXNG_SECRET=searxng-secret-58294710

# AI Provider API Key (e.g., OpenRouter, OpenAI, or Anthropic)
N8N_INSTANCE_AI_MODEL_API_KEY=sk-or-v1-your-openrouter-key-here
```

---

## Step 2: Start the Stack

To spin up the entire autonomous environment:

```bash
docker compose up -d
```

Open **http://localhost:5678** in your browser. You will be prompted to set up a local owner account. This is strictly local; it does not connect to the cloud.

---

## The Container Architecture

This stack is composed of several specialized containers working together:

* **`sandbox-certs`**: Runs once on boot to generate mutual TLS certificates for secure container communication, then exits.
* **`sandbox-api`**: The control plane that n8n communicates with to request code execution.
* **`sandbox-runner-1`**: Runs in privileged mode. It spins up temporary, isolated sub-containers to execute AI-generated code, then destroys them.
* **`n8n-import`**: An init container that automatically pushes local JSON files from `./workflows/` into n8n on startup.
* **`searxng`**: The private, local metasearch engine configured to output JSON for the AI agents.

---

## Managing Workflows (Syncing)

n8n does not natively read workflows directly from the filesystem; they live in an internal SQLite database. We use CLI commands to sync them.

### 1. Auto-Import on Boot (Local -> n8n)

When you run `docker compose up -d`, the `n8n-import` init container runs first. It scans the `./workflows/` directory and safely pushes any `.json` files into the n8n database before the main application boots.

### 2. Manual Export (n8n -> Local)

When you create or modify a workflow inside the n8n web UI, it is saved in the database, not your local folder. To back up your current workflows to the `./workflows/` directory, run:

```bash
docker container exec -it n8n n8n export:workflow --all --output=/workflows/
```

*(Note: Exported JSON files contain node configurations but do not export secure credentials like API keys/passwords for security reasons).*

---

## Stopping the Stack

To shut down the entire environment safely without losing your persistent data:

```bash
docker compose down
```

---

## Conclusion

Automating your digital life and running autonomous AI agents should not require a subscription model.

By pulling this localized Docker stack, you get an enterprise-grade AI automation environment running entirely on your own hardware, completely detached from corporate rate limits.

---

## Credits (Important)

Before anything else:

- **[The n8n Team](https://n8n.io/)** – for keeping the core automation engine source-available and free to self-host.
- **[Docker](https://www.docker.com/)** – for making application deployment a single text file instead of a dependency nightmare.
- **[SearXNG](https://docs.searxng.org/)** – for a privacy-respecting, hackable metasearch engine.

Without these, we would all be paying $30 a month just to let an AI scrape a single webpage.

---

## Personal Opinion

> I refuse to pay per-execution fees for AI code that runs on my own hardware.
> This setup exists so I can spin up autonomous AI agents, let them write code in an isolated sandbox, query the web without API limits, and automate my workflows without counting how many "tasks" I have left this month.
> It is self-hosted, it runs offline, and it never asks for a credit card — and that is exactly how software should be.

---
