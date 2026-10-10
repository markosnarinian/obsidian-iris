import { describe, expect, it } from 'vitest';
import type { App, CachedMetadata } from 'obsidian';
import { TFile } from './obsidian';
import { setAgentAuthored } from '../src/authorship';

function note(frontmatter: Record<string, unknown>, body = '', inlineTags: string[] = []) {
  const file = new TFile('Draft.md');
  let content = body;
  const cache = {
    frontmatter,
    tags: inlineTags.map(tag => ({ tag })),
  } as CachedMetadata;
  const app = {
    metadataCache: { getFileCache: () => cache },
    fileManager: {
      processFrontMatter: async (_file: TFile, update: (data: Record<string, unknown>) => void) => {
        const next = structuredClone(frontmatter);
        update(next);
        for (const key of Object.keys(frontmatter)) delete frontmatter[key];
        Object.assign(frontmatter, next);
      },
    },
    vault: { process: async (_file: TFile, update: (data: string) => string) => { content = update(content); } },
  } as unknown as App;
  return { app, file, frontmatter, body: () => content };
}

describe('authorship tag edits', () => {
  it('marks notes through their tags property without duplicating tags or changing other properties', async () => {
    for (const tags of [undefined, null, 'research', ['research', 'agent-authored/reviewed']]) {
      const f = note({ ...(tags === undefined ? {} : { tags }), title: 'Keep this' }, 'Untouched body');
      await setAgentAuthored(f.app, f.file, true);
      await setAgentAuthored(f.app, f.file, true);
      expect(f.frontmatter).toEqual({
        title: 'Keep this',
        tags: [...(tags == null ? [] : typeof tags === 'string' ? [tags] : tags), 'agent-authored'],
      });
      expect(f.body()).toBe('Untouched body');
    }
    const inline = note({}, '#AGENT-AUTHORED', ['#AGENT-AUTHORED']);
    await setAgentAuthored(inline.app, inline.file, true);
    expect(inline.frontmatter).toEqual({ tags: ['agent-authored'] });
    expect(inline.body()).toBe('#AGENT-AUTHORED');
  });

  it('unmarks only property tags, preserving all inline tags and body text', async () => {
    const f = note(
      { tags: ['research', '#AGENT-AUTHORED', 'agent-authored', 'agent-authored/reviewed'], title: 'Keep' },
      'Start #AGENT-AUTHORED, then #agent-authored. Keep #agent-authored/reviewed and `#agent-authored`.',
      ['#AGENT-AUTHORED', '#agent-authored'],
    );
    await setAgentAuthored(f.app, f.file, false);
    expect(f.frontmatter).toEqual({ tags: ['research', 'agent-authored/reviewed'], title: 'Keep' });
    expect(f.body()).toBe('Start #AGENT-AUTHORED, then #agent-authored. Keep #agent-authored/reviewed and `#agent-authored`.');
    const only = note({ tags: 'agent-authored', title: 'Keep' });
    await setAgentAuthored(only.app, only.file, false);
    expect(only.frontmatter).toEqual({ title: 'Keep' });
    const inlineOnly = note({}, '#agent-authored', ['#agent-authored']);
    await setAgentAuthored(inlineOnly.app, inlineOnly.file, false);
    expect(inlineOnly.frontmatter).toEqual({});
    expect(inlineOnly.body()).toBe('#agent-authored');
  });

  it('rejects invalid tags properties rather than discarding their contents', async () => {
    const f = note({ tags: { unexpected: 'value' }, title: 'Keep' }, 'Body');
    await expect(setAgentAuthored(f.app, f.file, true)).rejects.toThrow('tags property must be text');
    expect(f.body()).toBe('Body');
    expect(f.frontmatter).toEqual({ tags: { unexpected: 'value' }, title: 'Keep' });
  });
});
