
# 🖥️ MSATransformer: Interactive Multiple Sequence Alignment Web Showcase

[![Framework: Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org)
[![UI: ShadCN](https://img.shields.io/badge/UI-ShadCN%20--%20Tailwind-blue)](https://ui.shadcn.com)
[![AI-Inference: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)

Welcome to the **MSATransformer Interactive Showcase**. This repository serves as a dedicated live product demo platform designed to highlight the graphical user interface, user experience, and real-time nucleotide alignment visualization of our Transformer-based MSA system.

> 🌐 **Looking for the Full Production Source Code?**
> This branch/repository is optimized strictly for running and demonstrating the web product interface. To pull the complete underlying architecture, PyTorch training pipelines, model state dictionaries (`.pt`), and comprehensive backend source code, please checkout the **`main`** branch:
> ```bash
> git checkout main
> ```
---

## 🎯 Core Product Features & UI Highlights

The showcase platform bridges complex deep learning inference with an intuitive, bioinformatician-friendly dashboard featuring:

### 1. Interactive FASTA Ingestion Form
* **Flexible Input:** Supports seamless copy-pasting of raw nucleotide sequences or direct `.fasta` file uploads via a clean, state-managed form wizard (`msa-form.tsx`).
* **Dynamic Validation:** Automatically counts and tracks inputted sequence properties before sending payloads to prevent runtime errors.

### 2. Real-Time Color-Coded Matrix Visualization
* **Nucleotide Matrix:** Aligned outputs are rendered inside an interactive, responsive grid where each nucleotide (`A`, `T`, `C`, `G`) and gap character (`-`) is uniquely color-coded for instant conservation tracking.
* **Overflow Handling:** Implements specialized scroll areas to inspect long, highly variable sequence alignments cleanly without breaking layout bounds.

### 3. Live Benchmark Comparison Dashboard
* Displays side-by-side analytical metric scorecards comparing our **Transformer model** directly against classic baseline algorithms (**MAFFT, Clustal Omega, and MUSCLE**).
* Visualizes real-time metric updates including **Sum-of-Pairs (SP Score)**, **Column Score (CS Score)**, and total structural gap allocations.

<br>

## ⚙️ How the Demo Works


```

[Interactive Web UI] ── (User inputs FASTA) ──> [Next.js API Route (/api/align) ]
    ▲                                                       │
    │                                                       |
    |  (Visual Matrix + JSON Scores)                        ▼

[Color-Coded RendererAligner] <──(Proxy Response)─── [Local/Remote FastAPI] 

```

The web client operates over a decoupled micro-architecture:
1. The frontend client captures raw multi-sequence strings.
2. A Next.js API Route handler proxies request payloads seamlessly to a background FastAPI service to bypass cross-origin restrictions.
3. The server computes sequence alignment positions and mathematical weights, returning structured JSON metric logs to be painted instantly on the screen.

---

## 🚀 Quick Start: Running the Live Demo Locally

Get the interactive dashboard running on your local machine in just a few steps.

### Prerequisites
* Node.js (v18 or higher)
* PNPM package manager (`npm install -g pnpm`)
* A functional local backend API endpoint (See the `main` branch setup).

### 1. Installation
Clone the repository, ensure you are on the right branch, and install the required web development dependencies:

```bash
# Install package modules via pnpm workspace setup
pnpm install
```

### 2. Running the Live Dashboard

Spin up the local development web server environment:

```bash
pnpm dev
```



## 🎨 Tech Stack & UI Components

* **Frontend Framework:** Next.js (App Router layout configuration)
* **Language:** TypeScript (Ensuring strict end-to-end alignment data types)
* **Styling Engine:** TailwindCSS wrapped around a dark/light responsive theme provider
* **Component Library:** ShadCN UI (Leveraging accordions, tables, alerts, buttons, and custom input fields)

---

## 🎓 Academic Framework Attribution

This interface is the graphical frontend for a computer science research thesis exploring Deep Learning implementations within structural genomics:

```bibtex
@thesis{tanjung2026msa,
  author       = {Tanjung Arswendo Yudha},
  title        = {Penerapan Model Sequence-to-Sequence Menggunakan Transformer Untuk Penjajaran Sekuens Nukleotida},
  school       = {Universitas Islam Negeri Syarif Hidayatullah Jakarta},
  year         = {2026},
  type         = {Skripsi},
  department   = {Program Studi Teknik Informatika}
}
```