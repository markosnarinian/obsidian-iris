import { getAllTags, type CachedMetadata } from 'obsidian';

export const AGENT_AUTHORED_TAG = '#agent-authored';

/** Obsidian's parsed metadata excludes code and supports frontmatter tags. */
export function isAgentAuthored(cache: CachedMetadata | null): boolean {
  return cache !== null && (getAllTags(cache) ?? []).some(
    (tag) => tag.toLowerCase() === AGENT_AUTHORED_TAG,
  );
}
