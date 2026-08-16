/**
 * Familiar recurring services presented as optional recognition prompts.
 *
 * The list is intentionally broad enough to jog memory without preselecting or
 * inferring any charge. Users still provide the amount and next billing date.
 */
export const subscriptionCategories = [
  { id: 'spotify', label: 'Spotify', defaultName: 'Spotify' },
  { id: 'youtube-premium', label: 'YouTube Premium', defaultName: 'YouTube Premium' },
  { id: 'netflix', label: 'Netflix', defaultName: 'Netflix' },
  { id: 'disney', label: 'Disney+ Hotstar', defaultName: 'Disney+ Hotstar' },
  { id: 'apple-icloud', label: 'Apple iCloud', defaultName: 'Apple iCloud' },
  { id: 'google-one', label: 'Google One', defaultName: 'Google One' },
  { id: 'onedrive', label: 'Microsoft OneDrive', defaultName: 'Microsoft OneDrive' },
  { id: 'dropbox', label: 'Dropbox', defaultName: 'Dropbox' },
  { id: 'chatgpt', label: 'ChatGPT', defaultName: 'ChatGPT' },
  { id: 'canva', label: 'Canva', defaultName: 'Canva' },
  { id: 'notion', label: 'Notion', defaultName: 'Notion' },
  { id: 'figma', label: 'Figma', defaultName: 'Figma' },
  { id: 'goodnotes', label: 'Goodnotes', defaultName: 'Goodnotes' },
  { id: 'notability', label: 'Notability', defaultName: 'Notability' },
  { id: 'duolingo', label: 'Duolingo', defaultName: 'Duolingo' },
  { id: 'hostinger', label: 'Hostinger', defaultName: 'Hostinger' },
  { id: 'github', label: 'GitHub', defaultName: 'GitHub' },
  { id: 'other', label: 'Other subscription', defaultName: 'Other subscription' },
] as const
