import { Notice, Plugin } from 'obsidian';
import { AGENT_AUTHORED_TAG, CONTAINS_AGENT_AUTHORED_TAG, setAgentAuthored } from './authorship';
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
    for (const [id, name, authored, tag] of [
      ['mark-agent-authored', 'Add agent-authored tag to file properties', true, AGENT_AUTHORED_TAG],
      ['unmark-agent-authored', 'Remove agent-authored tag from file properties', false, AGENT_AUTHORED_TAG],
      ['mark-contains-agent-authored', 'Add contains-agent-authored tag to file properties', true, CONTAINS_AGENT_AUTHORED_TAG],
      ['unmark-contains-agent-authored', 'Remove contains-agent-authored tag from file properties', false, CONTAINS_AGENT_AUTHORED_TAG],
    ] as const) {
      this.addCommand({
        id,
        name,
        checkCallback: (checking) => {
          const file = this.app.workspace.getActiveFile();
          if (!file || file.extension !== 'md') return false;
          if (!checking) {
            void setAgentAuthored(this.app, file, authored, tag).catch((error: unknown) => {
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
