---
title: "Where the GPU memory goes"
excerpt: "On a shared GPU, the memory for every request is set aside before the first one arrives, and most serving surprises come from not knowing where it went."
category: tutorials
date: 2026-10-18
cover: voxel-scene~12
readTime: "8 min"
tags: ["Inference", "vLLM", "KV-cache", "GPU"]
externalUrl: /learn/where-the-gpu-memory-goes
---

A learning article on the paper-and-ink pages: the KV cache from one token up to a shared card.
