A new `redirects.json` maps three retired Wix paths to their current equivalents, wired
into `.github/workflows/pages.yml`'s build step via `--static-redirects-file` — the actual
redirect mechanism lives entirely in the wixy engine, this repo supplies only the data.
