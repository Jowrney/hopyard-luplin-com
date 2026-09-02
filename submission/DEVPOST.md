# HOPEDEN Designer — WebMCP Challenge Submission Draft

## Tagline

A shared hopyard design workspace where an AI agent explores alternatives and the farmer previews, applies, or discards them in the same 2D/3D interface.

## What it does

HOPEDEN Designer helps hop farmers and facility installers plan planting density, poles, wire, anchors, training systems, preliminary structural loads, and project cost. Human inputs immediately update calculated quantities, a construction-oriented 2D plan, an interactive 3D farm, and an estimate.

## Why this is a strong fit for WebMCP

Hopyard design is a connected decision problem: changing spacing, training style, materials, or regional assumptions changes quantities, safety, visualization, and cost together. A screen-clicking agent would need to infer UI controls and could easily overwrite work without the farmer understanding what changed.

WebMCP gives the agent explicit, validated design operations. The agent can read the current design, inspect regional systems, simulate alternatives without modifying the baseline, show candidates in the visual comparison tray, and preview one in the shared 2D/3D canvas. Apply and Discard tools appear only during preview, so the agent must wait for explicit human approval.

## What people and agents can do together

Before the WebMCP extension, a person had to change one input at a time, remember the previous configuration, and manually compare quantities, loads, and costs. Now an agent can create several deterministic alternatives while the person keeps the original intact. Both sides inspect the same candidate cards and the same farm visualization before the person accepts or rejects a change.

A representative workflow is:

1. Read the active design context.
2. Simulate a Korean I-training alternative.
3. Simulate a sourced North American 18 ft reference alternative.
4. Show both candidates in the comparison tray.
5. Preview one candidate in 2D and 3D.
6. Compare poles, wire length, plant count, estimate, and engineering status.
7. Wait for the farmer to Apply or Discard.

## How WebMCP was implemented

The top-level design page registers five initial imperative tools:

- `get_design_context`
- `list_regional_profiles`
- `simulate_design`
- `show_candidates`
- `preview_candidate`

During preview, two additional stateful tools are registered dynamically:

- `apply_candidate`
- `discard_preview`

All agent input is constrained by JSON Schema and revalidated at runtime with Zod. Candidate identifiers are deterministic. Simulation is separated from application, and the original Zustand design snapshot is restored exactly on discard. Tool results include calculated deltas, pricing status, planning status, and explicit warnings.

The production origin is enrolled in Chrome's WebMCP Origin Trial. The public challenge route requires no authentication, while the normal product workspace retains email authentication and project saving.

## Existing product versus challenge work

### Existing before the challenge

- Human-operated hopyard form
- Seed and material quantity calculations
- Preliminary structural load calculations
- Live Korean material estimates
- 2D/3D visualization
- PDF export and authenticated project saving

### Added during the challenge

- Seven WebMCP tools and runtime validation
- Deterministic, non-destructive candidate simulation
- Candidate comparison tray
- Shared 2D/3D preview lifecycle
- Human Apply/Discard approval boundary
- Dynamic 5 → 7 → 5 tool registration
- Korean and North American reference profiles
- BlenderMCP-authored reusable GLB asset kit
- Public `/design/demo` judge route
- English/Korean UI, help, and PDF support
- Origin Trial activation and browser-level CDP verification

## Links

- Live demo: https://hopyard.luplin.com/design/demo
- Product landing: https://hopyard.luplin.com/
- Repository URL (make Public before submission): https://github.com/Jowrney/hopyard-luplin-com
- Demo video: add the public YouTube URL here

## Testing instructions

Open the live demo in the ChatGPT Desktop in-app browser or Chrome 149–156 with WebMCP available. The production origin includes an Origin Trial token.

Click the right-side Review button if the review panel is closed, then confirm the `WebMCP 5` badge. Click the badge for the built-in testing guide and copyable prompt.

Expected lifecycle:

```text
5 initial tools → simulate two candidates → show → preview → 7 tools → Apply or Discard → 5 tools
```
