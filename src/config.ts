// Configure actual public release URLs before publishing download buttons.
// Never point these at local release/ paths: Windows executables belong in GitHub Releases.
export const release = {
  version: '2.1.0',
  setupUrl: '',
  portableUrl: '',
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
