// The npm Obsidian package contains types only. This host double models the
// public lifecycle and already-parsed tag metadata, not Markdown parsing.
export class Component {
  private cleanup: (() => void)[] = [];
  load() { this.onload(); }
  unload() {
    this.onunload();
    for (const dispose of this.cleanup) dispose();
  }
  onload() {}
  onunload() {}
  registerEvent(dispose: () => void) { this.cleanup.push(dispose); }
}

export class Events {
  private listeners = new Map<string, Set<() => void>>();
  on(event: string, callback: () => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)!.delete(callback);
  }
  trigger(event: string) {
    for (const callback of this.listeners.get(event) ?? []) callback();
  }
}

export class TFile {
  extension = 'md';
  constructor(public path: string) {}
}

export class MarkdownView {
  contentEl = document.createElement('div');
  constructor(public file: TFile | null) {}
}

export function parseFrontMatterTags(frontmatter?: { tags?: string | string[] | null } | null) {
  const value = frontmatter?.tags;
  const tags = typeof value === 'string' ? [value] : value ?? [];
  return tags.filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`);
}

export function getAllTags(cache: { tags?: { tag: string }[]; frontmatter?: { tags?: string | string[] | null } }) {
  return [
    ...(cache.tags ?? []).map(item => item.tag),
    ...parseFrontMatterTags(cache.frontmatter),
  ];
}

export function setTooltip(element: HTMLElement, text: string) {
  element.setAttribute('aria-label', text);
}

export function displayTooltip(element: HTMLElement, text: string, options: { classes?: string[] } = {}) {
  const tooltip = element.ownerDocument.createElement('div');
  tooltip.setAttribute('role', 'tooltip');
  tooltip.classList.add(...options.classes ?? []);
  tooltip.textContent = text;
  element.ownerDocument.body.append(tooltip);
}

export function setIcon(element: HTMLElement, _icon: string) {
  element.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
}

// Settings are not instantiated in the highlight tests.
export class PluginSettingTab {}
export class Setting {}
export class App {}
