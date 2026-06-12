export function formatDatePtBr(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...options,
  }).format(new Date(value));
}

export function formatTimePtBr(value: string | Date) {
  return formatDatePtBr(value, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDatePtBr(value: string | Date) {
  return formatDatePtBr(value, {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatLongDatePtBr(value: string | Date) {
  return formatDatePtBr(value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function formatDateTimePtBr(value: string | Date) {
  return `${formatShortDatePtBr(value)} as ${formatTimePtBr(value)}`;
}

export function formatOrdinalPtBr(value: number | null | undefined) {
  if (!value || value < 1) return '-';
  return `${value}º`;
}

export function formatStagePtBr(stage: string | null | undefined) {
  const labels: Record<string, string> = {
    group: 'Fase de grupos',
    r32: '32 avos',
    r16: 'Oitavas',
    qf: 'Quartas',
    sf: 'Semifinal',
    third: '3o lugar',
    final: 'Final',
  };
  return labels[stage || ''] || 'Fase indefinida';
}

export function formatLeagueStatusPtBr(status: string | null | undefined) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    closed: 'Fechado',
    archived: 'Arquivado',
  };
  return labels[status || ''] || 'Indefinido';
}

export function formatJoinPolicyPtBr(policy: string | null | undefined) {
  const labels: Record<string, string> = {
    open: 'Entrada aberta',
    approval: 'Entrada por aprovação',
    invite: 'Entrada por convite',
  };
  return labels[policy || ''] || 'Entrada restrita';
}

export function formatRelativeWindowPtBr(target: string | number | Date, nowValue = Date.now()) {
  const diff = new Date(target).getTime() - nowValue;
  if (diff <= 0) return 'agora';

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${Math.max(minutes, 1)}min`;
}
