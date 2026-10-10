# Publishing Iris Companion

## Prepare a release

1. Keep the version in `manifest.json` and `package.json` identical. Map that version to its minimum Obsidian version in `versions.json`. The initial release is **0.1.0**, requiring **Obsidian 1.8.7** or newer.
2. Run the checks and production build:

   ```sh
   npm ci
   npm test
   npm run lint
   npm run build
   ```

3. Test the resulting files in a separate vault under `.obsidian/plugins/iris-companion/`. Verify root and nested tags, property-only commands, both indicators, tooltip interaction, and cleanup after disabling the plugin. If upgrading a development installation named `iris`, disable it first, rename its folder to `iris-companion`, and restart Obsidian.
4. Commit and push the reviewed source and metadata to `main`. Keep the production bundle out of Git; `main.js` belongs in release assets.
5. In [GitHub Releases](https://github.com/markosnarinian/obsidian-iris/releases), create a release targeting that commit. Use **0.1.0** as the tag, without a `v` prefix. Attach these files individually from the same production build:
   - `main.js`
   - `manifest.json`
   - `styles.css`

   GitHub's automatic source archives, or a plugin ZIP alone, do not replace these attachments. Publish the release rather than leaving it as a draft.

Suggested initial release notes:

> Highlight agent-authored notes with a compact banner and theme-aware explorer markers. Recognizes `#agent-authored` and nested tags, with commands to add or remove authorship tags from file properties. Both indicators can be toggled independently. No network requests or telemetry.

## Submit manually

For the standard open-source submission, the repository must be public so reviewers and users can access it. This repository was private during preparation; changing its visibility and publishing a GitHub release are separate owner actions.

1. Sign in to [community.obsidian.md](https://community.obsidian.md) with your Obsidian account and connect GitHub from your profile.
2. Select **Plugins → New plugin** and enter `https://github.com/markosnarinian/obsidian-iris`. Select the owner, agree to the developer policies, and submit.
3. Address automated review errors. If changes are needed, increment the version and publish a new matching release.
4. Add the directory description and select **Publish**. Installation remains blocked until review errors are resolved.

The manifest ID is **iris-companion** and the display name is **Iris Companion**: `iris` and “Iris” are already used by another community plugin. Neither new value appeared in the published directory during preparation; the submission service is the final authority on availability.

If keeping source private is intentional, follow the documented private-source route instead: a public release repository plus access for Obsidian's Community directory GitHub App, with the required README disclosure.

## Official references

- [Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements](https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins)
- [Developer policies](https://docs.obsidian.md/Community+directory/Developer+policies)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Manage your plugin or theme](https://docs.obsidian.md/Community+directory/Manage+your+plugin+or+theme)
