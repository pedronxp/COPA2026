export type PlayerRoute =
  | 'dashboard'
  | 'matches'
  | 'results'
  | 'calendar'
  | 'leaderboard'
  | 'leagues'
  | 'history'
  | 'profile';

export interface PlayerNavigationItem {
  route: PlayerRoute;
  href: string;
  icon: string;
  label: string;
  mobileLabel: string;
  preserveLeague: boolean;
  mobilePrimary: boolean;
}

export const playerNavigationItems: PlayerNavigationItem[] = [
  {
    route: 'dashboard',
    href: '/dashboard',
    icon: 'bi-grid-1x2-fill',
    label: 'Dashboard',
    mobileLabel: 'Home',
    preserveLeague: true,
    mobilePrimary: true,
  },
  {
    route: 'matches',
    href: '/matches',
    icon: 'bi-lightning-charge-fill',
    label: 'Palpites',
    mobileLabel: 'Palpites',
    preserveLeague: true,
    mobilePrimary: true,
  },
  {
    route: 'results',
    href: '/results',
    icon: 'bi-clipboard-data-fill',
    label: 'Resultados',
    mobileLabel: 'Resultados',
    preserveLeague: true,
    mobilePrimary: false,
  },
  {
    route: 'calendar',
    href: '/calendar',
    icon: 'bi-calendar-event-fill',
    label: 'Tabela',
    mobileLabel: 'Tabela',
    preserveLeague: true,
    mobilePrimary: true,
  },
  {
    route: 'leaderboard',
    href: '/leaderboard',
    icon: 'bi-trophy-fill',
    label: 'Ranking',
    mobileLabel: 'Ranking',
    preserveLeague: true,
    mobilePrimary: true,
  },
  {
    route: 'leagues',
    href: '/leagues',
    icon: 'bi-people-fill',
    label: 'Bolões',
    mobileLabel: 'Bolões',
    preserveLeague: false,
    mobilePrimary: false,
  },
  {
    route: 'history',
    href: '/history',
    icon: 'bi-clock-history',
    label: 'Histórico',
    mobileLabel: 'Histórico',
    preserveLeague: true,
    mobilePrimary: false,
  },
  {
    route: 'profile',
    href: '/profile',
    icon: 'bi-person-circle',
    label: 'Perfil',
    mobileLabel: 'Perfil',
    preserveLeague: false,
    mobilePrimary: false,
  },
];

export function playerNavHref(item: PlayerNavigationItem, leagueSlug: string) {
  if (!item.preserveLeague || leagueSlug === 'global') return item.href;
  return `${item.href}?league=${encodeURIComponent(leagueSlug)}`;
}
