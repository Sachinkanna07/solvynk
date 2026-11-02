# NVDA manual accessibility review — 2026-10-25

## Environment and boundary

- Candidate: `review/t002-qa-2026-10-24` at `4bf986b84189ee9c5930b0fe5e95b0a0e8a4a2d5`.
- NVDA: installed 2026.2 (file version 2026.2.0.57664), signed by NV Access Limited, process launched. The first-run "Welcome to NVDA" dialog was observed. The user later confirmed that NVDA spoke during interaction and the dialog closed. The reviewer did not hear or capture those announcements.
- Windows: 11 Home Single Language, build 26200. Chrome: 155.0.8059.86. Chrome Guest mode opened; navigation to the prototype stopped when computer-use URL policy could not determine the browser URL. The prototype has not been navigated in the browser with NVDA.
- Local prototype server: `http://127.0.0.1:4173/index.html` responded with HTTP 200. The server response is not evidence of screen-reader usability.
- Keyboard mode: NVDA welcome dialog displays Desktop as the selected layout. Browse/focus mode and relevant speech settings have not been verified.
- Overall state: **INSTALLED; SPEECH USER-CONFIRMED; MANUAL JOURNEYS PENDING**. Each journey still needs its actual announcements observed or user-confirmed before it can be scored PASS.

## Journey record

All rows use Chrome 155.0.8059.86 as the intended browser. No journey steps were performed, so the actual result is "not observed", issue/severity is "undetermined", and the evidence reference is the first-run dialog observation above. These rows must be replaced with actual steps, announcements, and evidence after a genuine NVDA session.

| # | Journey | Steps performed | Expected behavior to verify | Actual observed or user-confirmed behavior | Result | Issues / severity | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | Homepage | None | Title, landmarks, headings, hero, links, skip link, reading and focus order | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 2 | Main navigation | None | Logo, desktop/mobile navigation, menu name/state, Escape, focus return | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 3 | Explore | None | Search label and announcements, filter states, counts, empty state, keyboard and dynamic feedback | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 4 | Project page | None | Title, creator, description, stage/demo, save/share, technical sections and gallery | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 5 | Problem and BuildTree | None | Title, numbered requirements, linked solutions, claims, confirmations, Featured, reading order | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 6 | Studio navigation | None | Tab roles, labels, selected state, keyboard switching, focus and panel boundaries | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 7 | Project Builder | None | Labels, required fields, validation, recovery, draft/preview/reset and status announcements | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 8 | Problem Owner | None | Form, requirement addition/removal, dynamic updates, preview, validation and focus | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 9 | BuildTree Linker | None | Selections, duplicate prevention, linked state, success and error announcements | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 10 | Owner Review | None | Confirmation controls, review, Featured state, status, focus and claim/review distinction | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 11 | Member controls | None | Saved projects, save state, activity, updates and navigation | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 12 | Admin demonstration | None | Control names, toggle states, descriptions, feedback and keyboard use; prototype scope clear | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 13 | Dialogs | None | Name, modal announcement, initial/trapped focus, Escape/close/return and inert background | Not observed | NOT TESTED | Undetermined | First-run dialog |
| 14 | Dynamic content | None | Announcements for saves, resets, errors, success, empty results, reviews, linking and duplicates | Not observed | NOT TESTED | Undetermined | First-run dialog |

## Next manual interaction

The user needs to open the local prototype in Chrome and join or confirm the browser journeys if speech cannot be captured reliably. No accessibility defect is confirmed, no source fix is justified, and no WCAG conformance claim is made from this record.
