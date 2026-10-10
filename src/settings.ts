import { PluginSettingTab, Setting } from 'obsidian';
import type IrisPlugin from './main';

export interface IrisSettings {
  showBanner: boolean;
  showExplorerDot: boolean;
}

export const DEFAULT_SETTINGS: IrisSettings = {
  showBanner: true,
  showExplorerDot: true,
};

export class IrisSettingTab extends PluginSettingTab {
  constructor(private readonly iris: IrisPlugin) {
    super(iris.app, iris);
  }

  // Older hosts call display(); newer hosts render and index the same definitions.
  display(): void {
    this.containerEl.empty();
    for (const definition of this.getSettingDefinitions()) {
      const setting = new Setting(this.containerEl)
        .setName(definition.name ?? '')
        .setDesc(definition.desc ?? '');
      definition.render(setting);
    }
  }

  getSettingDefinitions() {
    const toggles: [keyof IrisSettings, string, string][] = [
      ['showBanner', 'Show banner', 'Show a compact label above tagged notes in reading and editing views.'],
      ['showExplorerDot', 'Show explorer dot', 'Add a dot beside tagged filenames without changing their colors.'],
    ];

    return toggles.map(([key, name, desc]) => ({
      name,
      desc,
      render: (setting: Setting) => {
        setting.addToggle((toggle) => toggle
          .setValue(this.iris.settings[key])
          .onChange(async (value) => {
            this.iris.settings[key] = value;
            this.iris.refreshHighlights();
            await this.iris.saveData(this.iris.settings);
          }));
      },
    }));
  }
}
