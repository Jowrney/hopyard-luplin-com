# Devpost form copy

## Project name

Hopyard Designer

## Project tagline

Agent-assisted hopyard planning with live estimates and shared 2D/3D review.

## About the project

Paste the following Markdown into **About the project**:

---

## Inspiration

Planning a hopyard is a connected design problem. Plant spacing affects plant count and planting-stock cost. Pole spacing changes the structure and material quantities. Wire, anchors, wind loads, and labor all affect the final estimate.

Hopyard Designer already helped growers and installers work through those decisions in a visual web app. The WebMCP Challenge gave us a chance to answer a harder question: can an AI agent help explore alternatives without hiding changes from the farmer or taking over the final decision?

We wanted the agent and the farmer to work in the same design space. The agent should be able to read the current plan, prepare alternatives, and explain the differences. The farmer should be able to inspect every proposal in the existing 2D and 3D views before deciding what to keep.

## What it does

Hopyard Designer calculates planting-stock cost, facility quantities, preliminary structural loads, and a live material estimate from a hopyard design.

As the design changes, the app updates:

- pole and anchor quantities;
- main wire, training wire, and twine lengths;
- hop positions and planting-stock cost;
- preliminary wind and crop-load checks;
- a construction-oriented 2D plan;
- an interactive 3D farm; and
- a downloadable estimate PDF.

For the challenge, we added a WebMCP workflow that lets an agent create design alternatives without changing the original plan. In the demo, the agent compares a Korean I-shaped training layout with a North American 18-foot Y-shaped reference. Both options appear side by side with their plant counts, estimated costs, materials, and engineering status.

The farmer chooses which option to preview. The selected candidate appears in the same 2D and 3D workspace. Nothing is committed yet.

## How WebMCP works

The page initially registers five tools:

- `get_design_context`
- `list_regional_profiles`
- `simulate_design`
- `show_candidates`
- `preview_candidate`

The agent starts by reading the current design and its calculated results. It can then simulate alternatives and place up to three candidates in the shared comparison tray.

When a candidate enters preview, the page dynamically registers two more tools:

- `apply_candidate`
- `discard_preview`

This changes the available tool set from five to seven. Apply and Discard only exist while there is an active preview. After either action, the page returns to five tools.

That lifecycle creates a visible review step. The agent can prepare and preview options, while the farmer uses the shared interface to decide whether to apply or discard the active preview. The `apply_candidate` tool description explicitly directs the agent to use it only after user approval.

## How we built it

The application uses Next.js, React, and TypeScript. Zustand holds the active design and the separate candidate workspace. Konva renders the 2D construction plan, while Three.js renders the farm in 3D.

We used BlenderMCP to create a reusable GLB asset kit with pole variants, anchors, turnbuckles, wire hardware, and low-poly hop geometry. The web renderer places those assets procedurally instead of loading a fixed model of the whole farm, so every candidate remains editable. Repeated components use instancing to keep the 3D view responsive.

WebMCP tool inputs use strict JSON Schema and are validated again with Zod at runtime. Candidate IDs are deterministic. Preview stores an exact snapshot of the active design, so Discard can restore it without relying on a reverse calculation.

The production site uses Chrome's WebMCP Origin Trial. We also built CDP-based checks that verify tool registration, tool invocation, the five-to-seven-to-five lifecycle, responsive layouts, and browser console errors against the real page.

## Challenges we ran into

### Keeping the workflow non-destructive

An agent needs enough freedom to explore, but a design tool cannot silently overwrite a farmer's work. We separated simulation, display, preview, and application into distinct states. That made the approval step visible in both the UI and the tool surface.

### Making browser support testable

WebMCP availability depends on the browser runtime. A normal browser without the API can make a correct implementation look broken. We added an Origin Trial token for the production origin and built browser-level checks instead of relying only on mocked unit tests.

### Rendering a full farm in 3D

A detailed plant model looked good by itself but became too expensive when repeated hundreds of times. We replaced it with a low-poly procedural asset kit and instanced repeated components. The result can still be rotated and zoomed while the plan updates.

### Comparing regions without inventing data

The Korean profile can use the active HOPEDEN catalog. The North American profile is explicitly a reference configuration. It does not pretend to provide live US pricing or local engineering approval. The interface and WebMCP results preserve that distinction.

## What we learned

A useful agent interface is not the same as automating clicks. The agent works better when the page exposes clear operations with validated inputs, stable identifiers, and results that describe what changed.

We also learned that dynamic tool registration can communicate application state. In this project, the presence of Apply and Discard tells the agent that a human review is in progress.

Most importantly, the shared preview gives the farmer a concrete way to verify an agent's proposal. The agent can move quickly, but the person still sees the same plan, quantities, safety status, and estimate before making the final call.

## Accomplishments that we're proud of

- A real five-to-seven-to-five WebMCP tool lifecycle
- Deterministic alternatives that do not mutate the baseline design
- Exact restoration after Discard
- Human selection and approval in the same 2D and 3D workspace
- Procedural Blender assets that respond to design changes
- English and Korean interfaces and estimate PDFs
- A public demo that works without an account while the normal product routes remain protected

## What's next

We want to add more regional construction profiles, supplier integrations, and auditable collaboration history. Future versions could let a grower compare contractor proposals, save approved agent changes as project revisions, and hand the final design package to a local engineer for review.

## Existing product and challenge work

Hopyard Designer existed before the challenge with its human-operated design form, calculations, estimates, authentication, project saving, and 2D/3D visualization.

The WebMCP tools, candidate simulation and comparison workflow, dynamic approval tools, regional comparison, reusable Blender asset kit, public judge route, and browser-level WebMCP verification were added for this challenge.

## License

The complete source repository is available under the MIT License.

---

## Built with

Add these tags, subject to Devpost autocomplete availability:

```text
WebMCP, Next.js, React, TypeScript, Three.js, Blender, BlenderMCP, Supabase, Zod, Zustand, Konva, styled-components, jsPDF, Node.js, GitHub Actions, Chrome Origin Trials, Chrome DevTools Protocol, PM2
```

That is 18 tags, below the visible limit of 25.

## Try it out links

Add these as separate links:

1. **Live challenge demo**

   https://hopyard.luplin.com/design/demo

2. **Product landing page**

   https://hopyard.luplin.com/

3. **Public source repository**

   https://github.com/Jowrney/hopyard-luplin-com

The repository is Public and anonymously accessible, so add it as the third link.

## Separate video field

Use the final public YouTube URL in Devpost's demo-video field. The official challenge version should be the English 2:41 video.
