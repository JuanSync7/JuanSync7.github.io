# Connect real endpoints

**Use when:** changing wires, roads, access paths, walls or openings.

1. Name both endpoints before routing. An endpoint belongs to a terminal, selected
   boundary continuation, graph junction, doorway or entrance.
2. Reserve the route's corridor and clearance. Bend within that corridor; do not
   cross an unrelated device, room interior, building or river to shorten it.
3. Represent a crossing honestly. Different routing layers need a meaningful via
   policy; road/water crossings need a bridge. A visual crossing is not automatically
   a junction; a dot is not proof of connection without coincident geometry.
4. Break the actual wall for each doorway/window. Reserve the swing and approach
   before furnishing. Join stairs to a landing and circulation, not a sealed shaft.
5. Test the emitted points and segments independently of their semantic labels.
   Check reachability after splitting routes at intersections, including T-junctions.
6. Review a close-up of the repaired seed and a neighboring seed at the same scale.

**Reject:** lines terminating in component centers, orphan stubs masked by a portal,
a door arc on an intact wall, or graph metadata that contradicts the drawing.
