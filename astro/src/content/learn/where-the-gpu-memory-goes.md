---
title: "Where the GPU memory goes"
summary: "On a shared GPU, every token of context is paid for in memory before anyone sends a request, and most serving surprises come from not knowing where it went."
eyebrow: "Inference serving"
tracker: "inference-engines"
art: "stack"
date: 2026-10-18
---

Put two models on one GPU and you find out quickly that "it fits" isn't a yes-or-no question. I ran a small fleet of vLLM servers on one 48 GB card: a chat model and an embedding model, side by side. Sometimes a server refused to start. Sometimes the same config started fine, and the next restart came up with a different amount of room for requests. Nothing was broken. I just didn't know where the memory was going.

A car park is the easiest way to see it. Some spaces are taken all day by staff cars: those are the model's weights, loaded once and never moved. The rest are for visitors, and each visitor needs one space per token of their conversation: that's the KV cache. Before the car park opens, it has to decide how many visitor spaces it has, and it promises it can take at least one coach of the biggest size it allows. If it can't fit that coach, it doesn't open at all.

This article builds that picture from the smallest unit up: one token, then one request, then one server, then a card shared by several.

## One token's worth of memory

For every token in a conversation, every layer of the model keeps a key vector and a value vector, so attention can look back at it later without recomputing it. That's the KV cache, and its size per token is pure arithmetic:

```
KV bytes per token = 2 × layers × kv_heads × head_dim × bytes_per_element

  2                  one key and one value
  layers             every transformer block keeps its own
  kv_heads           key/value heads (with grouped-query attention, fewer than query heads)
  head_dim           the size of each head
  bytes_per_element  2 for FP16/BF16, 1 for FP8
```

A worked example, the embedding model from that fleet, Qwen3-Embedding-4B, in BF16:

```
2 × 36 layers × 8 kv_heads × 128 head_dim × 2 bytes
  = 147,456 bytes per token
  ≈ 0.14 MiB per token
```

That number looks tiny. The point is that it's paid for every token, for every request in flight, the whole time the request lives. Everything else in this article is that 0.14 MiB multiplied by something.

## Context length is paid for up front

The first multiplier is the longest request you allow. `max-model-len` is the size of the biggest coach the car park promises to take, and vLLM checks that promise when it starts: if the KV cache can't hold one request of full length, the server refuses to start.

For the embedding model, at a context of 8,192 tokens:

```
8,192 tokens × 0.14 MiB = 1.12 GiB of KV cache, minimum, just to start
```

That's why an embedding model needs a KV cache at all. It never generates a token, but it still has to run attention over its whole input, so the input's keys and values have to live somewhere while it does.

Here's what happened as the embedding server's share of the card changed. The weights and fixed overhead took about 9,130 MiB, and the KV cache got whatever was left of its share:

| Share of the card | KV cache it got | Tokens that fit | Result |
| --- | --- | --- | --- |
| 0.22 | 0.98 GiB | about 7,100 | Refuses to start: less than one 8,192-token request |
| 0.24 | 1.87 GiB | 13,584 | Starts, room for about 1.6 full-length requests |
| pinned (see below) | 1.72 GiB | 12,480 | Starts, room for 1.52 full-length requests, every time |

A share of two percentage points was the difference between a server and an error message. Context length isn't a free setting you raise "just in case". Every token of it is reserved in memory before the first request arrives.

## Where one card goes

Now the whole card. Each server's footprint is its weights, the working memory for a forward pass (activations, CUDA graphs and the runtime's own overhead) and its KV cache. On that 48 GB card, which reports 46,068 MiB, the two servers came to:

```
card              46,068 MiB  ████████████████████████████████████████
chat model        26,358 MiB  ███████████████████████
embedding model   11,154 MiB  ██████████
left over          8,556 MiB  ███████
```

The chat model's KV cache was 6.26 GiB, enough for 184,260 tokens. At a context of 32,768 tokens that's room for about 5.6 full-length conversations at once. That last number is the one that matters for users: it's how many people can hit the longest context at the same moment before someone waits.

The left-over slice isn't waste. It's the margin that lets a server restart, or a third, small model be tried, without taking the others down. Which brings up the setting that decides how big each slice is.

## A share is a target, not a cap

vLLM's `gpu-memory-utilization` is a fraction of the whole card, like 0.24. It reads like a limit. It behaves more like a target. At start-up, the server takes its share of the card, loads the weights, runs a profiling pass to measure how much working memory a forward pass needs, and gives whatever is left to the KV cache:

<figure class="ig-fig">
<pre class="mermaid">
graph TD
  share["Share of the card &middot; total × gpu-memory-utilization"]
  weights["Minus the weights"]
  profile["Minus the profiled working memory &middot; measured at start-up"]
  kv["KV cache = whatever is left"]
  pin["kv-cache-memory-bytes &middot; a fixed number of bytes"]
  kv2["KV cache = exactly that &middot; no profiling"]
  share-->weights-->profile-->kv
  pin-->kv2
  class pin accent
</pre>
<figcaption>Two ways to size the KV cache. A share leaves the cache as a remainder of a measurement; pinned bytes make it a fixed number.</figcaption>
</figure>

The remainder depends on a measurement, and measurements move. The same share gave different cache sizes on different starts. And when two servers start on the same card at the same moment, each one's measurement can see the other loading, so the split between them becomes a race that depends on which came up first. In the car park picture, it's like saying "take 24% of the spaces" and then counting what's free while another car park's staff are still parking.

There's a second trap in shares: they're set per server, but they have to add up across the card. The first config templates for the fleet summed to 1.67 of one card. Each file was valid on its own. Together they were impossible. So the fleet has a ceiling, 0.95 of the card, and a validator that sums every server's share as a set and rejects an edit that would go over, saying why.

## Pin it in bytes

The fix for the race is to stop asking for a remainder. `kv-cache-memory-bytes` tells vLLM to allocate exactly that many bytes for the KV cache and skip the profiling step. The footprint becomes a number you chose, not one you measured, and it's the same on every start whatever else is running.

```yaml
# configs/embed.yaml
model: Qwen/Qwen3-Embedding-4B
max-model-len: 8192
gpu-memory-utilization: 0.24
kv-cache-memory-bytes: 1842537186   # 1.72 GiB, 12,480 tokens, 1.52× at 8,192
```

Three habits made pinning work in practice:

- **Take vLLM's own first suggestion.** When the cache doesn't fit, vLLM suggests a byte count. It offers two figures; take the one that fits the memory you asked for, not the one that would fill the whole card.
- **Derive it with the other servers paused**, so the number isn't shaped by whoever happened to be running.
- **Pin bytes, not tokens.** The bytes are yours; the token count belongs to the runtime. The same 6.26 GiB held 192,636 tokens under one vLLM version and 184,260 under a later one. After an upgrade, read the new token figure and size your concurrency against it. Re-pin only when the model, the context length, the share or the card changes.

A pinned cache comes out slightly smaller than a profiled one, because the profiled one takes everything that's left. That's the price of knowing the number in advance, and it's worth it.

## Check the card, not the service

The last lesson is about believing what you see. A service manager can say a server has stopped while its container is still alive and still holding memory. So after a stop, ask the card itself who holds memory, and name each process:

```
$ nvidia-smi --query-compute-apps=pid,used_memory --format=csv
pid, used_memory [MiB]
41822, 26358 MiB
41907, 11154 MiB
```

If the driver doesn't answer, that's unknown, not free. And when you check a server is up, ask it what it's serving, not just whether it's healthy, because a health check on a port can be answered by the wrong server:

```
$ curl -s localhost:31700/v1/models | jq -r '.data[].id'
embed
```

## What to remember

- Every token of context costs `2 × layers × kv_heads × head_dim × bytes` of memory, reserved before the first request.
- A server must fit one full-length request to start; context length is paid for up front.
- `gpu-memory-utilization` is a target that leaves the cache as a remainder. Pin `kv-cache-memory-bytes` when servers share a card, and check that the shares add up.

For where the KV cache sits in the whole life of a request, from prefill to the last token, read [Inference, end to end](/learn/inference-end-to-end).
