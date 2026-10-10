import { Plugin } from 'obsidian';
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
  }

  refreshHighlights(): void {
    this.highlights?.scheduleRefresh();
  }
}
