import { UPDATE_CHECK_URL } from '@env';

export const PATHS = {
  onboarding: {
    welcome: 'Welcome',
    model_selection: 'ModelSelection',
    survey: 'Survey',
    data_handling: 'DataHandling',
  },
  home: 'Home',
  workspace_chat: 'WorkspaceChat',
  workspace_settings: 'WorkspaceSettings',
  user_settings: 'UserSettings',
  developer: {
    home: 'DevToolsMenu',
  },

  connect_to_instance: 'ConnectToInstance',

  /**
   * Where the app checks whether a newer build exists. Upstream pointed this at
   * Mintplex Labs' CDN, so opening settings told them an install existed. Point
   * it at your own release feed to switch the check back on; empty disables it.
   */
  remote_version_url: UPDATE_CHECK_URL ?? '',
  google_play_store: 'https://play.google.com/store/apps/details?id=com.huntkhashai',
};