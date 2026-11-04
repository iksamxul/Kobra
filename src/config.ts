// Configure actual public release URLs before publishing download buttons.
// Never point these at local release/ paths: Windows executables belong in GitHub Releases.
export const release = {
  version: '1.0.0',
  setupUrl: 'https://github.com/iksamxul/Kobra/releases/download/v1.0.0/Kobra-Setup-1.0.0.exe',
  portableUrl: 'https://github.com/iksamxul/Kobra/releases/download/v1.0.0/Kobra-Portable-1.0.0.exe',
  notesUrl: 'https://github.com/iksamxul/Kobra/releases/tag/v1.0.0',
  repositoryUrl: 'https://github.com/iksamxul/Kobra',
};

export const modes = {
  kobra: {
    label: 'A little more everyday.',
    title: 'A home for your next watch.',
    description: 'Pick up where you left off, find a favorite, or make yourself comfortable with everyday tools.',
    features: 'Home · Watch · My videos · Tools',
  },
  studio: {
    label: 'A little more possibility.',
    title: 'Give your ideas somewhere to go.',
    description: 'Collect a reference, write a scene, plan a project. Connected workspaces, one familiar player.',
    features: 'Media Studio · Editor · Projects · Research · Writing · Study · Delivery · Playback Lab',
  },
};
