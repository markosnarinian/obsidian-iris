import { getAllTags, parseFrontMatterTags, type App, type CachedMetadata, type TFile } from 'obsidian';

export const AGENT_AUTHORED_TAG = '#agent-authored';

function matchesAuthorshipTag(tag: string): boolean {
  const normalized = tag.replace(/^#/, '').toLowerCase();
  const root = AGENT_AUTHORED_TAG.slice(1);
  return normalized === root || normalized.startsWith(`${root}/`);
}

/** Obsidian's parsed metadata excludes code and supports frontmatter tags. */
export function isAgentAuthored(cache: CachedMetadata | null): boolean {
  return cache !== null && (getAllTags(cache) ?? []).some(matchesAuthorshipTag);
}

/** Edit only the file-level tags property; never change the note body. */
export async function setAgentAuthored(app: App, file: TFile, authored: boolean): Promise<void> {
  const cache = app.metadataCache.getFileCache(file);
  // Avoid creating frontmatter when unmarking a note with no file-level tag.
  if (!authored && !(parseFrontMatterTags(cache?.frontmatter) ?? []).some(matchesAuthorshipTag)) return;

  await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
    const value: unknown = frontmatter.tags;
    if (value !== undefined && value !== null && typeof value !== 'string'
      && !(Array.isArray(value) && value.every(tag => typeof tag === 'string'))) {
      throw new Error('The tags property must be text or a list of text tags.');
    }
    const tags = parseFrontMatterTags({ tags: value }) ?? [];
    if (authored && tags.some(tag => tag.toLowerCase() === AGENT_AUTHORED_TAG)) return;
    const remaining = (authored ? tags : tags.filter(tag => !matchesAuthorshipTag(tag)))
      .map(tag => tag.slice(1));
    if (authored) remaining.push(AGENT_AUTHORED_TAG.slice(1));
    if (remaining.length > 0) frontmatter.tags = remaining;
    else delete frontmatter.tags;
  });
}
