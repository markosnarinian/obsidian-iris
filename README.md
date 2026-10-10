# Iris

Make agent-authored notes recognizable without changing how you work in your vault.

Add `#agent-authored` to a Markdown note, or include it in the note's tags property:

```yaml
---
tags:
  - agent-authored
---
```

Iris displays:

- **A compact banner** above the note in reading mode, Live Preview, and source mode. On by default. It says “This file is agent-authored.” Click the info button on the right, or activate it with Enter/Space, to see why it appears. The explanation is also available on hover and to screen readers.
- **An explorer dot** at the right edge of tagged file entries. On by default. The dot and ring use the theme's accent color, separated by Obsidian's neutral background color (`--background-primary`), with padding around the marker. Its explanation appears immediately on hover. It leaves filename colors, icons, and selection styling alone, including those set by [Color Tags](https://github.com/markosnarinian/obsidian-color-tags).

Each indicator can be toggled independently in **Settings → Iris**. Changes apply immediately and persist across restarts. Removing the tag removes the indicators after Obsidian updates its metadata cache. Disabling Iris removes all its decorations.

Both indicators show the same explanation: “This file is marked as agent-authored because it contains #agent-authored or one of its nested tags.”

## Commands

With a Markdown note active, open the command palette:

- **Iris: Add agent-authored tag to file properties** adds the exact `agent-authored` tag to the note's file-level `tags` property, even if a nested tag already exists. Existing tags and other properties are preserved, and the exact property tag is not duplicated.
- **Iris: Remove agent-authored tag from file properties** removes `agent-authored` and all its nested tags from the file-level `tags` property. All inline tags and the note body are left untouched.

These commands work in reading and editing views, and can be assigned hotkeys in Obsidian's settings. Tag matching remains case-insensitive. Property edits use Obsidian's frontmatter API, which may reformat YAML. The indicators still recognize inline `#agent-authored` tags and their descendants, so removing the property tags does not hide them if a matching inline tag remains. Remove inline tags manually when needed.

## Screenshots

The banner identifies the open note, while the right-aligned explorer markers make tagged files easy to spot.

### Dark theme

![Iris in Obsidian's dark theme, showing the agent-authored banner, info button, and right-aligned explorer markers](docs/images/iris-dark.png)

### Light theme

![Iris in Obsidian's light theme, showing the agent-authored banner, info button, and right-aligned explorer markers](docs/images/iris-light.png)

## What the tag means

The tag is an explicit label, not an AI detector, proof of provenance, or a review status. Iris does not know which agent wrote a note or whether it has since been edited by a human.

Matching is case-insensitive and includes nested tags: `#AGENT-AUTHORED`, `#agent-authored/reviewed`, and deeper descendants all work. Similar names such as `#agent-authoredness` and tags under a different parent such as `#team/agent-authored` do not. Nested tags currently use the same banner and explorer marker as the root tag; descriptor-specific banner elements are planned for the future. Tags in inline code and fenced code blocks do not count. Inline tags and frontmatter tags are read through Obsidian's metadata API.

Decorations belong to open Markdown panes and the file explorer, not the note itself. They are not inserted into Markdown, embeds, exported content, or printed pages.

## Install locally

Requires Obsidian 1.8.7 or newer (for the native click-triggered tooltip API). Iris is not yet published in the community directory.

1. Build the plugin (see below).
2. Create `<vault>/.obsidian/plugins/iris/`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into that directory.
4. In Obsidian, enable community plugins, then enable **Iris** under **Settings → Community plugins**. Restart Obsidian if it does not appear.

The plugin uses no network services, telemetry, accounts, or paid APIs, and does not access files outside the vault. It changes notes only when you invoke a marking/unmarking command. Only its two preferences are saved to plugin data.

## Development

Follow Obsidian's [Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) tutorial. **Use a separate development vault, never your main vault.** The build setup follows the official sample plugin's TypeScript/esbuild approach; there is no UI framework or runtime dependency.

Use Node.js 22.12+ or 24+:

```sh
npm ci
npm test
npm run lint
npm run build
```

`npm run dev` watches source files and rebuilds `main.js`. Copy the three plugin files into your development vault, or place this checkout at `<development-vault>/.obsidian/plugins/iris/`. Disable and re-enable Iris to load changed code; [Hot Reload](https://github.com/pjeby/hot-reload) can automate this. Restart Obsidian after changing the manifest.

### Structure

- `src/main.ts`: plugin startup, preferences, and component ownership.
- `src/authorship.ts`: one source of truth for the authorship tag, detection, and tag edits.
- `src/highlights.ts`: the highlight feature, with lifecycle-managed events, observers, and cleanup. The explorer's non-public DOM selectors are confined here.
- `src/settings.ts`: two preferences, shared definitions for modern settings search and older hosts.
- `styles.css`: namespaced, theme-aware decorations using logical spacing for RTL layouts.

Future agent features can be separate child components owned by the plugin, reusing tag detection where appropriate. There is intentionally no speculative agent runtime, feature registry, or provider layer.

The automated tests use a small Obsidian host double because the npm API package contains type definitions, not an executable host. They cover root and nested tag matching, property-only tag edits, independent toggles, multiple panes, explorer rebuilding, rename behavior, cleanup, and preserving other plugins' styles. Real Markdown parsing and rendering must also be checked in Obsidian.

### Manual verification

In a dedicated vault, test frontmatter and inline tags alongside untagged notes, code examples, and nested tags. Add/remove a tag while a note is open; rename a tagged file; open it in split panes and switch between reading, Live Preview, and source modes. Test each toggle and persistence after re-enabling Iris. Hover the explorer dot, then click the banner's info button and activate it with Enter/Space to check its explanation. Enable Color Tags and confirm filename colors survive. Check light/dark themes, colored explorer rows, narrow panes, and mobile emulation. Disable Iris and confirm its elements disappear while other plugins' styling remains.

Desktop Obsidian 1.12.4 and mobile emulation were exercised during initial development. Native mobile devices and older supported versions still need device/version testing. Explorer markup is an internal integration point and may need adjustment after future Obsidian updates.

## Release

Run the checks above. A GitHub release tag must match `manifest.json`'s version and carry `main.js`, `manifest.json`, and `styles.css` as assets. Keep `versions.json` in sync when the minimum supported Obsidian version changes. See [Submit your plugin](https://docs.obsidian.md/plugins/releasing/submit-plugin) before publishing to the community directory.

## License

MIT. Build tooling is adapted from the [official Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin) (0-BSD).
