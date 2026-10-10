import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App, CachedMetadata } from 'obsidian';
import { Events, MarkdownView, TFile } from './obsidian';
import { AuthorshipHighlights } from '../src/highlights';
import { DEFAULT_SETTINGS } from '../src/settings';
import { isAgentAuthored } from '../src/authorship';

const tagged = { frontmatter: { tags: ['agent-authored'] } };
const count = (selector: string) => document.querySelectorAll(selector).length;

function fixture() {
  const files = [new TFile('Agent.md'), new TFile('Human.md')];
  const cache = new Map<string, object>([['Agent.md', tagged], ['Human.md', {}]]);
  const explorer = document.createElement('div');
  function addRow(path: string) {
    const row = document.createElement('div');
    row.className = 'nav-file-title color-tags-item';
    row.dataset.path = path;
    row.style.setProperty('--nav-item-color', '#34c759');
    const label = document.createElement('span');
    label.className = 'nav-file-title-content';
    label.textContent = path;
    row.append(label);
    explorer.append(row);
    return row;
  }
  const rows = files.map(file => addRow(file.path));
  const views = files.map(file => new MarkdownView(file));
  document.body.append(explorer, ...views.map(view => view.contentEl));
  const workspace = Object.assign(new Events(), {
    getLeavesOfType: (type: string) => type === 'markdown'
      ? views.map(view => ({ view })) : [{ view: { containerEl: explorer } }],
    onLayoutReady: (callback: () => void) => callback(),
  });
  const metadataCache = Object.assign(new Events(), {
    getFileCache: (file: TFile) => cache.get(file.path) ?? null,
  });
  const vault = Object.assign(new Events(), {
    getAbstractFileByPath: (path: string) => files.find(file => file.path === path) ?? null,
  });
  const settings = { ...DEFAULT_SETTINGS };
  const highlights = new AuthorshipHighlights({ workspace, metadataCache, vault } as unknown as App, settings);
  highlights.load();
  return { highlights, settings, files, cache, rows, views, workspace, metadataCache, vault, addRow };
}

async function settle() {
  await vi.advanceTimersByTimeAsync(200);
}

describe('agent-authored highlights', () => {
  let highlights: AuthorshipHighlights | undefined;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    highlights?.unload();
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('matches the exact tag, case-insensitively, in parsed inline or frontmatter tags', () => {
    for (const cache of [tagged, { tags: [{ tag: '#AGENT-AUTHORED' }] }]) {
      expect(isAgentAuthored(cache as CachedMetadata)).toBe(true);
    }
    for (const cache of [null, {}, { tags: [{ tag: '#agent-authored/reviewed' }] },
      { tags: [{ tag: '#agent-authoredness' }] }]) {
      expect(isAgentAuthored(cache as CachedMetadata | null)).toBe(false);
    }
  });

  it('marks only tagged files, preserves color tags, and independently toggles each decoration', async () => {
    const f = fixture();
    highlights = f.highlights;
    await settle();
    expect(count('.iris-authored-banner')).toBe(1);
    expect(count('.iris-authored-dot')).toBe(1);
    const banner = f.views[0]!.contentEl.querySelector('.iris-authored-banner')!;
    expect(banner.textContent).toBe('This file is agent-authored.');
    const info = banner.querySelector('button')!;
    expect(info.getAttribute('aria-label')).toBe(
      'This file is marked as agent-authored because it contains the #agent-authored tag.',
    );
    expect(f.rows[0]!.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe(
      'This file is marked as agent-authored because it contains the #agent-authored tag.',
    );
    expect(info.tabIndex).toBe(0);
    info.click();
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      'This file is marked as agent-authored because it contains the #agent-authored tag.',
    );
    info.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(count('[role="tooltip"]')).toBe(0);
    info.focus();
    info.click();
    info.blur();
    expect(count('[role="tooltip"]')).toBe(0);
    expect(f.rows[0]!.style.getPropertyValue('--nav-item-color')).toBe('#34c759');
    expect(f.rows[0]!.classList.contains('color-tags-item')).toBe(true);
    expect(f.rows[0]!.querySelector('.nav-file-title-content')!.textContent).toBe('Agent.md');

    f.settings.showBanner = false;
    highlights.scheduleRefresh();
    await settle();
    expect(count('.iris-authored-banner')).toBe(0);
    expect(count('.iris-authored-dot')).toBe(1);

    f.settings.showBanner = true;
    f.settings.showExplorerDot = false;
    highlights.scheduleRefresh();
    await settle();
    expect(count('.iris-authored-dot')).toBe(0);
    expect(count('.iris-authored-banner')).toBe(1);
  });

  it('updates every pane when tags change, survives explorer rebuilds and renames, and cleans up', async () => {
    const f = fixture();
    highlights = f.highlights;
    const second = new MarkdownView(f.files[0]!);
    f.views.push(second);
    document.body.append(second.contentEl);
    await settle();
    expect(count('.iris-authored-banner')).toBe(2);

    f.rows[0]!.remove();
    const rebuilt = f.addRow('Agent.md');
    await settle();
    expect(rebuilt.querySelectorAll('.iris-authored-dot')).toHaveLength(1);

    f.files[0]!.path = 'Renamed.md';
    f.cache.delete('Agent.md');
    f.cache.set('Renamed.md', tagged);
    rebuilt.dataset.path = 'Renamed.md';
    f.vault.trigger('rename');
    await settle();
    expect(count('.iris-authored-dot')).toBe(1);
    expect(count('.iris-authored-banner')).toBe(2);

    f.cache.set('Renamed.md', {});
    f.metadataCache.trigger('changed');
    await settle();
    expect(count('.iris-authored-banner, .iris-authored-dot')).toBe(0);

    f.cache.set('Human.md', tagged);
    f.metadataCache.trigger('changed');
    await settle();
    expect(count('.iris-authored-banner')).toBe(1);
    expect(count('.iris-authored-dot')).toBe(1);

    highlights.scheduleRefresh();
    highlights.unload();
    await settle();
    f.workspace.trigger('layout-change');
    await settle();
    expect(count('.iris-authored-banner, .iris-authored-dot')).toBe(0);
    expect(f.rows[1]!.style.getPropertyValue('--nav-item-color')).toBe('#34c759');
    expect(f.rows[1]!.textContent).toBe('Human.md');
  });
});
