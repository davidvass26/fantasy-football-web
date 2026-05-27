// lib/team-logos.ts
// ESPN CDN URLs for NFL team logos. Used non-commercially.

const ESPN_TEAM_MAP: Record<string, string> = {
  AZ: 'ari', ATL: 'atl', BAL: 'bal', BUF: 'buf', CAR: 'car', CHI: 'chi',
  CIN: 'cin', CLE: 'cle', DAL: 'dal', DEN: 'den', DET: 'det', GB: 'gb',
  HOU: 'hou', IND: 'ind', JAX: 'jax', KC: 'kc', LA: 'lar', LAC: 'lac',
  LV: 'lv',  MIA: 'mia', MIN: 'min', NE: 'ne',  NO: 'no',  NYG: 'nyg',
  NYJ: 'nyj', PHI: 'phi', PIT: 'pit', SEA: 'sea', SF: 'sf',  TB: 'tb',
  TEN: 'ten', WAS: 'wsh',
  LAR: 'lar', OAK: 'lv', SD: 'lac', STL: 'lar',
};

export function getTeamLogoUrl(team: string | null | undefined, size: number = 500): string | null {
  if (!team) return null;
  const code = ESPN_TEAM_MAP[team.toUpperCase()];
  if (!code) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/${size}/${code}.png`;
}