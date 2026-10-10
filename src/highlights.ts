import { App, Component, MarkdownView, TFile, displayTooltip, setIcon, setTooltip } from 'obsidian';
import { AGENT_AUTHORED_TAG, isAgentAuthored } from './authorship';
import type { IrisSettings } from './settings';

const DOT = 'iris-authored-dot';
const BANNER = 'iris-authored-banner';
const EXPLANATION = `This file is marked as agent-authored because it contains the ${AGENT_AUTHORED_TAG} tag.`;

/** Owns only Iris decorations; never replaces host content or styles. */
export class AuthorshipHighlights extends Component {
  private readonly observers = new Map<HTMLElement, MutationObserver>();
  private timer: number | null = null;
  private disposed = false;

  constructor(private readonly app: App, private readonly settings: IrisSettings) {
    super();
  }

  onload(): void {
    const refresh = () => this.scheduleRefresh();
    this.registerEvent(this.app.metadataCache.on('changed', refresh));
    this.registerEvent(this.app.metadataCache.on('resolved', refresh));
    this.registerEvent(this.app.vault.on('rename', refresh));
    this.registerEvent(this.app.vault.on('delete', refresh));
    this.registerEvent(this.app.workspace.on('file-open', refresh));
    this.registerEvent(this.app.workspace.on('layout-change', refresh));
    this.app.workspace.onLayoutReady(refresh);
  }

  scheduleRefresh(): void {
    if (this.disposed || this.timer !== null) return;
    // Coalesce cache updates and DOM mutations, without scanning on each keystroke.
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.refresh();
    }, 50);
  }

  private refresh(): void {
    const roots = new Set<HTMLElement>();
    for (const leaf of this.app.workspace.getLeavesOfType('file-explorer')) {
      const root = leaf.view.containerEl;
      roots.add(root);
      this.observe(root, true);
      this.updateExplorer(root);
    }
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      // Hidden tabs may be deferred: don't force them to load.
      if (!(leaf.view instanceof MarkdownView)) continue;
      const view = leaf.view;
      roots.add(view.contentEl);
      this.observe(view.contentEl, false);
      this.updateNote(view);
    }
    for (const [root, observer] of this.observers) {
      if (!roots.has(root)) {
        observer.disconnect();
        this.clear(root);
        this.observers.delete(root);
      }
    }
  }

  private observe(root: HTMLElement, explorer: boolean): void {
    if (this.observers.has(root)) return;
    const observer = new MutationObserver(() => this.scheduleRefresh());
    observer.observe(root, {
      childList: true,
      subtree: explorer,
      attributes: explorer,
      attributeFilter: explorer ? ['data-path'] : undefined,
    });
    this.observers.set(root, observer);
  }

  private authored(file: TFile | null): boolean {
    return file !== null && file.extension === 'md'
      && isAgentAuthored(this.app.metadataCache.getFileCache(file));
  }

  private updateExplorer(root: HTMLElement): void {
    // Explorer has no public decoration API; keep this DOM integration isolated.
    for (const row of root.querySelectorAll<HTMLElement>('.nav-file-title[data-path]')) {
      const path = row.getAttribute('data-path');
      const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
      const visible = this.settings.showExplorerDot && file instanceof TFile && this.authored(file);
      const existing = row.querySelector(`:scope > .${DOT}`);
      if (!visible) {
        existing?.remove();
      } else if (!existing) {
        const label = row.querySelector(':scope > .nav-file-title-content');
        if (!label) continue;
        const dot = row.createSpan({ cls: DOT });
        dot.setAttribute('role', 'img');
        // The host treats zero as its default delay; 1ms is effectively immediate.
        setTooltip(dot, EXPLANATION, { placement: 'right', delay: 1 });
      }
    }
  }

  private updateNote(view: MarkdownView): void {
    const root = view.contentEl;
    const authored = this.authored(view.file);
    const banner = root.querySelector(`:scope > .${BANNER}`);
    if (!authored || !this.settings.showBanner) {
      if (banner) this.hideInfoTooltip(root);
      banner?.remove();
    } else if (!banner) {
      const element = root.createDiv({ cls: BANNER });
      element.setAttribute('role', 'note');
      element.createSpan({ text: 'This file is agent-authored.' });
      const info = element.createEl('button', {
        cls: 'clickable-icon iris-authored-info',
        attr: { type: 'button' },
      });
      setIcon(info, 'info');
      setTooltip(info, EXPLANATION, { placement: 'bottom' });
      info.addEventListener('click', () => {
        displayTooltip(info, EXPLANATION, {
          placement: 'bottom', classes: ['iris-authored-info-tooltip'],
        });
      });
      info.addEventListener('blur', () => this.hideInfoTooltip(info));
      info.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.hideInfoTooltip(info);
      });
      root.prepend(element);
    }
  }

  private hideInfoTooltip(root: HTMLElement): void {
    for (const tooltip of root.ownerDocument.querySelectorAll('.iris-authored-info-tooltip')) {
      tooltip.remove();
    }
  }

  private clear(root: HTMLElement): void {
    this.hideInfoTooltip(root);
    for (const element of root.querySelectorAll(`.${DOT}, .${BANNER}`)) {
      element.remove();
    }
  }

  onunload(): void {
    this.disposed = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    for (const [root, observer] of this.observers) {
      observer.disconnect();
      this.clear(root);
    }
    this.observers.clear();
  }
}
