import { getAllTags, parseFrontMatterTags, type App, type CachedMetadata, type TFile } from 'obsidian';

export const AGENT_AUTHORED_TAG = '#agent-authored';
export const CONTAINS_AGENT_AUTHORED_TAG = '#contains-agent-authored';
export type AuthorshipTag = typeof AGENT_AUTHORED_TAG | typeof CONTAINS_AGENT_AUTHORED_TAG;

function matchesAuthorshipTag(tag: string, rootTag: AuthorshipTag): boolean {
  const normalized = tag.replace(/^#/, '').toLowerCase();
  const root = rootTag.slice(1);
  return normalized === root || normalized.startsWith(`${root}/`);
}

/** Obsidian's parsed metadata excludes code and supports frontmatter tags. */
export function getAuthorshipTag(cache: CachedMetadata | null): AuthorshipTag | null {
  const tags = cache === null ? [] : getAllTags(cache) ?? [];
  // Whole-file authorship takes precedence over contained material.
  return ([AGENT_AUTHORED_TAG, CONTAINS_AGENT_AUTHORED_TAG] as const).find(
    root => tags.some(tag => matchesAuthorshipTag(tag, root)),
  ) ?? null;
}

/** Edit only the file-level tags property; never change the note body. */
export async function setAgentAuthored(
  app: App, file: TFile, authored: boolean, rootTag: AuthorshipTag = AGENT_AUTHORED_TAG,
): Promise<void> {
  const cache = app.metadataCache.getFileCache(file);
  // Avoid creating frontmatter when unmarking a note with no file-level tag.
  if (!authored && !(parseFrontMatterTags(cache?.frontmatter) ?? []).some(tag => matchesAuthorshipTag(tag, rootTag))) return;

  await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
    const value: unknown = frontmatter.tags;
    if (value !== undefined && value !== null && typeof value !== 'string'
      && !(Array.isArray(value) && value.every(tag => typeof tag === 'string'))) {
      throw new Error('The tags property must be text or a list of text tags.');
    }
    const tags = parseFrontMatterTags({ tags: value }) ?? [];
    if (authored && tags.some(tag => tag.toLowerCase() === rootTag)) return;
    const remaining = (authored ? tags : tags.filter(tag => !matchesAuthorshipTag(tag, rootTag)))
      .map(tag => tag.slice(1));
    if (authored) remaining.push(rootTag.slice(1));
    if (remaining.length > 0) frontmatter.tags = remaining;
    else delete frontmatter.tags;
  });
}
