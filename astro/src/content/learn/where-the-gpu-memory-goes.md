---
title: "Where the GPU memory goes"
summary: "On a shared GPU, the memory for every request is set aside before the first one arrives, and most serving surprises come from not knowing where it went."
eyebrow: "Inference serving"
tracker: "inference-engines"
date: 2026-10-18
subject: inference
cover: "voxel-scene~12"
---

Put two models on one GPU and you find out quickly that "it fits" isn't a yes-or-no question. I ran a small fleet of vLLM servers on one 48 GB card: a chat model and an embedding model, side by side. Sometimes a server refused to start. Sometimes the same config started fine, and the next restart came up with a different amount of room for requests. Nothing was broken. I just didn't know where the memory was going.

A car park is the easiest way to see it. Some spaces are taken all day by staff cars: those are the model's weights, loaded once and never moved. The rest are kept for visitors. Each request that arrives parks one car per token of its conversation, so a long conversation fills a whole row. Those visitor spaces are the KV cache. Before the car park opens, it marks out how many visitor spaces it has, and it promises it can take at least one conversation of the longest length it allows. If it can't fit that one, it doesn't open at all.

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

That number looks tiny, but it's paid for every token, for every request in flight, the whole time the request lives. Everything else in this article is that 0.14 MiB multiplied by something.

## Context length sets the minimum

The first multiplier is the longest request you allow. `max-model-len` is the longest conversation the car park promises to take, and vLLM checks that promise when it starts: if the KV cache can't hold one request of full length, the server refuses to start.

For the embedding model, at a context of 8,192 tokens:

```
8,192 tokens × 0.14 MiB ≈ 1,152 MiB ≈ 1.12 GiB of KV cache, just to start
```

That's why an embedding model needs a KV cache at all. It never generates a token, but it still has to run attention over its whole input, so the input's keys and values have to live somewhere while it does.

Context length doesn't decide how big the cache is. It decides the smallest cache the server will accept. Raise it "just in case" and a server that started yesterday can refuse to start today. How big the cache actually is comes from the next setting.

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
  kv2["KV cache = exactly that &middot; the share is ignored"]
  share-->weights-->profile-->kv
  pin-->kv2
  class pin accent
</pre>
<figcaption>Two ways to size the KV cache. A share leaves the cache as a remainder of a measurement; pinned bytes make it a fixed number.</figcaption>
</figure>

Here's what that meant for the embedding server on a card that reports 46,068 MiB. Its weights and fixed overhead took about 9,130 MiB, and the KV cache got the rest of its share:

| Share of the card | KV cache it got | Tokens that fit | Result |
| --- | --- | --- | --- |
| 0.22 | 0.98 GiB | about 7,100 | Refuses to start: less than one 8,192-token request |
| 0.24 | 1.87 GiB | 13,584 | Starts, with room for about 1.66 full-length requests |

Two percentage points were the difference between a server and an error message.

The bigger trouble is that the remainder depends on a measurement, and measurements move. The same share gave different cache sizes on different starts. And when two servers start on the same card at the same moment, each one's measurement can see the other loading, so the split between them becomes a race that depends on which came up first. In the car park, it's two firms sharing one lot, each counting the free spaces while the other's staff are still parking.

Shares have a second trap: they're set per server, but they have to add up across the card. The first config templates for the fleet summed to 1.67 of one card. Each file was valid on its own. Together they were impossible. So the fleet has a ceiling, 0.95 of the card, and a validator that sums every server's share as a set and rejects an edit that would go over, saying why.

## Pin it in bytes

The fix for the race is to stop asking for a remainder. `kv-cache-memory-bytes` tells vLLM to make the KV cache exactly that many bytes. The profile still runs, but its result no longer sizes the cache, and the share is ignored. The footprint becomes a number you chose, the same on every start, whatever else is running.

```yaml
# configs/embed.yaml
model: Qwen/Qwen3-Embedding-4B
max-model-len: 8192
gpu-memory-utilization: 0.24        # the budget the pin was derived from
kv-cache-memory-bytes: 1842537186   # 1.72 GiB, 12,480 tokens, 1.52× at 8,192
```

Because the share is ignored once a pin is set, it stays in the file as a budget on paper: the number the pin was derived from, and the number the fleet's sum check counts. Keep the two in step, or the check is adding up figures nothing uses.

Three habits made pinning work in practice:

- **Take vLLM's own first suggestion.** At start-up vLLM logs two suggested byte counts. Take the one that fits the memory you asked for, not the one that would fill the whole card.
- **Derive it with the other servers paused**, so the number isn't shaped by whoever happened to be running.
- **Pin bytes, not tokens.** The bytes are yours; the token count belongs to the runtime. The same 6.26 GiB held 192,636 tokens under one vLLM version and 184,260 under a later one. After an upgrade, read the new token figure and size your concurrency against it. Re-pin only when the model, the context length, the share or the card changes.

The embedding server's pinned cache came out at 1.72 GiB, a little smaller than the 1.87 GiB the profile gave it, with room for 12,480 tokens: 1.52 full-length requests, every time. That's the price of knowing the number in advance, and it's worth it.

## Where one card goes

Now the whole card. Each server's footprint is its weights, the working memory for a forward pass (activations, CUDA graphs and the runtime's own overhead) and its KV cache. With both servers pinned, the 46,068 MiB card came to:

```
card              46,068 MiB  ████████████████████████████████████████
chat model        26,358 MiB  ███████████████████████
embedding model   11,154 MiB  ██████████
left over          8,556 MiB  ███████
```

The chat model's KV cache was 6.26 GiB, enough for 184,260 tokens. At a context of 32,768 tokens that's room for about 5.6 full-length conversations at once. That last number is the one that matters for users: it's how many people can hit the longest context at the same moment before someone waits.

The left-over slice isn't waste. It's the margin that lets a server restart, or a third, small model be tried, without taking the others down.

## Ask the card who holds it

One last thing about believing the numbers. A service manager can say a server has stopped while its container is still alive and still holding memory. So after a stop, ask the card itself who holds memory, and name each process:

```
$ nvidia-smi --query-compute-apps=pid,used_memory --format=csv
pid, used_memory [MiB]
41822, 26358 MiB
41907, 11154 MiB
```

If the driver doesn't answer, that's unknown, not free.

## What to remember

- Every token of context costs `2 × layers × kv_heads × head_dim × bytes` of memory, for as long as its request lives.
- Context length sets the smallest cache a server will start with; the share or the pin sets how big it really is.
- `gpu-memory-utilization` leaves the cache as a remainder of a measurement. Pin `kv-cache-memory-bytes` when servers share a card, and keep the shares on paper adding up.

For where the KV cache sits in the whole life of a request, from prefill to the last token, read [Inference, end to end](/learn/inference-end-to-end).
