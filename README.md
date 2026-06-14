# 🧬 MSATransformer: Interactive Multiple Sequence Alignment Dashboard

[![Framework: Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org)
[![UI: ShadCN](https://img.shields.io/badge/UI-ShadCN%20--%20Tailwind-blue)](https://ui.shadcn.com)
[![API Engine: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)

An end-to-end user-facing application that visualizes **Multiple Sequence Alignment (MSA)** predictions using a fine-tuned Transformer deep learning model. This web application provides computational biologists with an interactive interface to align raw nucleotide sequences and visually compare results against industry-standard tools instantly.

> 🔄 **Note on Training:** This repository contains the complete production code for the web client interface and the API inference server. To replicate the core deep learning training pipelines, see the tokenizers, or access the training datasets, please visit our dedicated training repository:  
> 👉 **[msa-transformer-nuc](https://github.com/TanjungArs/msa-transformer-nuc)**

<br>

## 🎨 Core Product Features

The application converts a complex sequence-to-sequence model into a production-ready software product featuring:

### 1. Unified FASTA Ingestion Form
* **Flexible Sequence Import:** Users can directly copy-paste multi-sequence strings or upload standardized raw `.fasta` files.
* **Smart Input Validation:** The form interface dynamically analyzes the properties and sequence count to manage load distribution before triggering backend computation.

### 2. Color-Coded Nucleotide Matrix Display
* **High-Definition Grid:** Generates an interactive matrix visualization where nucleotides (`A`, `T`, `C`, `G`) and gap placements (`-`) are explicitly color-coded.
* **Exploratory Navigation:** Outfitted with specialized responsive scroll wrappers to inspect long genomic sequences easily without distorting application layouts.

### 3. Side-by-Side Analytical Benchmarking
* **Live Baseline Comparison:** Generates automated comparisons evaluating our **Transformer Model** against classic bioinformatic tools (**MAFFT, Clustal Omega, and MUSCLE**).
* **Metric Scorecards:** Calculates and presents instantaneous performance scores under standard computational biology criteria: **Sum-of-Pairs (SP Score)**, **Column Score (CS Score)**, and total structural gap densities.

<br>

## ⚙️ How the Product Works


```

[ Next.js Frontend Dashboard ] ──(User inputs FASTA)──> [ Next.js API Proxy (/api/align) ]
▲                                                         │
│ (Color-Coded Rows + JSON Metrics)                       ▼
[ Dynamic Matrix Renderer ] <──(Proxy HTTP Response)─── [ FastAPI Inference Backend ]
│
▼
[ Fine-Tuned PyTorch Weights ]

```

The system coordinates data delivery across an asynchronous micro-service layout:
1. **The Web Client** captures raw nucleotide sequence input blocks inside the reactive user interface.
2. **Next.js API Routes** act as a secure proxy layer, forwarding the payload to the local or remote production worker to completely prevent cross-origin (CORS) connection blocks.
3. **The FastAPI Engine** loads optimized PyTorch checkpoints, executes fast autoregressive model inference, concurrently triggers classical heuristics, and returns a unified JSON payload back to the browser grid.

<br>

## 🛠️ Installation & Setup Guide

### Prerequisites
Before launching the local product servers, ensure your machine has:
* Node.js (v18 or higher)
* PNPM package manager (`npm install -g pnpm`)
* Python 3.10+ with a functional virtual environment setup

### 1. Backend Server Setup
Navigate to the backend directory, initialize your environment, and install the native core dependencies:

```bash
cd backend

# Setup environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install core tensor and API libraries
pip install torch
pip install fastapi uvicorn numpy
```

Launch the FastAPI microservice engine:

```bash
python -m uvicorn main:app
```

### 2. Frontend Web Setup

Open a separate terminal shell, navigate to the web directory, install structural nodes, and run the client:

```bash
cd frontend

# Ingest workspace layouts
pnpm install

# Run the local application proxy environment
pnpm dev
```


<br>

## 📁 Related Repositories

* 🔵 **Core Training & Research Repository:** [https://github.com/TanjungArs/msa-transformer-nuc](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/TanjungArs/msa-transformer-nuc)
