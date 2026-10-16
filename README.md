# BuildSocial prototype

An intentionally dependency-free frontend prototype for an India-first platform connecting real problems with credible builders. The UI uses fixture data only.

## Run locally

Serve the folder over HTTP so detail-page query routes and clipboard behavior work:

    python -m http.server 4173

Then open http://localhost:4173/index.html.

## Demo routes

- /index.html — homepage, open-problem and shipped-project previews, workflow, and private-beta CTA
- /explore.html — searchable and filterable fixture problems and projects
- /problem.html?slug=clean-water-testing — problem detail with requirements, build window, CTA, and listed solution
- /project.html?slug=clearflow — project detail with stack, coverage, limitations, updates, demo, share, and local save

## Prototype boundaries

There is no backend, authentication, GitHub integration, moderation, or production persistence. Waitlist, “I’m building this”, share, and save actions are clearly labeled prototype behavior. Save state uses only this browser’s localStorage; no personal data is transmitted.
