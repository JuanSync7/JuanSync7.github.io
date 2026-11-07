# Hardware craft rules

These trial rules apply to this atlas. They carry observations from the repair,
not a claim that the owner has adopted new global guidance. General taste remains
in the figure skill and the vault's `Making figures` deck.

| ID | Keep it | Reject when | Case and holder |
|---|---|---|---|
| HA-REF | Use the simple real assembly diagram before inventing detail. Record the physical rules in the reference card. | A component is a generic box that only its label identifies. | Vault R-FIG-1/2; reference card and visual reviewer. |
| HA-PART | Treat a part as a semantic assembly with repeated physical solids. | Two compute dies or eight stacks are named together but only one responds. | Repeated atlas hover; `checkSignals` and browser inspection. |
| HA-ROUTE | Place a board trace on its owning support, with named source and sink footprints and separate Manhattan lanes. | A route leaves the board, dangles, crosses an independent route or shares its lane. | Board fan-out and interposer bus overlaps; `checkRouting` plus endpoint checks. |
| HA-HOST | Move surface markings with their host and distinguish seams from solid geometry. | Board edge marks float beside a translated board; annulus facets become radial spokes. | Server laminate and tube rim; regression fixtures and visual reviewer. |
| HA-DEPTH | Keep opaque surfaces in painter order; show rear/internal edges quietly in wireframe. | A far marking or teal accent paints through a nearer solid, or an opening is filled. | Hollow sockets and vented covers; depth tests plus visual reviewer. |
| HA-FRAME | Pick from the unlifted pose at the painted framing; fit the entire visible assembly through transitions. | A hover flickers between lifted pieces, or isolation/camera changes clip geometry. | Selection and camera transitions; framing sweep plus browser inspection. |
| HA-WORK | Keep the seeded strip still and the main viewer responsive. | Idle thumbnails repaint continuously or thumbnail changes lose main-view interaction. | Eight continuously painted thumbnails; gallery browser regression. |

## Catch yourself

| Temptation | Do this instead |
|---|---|
| “One green face proves the whole part is selected.” | Inspect both compute dies and the entire memory bank; run `checkSignals`. |
| “Those wires fit the viewport, so they fit the board.” | Run support and endpoint checks in model coordinates. |
| “I can reuse the same elbow for the whole bus.” | Give every independent conductor its own lane; run `checkRouting`. |
| “The rim is a mesh, so draw every mesh edge.” | Keep the faces for occlusion and outline only physical boundaries. |
| “Freeze the entire atlas to make scrolling fast.” | Freeze thumbnails, then prove the main viewer still responds. |
| “All tests pass, so the isometric must look correct.” | Read the solid/wireframe sheets and close views with `LOOK.md`. |
| “The check is in my way.” | Fix the model; kernel/check changes require explicit infrastructure scope. |
