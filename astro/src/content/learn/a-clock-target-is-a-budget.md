---
title: "A clock target is a budget"
summary: "\"Run at 2.6 GHz\" sounds like one number, but it's a budget of about 385 picoseconds that four different teams have to share."
eyebrow: "Chip design"
art: "wave"
date: 2026-10-18
---

A chip's clock speed reads like a single fact on a spec sheet: 2.6 GHz. Inside the project, it's a slice of time, the same few hundred picoseconds, and several things all have to happen inside it on every path in the design, on every chip that comes off the line, at every temperature and voltage it's sold for. Each of those things is owned by a different part of the team. Get the split wrong and the chip runs slower than promised, or not at all.

Airports have the same problem, and they solved it with a number they publish: the minimum connection time. Say it's 45 minutes. Inside those 45 minutes, your first plane has to taxi to the gate and open its doors, you have to walk to the next gate, and you have to get there before boarding closes, which is well before the second plane leaves. And the airport has to leave room for what it can't control: a plane that lands a few minutes late, or a busy day that slows everyone's walk. Nobody owns the whole 45 minutes. Everybody owns a piece of it.

A clock period is a minimum connection time for data. This article builds it from one path up to the whole team.

## One path, one period

Almost all digital logic is made of the same unit: a flip-flop launches a value on a clock edge, the value travels through a cloud of logic gates, and a second flip-flop captures it on the next clock edge. That's a timing path.

<figure class="ig-fig">
<pre class="mermaid">
graph TD
  pll(["Clock source &middot; PLL"])
  tree["Clock tree"]
  ff1["Launch flip-flop"]
  logic["Logic gates"]
  ff2["Capture flip-flop"]
  pll-->tree
  tree-->|"launch edge"|ff1
  tree-->|"capture edge"|ff2
  ff1-->|"clock-to-q"|logic-->|"must arrive before setup"|ff2
  class logic accent
</pre>
<figcaption>One timing path. The same clock reaches both flip-flops through the clock tree, and the data has one period to get from the first to the second.</figcaption>
</figure>

The period is just one over the frequency:

```
period = 1 / 2.6 GHz = 1 / 2,600,000,000 s ≈ 384.6 ps
```

So every path in the core gets about 385 picoseconds. In that time, light travels about 11.5 centimetres.

## What the data has to do in that time

Three things happen on the data's side of a path, in order:

- **Clock-to-q.** After the clock edge arrives, the launch flip-flop takes a little while to put the new value on its output. This is the plane taxiing to the gate.
- **Logic delay.** The value ripples through the gates between the two flip-flops. This is the walk between gates, and it's the part the designer controls most directly: more gates in a row means a longer walk.
- **Setup time.** The capture flip-flop needs the value to be steady for a short time before the clock edge, or it can't be sure what it saw. This is boarding closing before departure.

If that were all, the rule would be simple: clock-to-q plus logic plus setup must fit in one period. But just like the airport, the clock itself doesn't arrive perfectly on time, or at the same time everywhere.

## What the clock can't promise

Three things eat into the period from the clock's side.

**Jitter** is the clock source being slightly early or late from one edge to the next. A PLL that's meant to tick every 384.6 ps doesn't tick at exactly that every time. If one cycle comes up short, the data has less time. That's the first plane landing a few minutes late.

**Skew** is the same clock edge reaching different flip-flops at different times, because the clock tree that carries it to millions of flip-flops can't make every wire the same length. If the capture flip-flop gets its edge earlier than the launch flip-flop, the period shrinks for that path. That's the clock at your next gate running a few minutes fast, so boarding closes earlier than your watch says.

**On-chip variation** is the fact that two copies of the same gate on the same die aren't quite the same speed, because of tiny differences in manufacturing, voltage and temperature across the chip. Timing tools cover it with a derate, a few percent added or taken away on purpose: for a setup check they assume the launching clock and the data might be a little slower than normal while the capturing clock is a little faster, so the check is pessimistic enough to hold on every chip. It's the same walk taking longer on a busy day.

Put it all together and the setup check for one path reads:

```
clock-to-q + logic + setup  ≤  period − jitter − skew − variation margin
```

Here's a budget for one path at 2.6 GHz. The numbers are illustrative, chosen to show the shape, not taken from any real library or process:

```
period             385 ps  ████████████████████████████████████████
  clock-to-q        35 ps  ████
  setup             15 ps  ██
  jitter            15 ps  ██
  skew              20 ps  ██
  variation margin  25 ps  ███
  left for logic   275 ps  ████████████████████████████
```

At an illustrative 15 ps per gate, 275 ps is about 18 gates in a row. That number, how deep the logic between two flip-flops can be, is what the RTL designer actually works with. Every picosecond spent elsewhere comes out of it.

In the constraint file that the tools read, the period and the clock's share of the margin are written down directly:

```
# SDC: time in ns
create_clock -name core_clk -period 0.385 [get_ports clk]
# the clock's own share: jitter plus a skew allowance
set_clock_uncertainty -setup 0.035 [get_clocks core_clk]
```

The skew in that number is a guess, made before the clock tree exists. Once the tree is built, the tools use the real time the clock reaches each flip-flop, and the uncertainty keeps only jitter and margin.

## Hold is a different check

There's a second check on every path, and it doesn't care about the period at all. Hold time asks the opposite question: does the new value arrive too *soon*, overwriting the old one before the capture flip-flop has finished taking it? It compares the launch and capture of the *same* edge, so slowing the clock down does nothing for it. In the airport, it's reaching your gate while the flight before yours is still boarding: arrive too early and you're on the wrong plane.

The check uses the *shortest* path, not the longest. With the same illustrative numbers:

```
data arrives:   clock-to-q 35 ps + shortest logic 5 ps        =  40 ps
data must stay: hold 10 ps + skew 20 ps (capture edge late)   =  30 ps
                                                  slack       = +10 ps

same path, skew 45 ps:  10 + 45 = 55 ps  >  40 ps   →  fails, at any clock speed
```

Skew is the link between the two checks. Skew that delays the capture edge gives a setup path more time, and gives the hold check less. That's why "just add skew" is never free, and why a chip that fails hold can't be rescued by running it slower.

## Splitting the budget across a team

Now step back from one path to the whole project. "The core runs at 2.6 GHz" is one requirement, but no single team can make it true. It has to be split into a smaller requirement for each part of the design that carries a share of it, each with its own test.

| Part of the design | Its share of 2.6 GHz | How it's checked |
| --- | --- | --- |
| Timing constraints | The clock is defined at about 385 ps, on the right pins, with the uncertainty budget above | A constraint check: the clock exists, at that period, where it should |
| RTL | Logic between flip-flops fits in what's left, and the cells that switch the clock off to save power don't slow it when it's on | Timing after synthesis, and simulation of those cells |
| Clock source | The PLL locks at 2.6 GHz with jitter inside its share | Measuring the PLL against its spec |
| Physical design | The clock tree meets its skew target; every path meets timing | The final timing check at 2.6 GHz, at every voltage and temperature the chip is sold for |

The top requirement is true only when every part's requirement is true *and the shares add up*. That second part is the one that gets missed. Each team can meet its own number and the chip can still fail, if the numbers were never made to sum to 385 ps.

And the budget doesn't only flow down. Say the PLL team finds their jitter is going to be twice what was planned: 30 ps instead of 15. Those 15 ps have to come from somewhere. Physical design could tighten the clock tree. The RTL could lose a gate from its deepest paths. If neither can give, the requirement itself comes back up for argument: a different PLL, a different clock tree, or a lower frequency. The design has changed the requirement. That loop, requirements shaping the design and the design pushing back on the requirements, is what makes a frequency target a budget rather than a wish.

## What to remember

- A clock period is a fixed budget: about 385 ps at 2.6 GHz.
- The data spends it on clock-to-q, logic and setup; the clock takes its own share for jitter, skew and on-chip variation.
- Hold is a separate check that the period can't fix, and skew trades between the two.
- A frequency target is met only when every team's share is written down, tested, and adds up.

For where clock speed meets the rest of an AI chip's design, read [How inference chips are built](/learn/how-inference-chips-are-built).
