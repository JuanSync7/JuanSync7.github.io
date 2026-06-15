---
title: "What I Actually Do at Aion Silicon"
excerpt: "A non-NDA-violating look at life as a Senior ASIC Design Engineer. Spoiler: lots of waveform staring."
category: thoughts
date: 2026-01-10
readTime: "5 min"
tags: ["Career", "ASIC"]
featured: false
size: small
---

This is where the full **What I Actually Do at Aion Silicon** write-up will live. The terminal-inspired layout carries through with monospace typography, code-comment section headers, and the same dark palette as the rest of the site.

## 0x01. background

Every section header follows the hex-indexed comment convention you'll recognise from the rest of the site. Content blocks reuse the same border-left accent treatment as the terminal experience section, grounding everything in the site's visual DNA.

```systemverilog
module example_block (
  input  wire       clk,
  input  wire       rst_n,
  output reg  [7:0] data_out
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) data_out <= 8'h00;
    else        data_out <= data_out + 1;
  end
endmodule
```

## 0x02. implementation

The cyberpunk layer adds scanline overlays, HUD corner brackets on interactive elements, neon glow borders that shift colour on hover, and occasional glitch text effects on headings. It's restrained enough to read comfortably but unmistakable in character.

> **note:** this is a seeded placeholder post. Replace the body of `aion-chip.md` with the real article whenever you're ready — the frontmatter above already drives the card, the filters, and the SEO.

— EOF —
