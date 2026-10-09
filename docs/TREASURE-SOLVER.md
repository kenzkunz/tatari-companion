# Treasure Hunt Solver

The public tool is available under Tools > Treasure Hunt Solver. It requires no login and stores the current board locally on this browser. Stage and treasure-set changes start a clean board; Undo can reverse them during the current visit.

Choose the stage and treasure set matching the in-game reward display. Click a tile and mark Empty, or choose a treasure, its rotation, and the part that was uncovered. A confirmed footprint consumes one treasure copy, blocks overlap, and is excluded from further dig recommendations. Reset tile removes its observation (and the whole anchored treasure if it belongs to one). Clear resets the current stage. Undo reverses a complete action.

The engine assumes a uniform distribution over valid non-overlapping layouts, with only the configured rotations. It enumerates small layout spaces exactly. For larger spaces it uses sequential importance sampling: each valid sample is weighted by the product of available placement counts along its generation path. This corrects the bias of choosing uniformly at each sequential step. Effective sample size is reported; low sample quality is flagged. Percentages are estimates of each unknown cell containing an undiscovered treasure, rather than probabilities that sum to 100 percent across the board. All tiles tied at displayed percentage precision with the best estimate receive recommendations.

The game placement distribution has not been independently verified. Failed sampling is not proof of an impossible board. Exact contradictions are reported separately. The curated v0.49.1 data contains 24 stages and 48 visual treasure sets. No Lua, resource costs, bomb weights, or client archives are shipped with the solver.

Validation: `node treasure-solver-check.mjs`, followed by the existing site checks and GitHub Pages build. Tests include hand-calculated boards, conditioning on empties, confirmed-treasure exclusion, rotations, contradictions, all stage-set artwork references, and conservation of remaining treasure area.

Tile artwork overlaps by 5 CSS pixels horizontally and 10 CSS pixels vertically, in row-major paint order. The logical board remains unchanged.
