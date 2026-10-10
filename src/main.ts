import { Notice, Plugin } from 'obsidian';
import { setAgentAuthored } from './authorship';
import { AuthorshipHighlights } from './highlights';
import { DEFAULT_SETTINGS, IrisSettingTab, type IrisSettings } from './settings';

export default class IrisPlugin extends Plugin {
  settings: IrisSettings = { ...DEFAULT_SETTINGS };
  private highlights?: AuthorshipHighlights;

  async onload(): Promise<void> {
    const saved = await this.loadData() as Partial<IrisSettings> | null;
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof IrisSettings)[]) {
      if (typeof saved?.[key] === 'boolean') this.settings[key] = saved[key];
    }
    this.highlights = this.addChild(new AuthorshipHighlights(this.app, this.settings));
    this.addSettingTab(new IrisSettingTab(this));
    for (const [id, name, authored] of [
      ['mark-agent-authored', 'Add agent-authored tag to file properties', true],
      ['unmark-agent-authored', 'Remove agent-authored tag from file properties', false],
    ] as const) {
      this.addCommand({
        id,
        name,
        checkCallback: (checking) => {
          const file = this.app.workspace.getActiveFile();
          if (!file || file.extension !== 'md') return false;
          if (!checking) {
            void setAgentAuthored(this.app, file, authored).catch((error: unknown) => {
              console.error('Iris: failed to update the authorship tag', error);
              new Notice(`Could not update the authorship tag: ${error instanceof Error ? error.message : String(error)}`);
            });
          }
          return true;
        },
      });
    }
  }

  refreshHighlights(): void {
    this.highlights?.scheduleRefresh();
  }
}
