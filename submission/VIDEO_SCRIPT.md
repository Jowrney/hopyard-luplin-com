# Hopyard Designer Demo Video

## Production target

- Runtime: under 3 minutes
- Target: 2:35–2:45
- Resolution: 1920×1080
- Frame rate: 30 fps delivery, 15 fps browser capture
- Video: H.264, yuv420p
- Audio: AAC, 48 kHz
- Narration: English, male (`en-US-AndrewMultilingualNeural`)
- Burned subtitles: English only
- Music: none
- Upload: Public YouTube

## Language versions

- Official challenge version: English male narration with English-only burned captions
- Korean companion version: Korean male narration (`ko-KR-HyunsuMultilingualNeural`) with Korean-only burned captions
- Both versions use the same verified browser recording and 2:39 scene timing

## Visual sequence

| Scene | Visual | Narration focus |
|---|---|---|
| Landing | Landing page, login and guest Demo CTA | Product and audience |
| Problem | Demo workspace overview | Connected agricultural decisions |
| Human workflow | Inputs, metrics, estimate | Existing human-operated capabilities |
| 2D | Construction plan | Poles, anchors, wire, plants |
| 3D | Orbit, zoom in, inspect poles, anchors, hardware, wire, and Y-shaped hops, then zoom out | Procedural reusable Blender assets |
| WebMCP tools | WebMCP 5 badge and actual tool list overlay | Structured site tools |
| Read context | Actual `get_design_context` result overlay | Agent reads current state |
| Simulate | Actual Korean I and North America simulations | Non-destructive alternatives |
| Compare | Candidate tray | Quantities, price, engineering status |
| Human choice | Select one of two visible candidate cards | The agent waits for the farmer |
| Preview | Shared 2D/3D preview | Exact baseline snapshot |
| Approval | Actual 5 → 7 tool count | Human approval boundary |
| Integrity | Discard and exact restoration | No invented price or approval |
| Impact | Restored workspace | Real audience and impact |
| Closing | Product name and Demo URL | Call to action |

## Editing principles

1. Show the WebMCP result within the first minute.
2. Use only actual browser tool calls and returned values.
3. Label the injected status box `LIVE WEBMCP CALL` so it is not confused with product UI.
4. Keep captions in the lower third normally, but move them below the header when the candidate tray is visible.
5. Avoid copyrighted music and third-party logos.
6. Do not show credentials, browser profiles, local paths, or DevTools secrets.
