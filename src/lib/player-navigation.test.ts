import { describe, expect, it } from 'vitest';
import { playerNavigationItems, playerNavHref } from './player-navigation';

describe('player navigation', () => {
  it('includes all primary authenticated destinations', () => {
    expect(playerNavigationItems.map((item) => item.route)).toEqual([
      'dashboard',
      'matches',
      'results',
      'calendar',
      'leaderboard',
      'leagues',
      'history',
    ]);
  });

  it('keeps Ranking visible in primary mobile navigation', () => {
    const ranking = playerNavigationItems.find((item) => item.route === 'leaderboard');

    expect(ranking).toMatchObject({
      href: '/leaderboard',
      mobilePrimary: true,
    });
  });

  it('preserves league context only for contextual routes', () => {
    const matches = playerNavigationItems.find((item) => item.route === 'matches');
    const leagues = playerNavigationItems.find((item) => item.route === 'leagues');

    expect(matches ? playerNavHref(matches, 'amigos') : '').toBe('/matches?league=amigos');
    expect(leagues ? playerNavHref(leagues, 'amigos') : '').toBe('/leagues');
  });
});
