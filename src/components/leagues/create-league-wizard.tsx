'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { SCORING_PRESETS } from '@/lib/league-domain';

const steps = ['Identidade', 'Acesso', 'Pontuação', 'Publicação', 'Revisão'];

type PresetKey = keyof typeof SCORING_PRESETS;

interface WizardData {
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
  joinPolicy: 'open' | 'approval' | 'invite';
  maxMembers: number;
  expiresAt: string;
  scoringPreset: PresetKey;
  windowHours: number;
  maxEdits: number;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
  scoringStartMatchday: number;
  groupPublicationMode: string;
  knockoutPublicationMode: string;
}

const initialData: WizardData = {
  name: '',
  slug: '',
  description: '',
  visibility: 'private',
  joinPolicy: 'invite',
  maxMembers: 20,
  expiresAt: '2026-08-01',
  scoringPreset: 'standard',
  windowHours: 48,
  maxEdits: 3,
  pointsExact: 5,
  pointsDiff: 3,
  pointsWinner: 2,
  pointsWinnerHome: 2,
  pointsWinnerAway: 2,
  pointsDraw: 2,
  scoringStartMatchday: 1,
  groupPublicationMode: 'match',
  knockoutPublicationMode: 'match',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function responseMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
  }
  return fallback;
}

export function CreateLeagueWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return data.name.trim().length >= 3 && data.name.trim().length <= 80;
    if (step === 1) return data.maxMembers >= 2 && data.maxMembers <= 50;
    return true;
  }, [data.maxMembers, data.name, step]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function updateName(name: string) {
    setData((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugify(name),
    }));
  }

  function applyPreset(preset: PresetKey) {
    const rules = SCORING_PRESETS[preset].rules;
    setData((current) => ({ ...current, scoringPreset: preset, ...rules }));
  }

  async function submit() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(payload, 'Não foi possível criar o bolão.'));

      const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
      const league = record.league && typeof record.league === 'object'
        ? record.league as Record<string, unknown>
        : record;
      const destination = typeof league.slug === 'string'
        ? league.slug
        : typeof league.id === 'string' ? league.id : null;

      router.push(destination ? `/leagues/${destination}` : '/leagues');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível criar o bolão.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="league-flow">
      <div className="league-flow-header">
        <Link href="/leagues" className="btn league-icon-button" title="Voltar para bolões">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
        </Link>
        <div>
          <span className="league-eyebrow">Novo bolão</span>
          <h1>Monte as regras da disputa.</h1>
        </div>
      </div>

      <ol className="league-steps" aria-label="Etapas de criação">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? 'active' : index < step ? 'complete' : ''}>
            <span>{index < step ? <i className="bi bi-check-lg" aria-hidden="true"></i> : index + 1}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>

      <section className="league-form-panel">
        {step === 0 && (
          <div className="league-form-section">
            <div className="league-section-heading">
              <span>01</span>
              <div><h2>Identidade do bolão</h2><p>O nome e o endereço que seus participantes vão reconhecer.</p></div>
            </div>
            <div className="league-field-grid">
              <label className="league-field full">
                <span>Nome</span>
                <input value={data.name} onChange={(event) => updateName(event.target.value)} maxLength={80} placeholder="Ex: Copa da Firma" autoFocus />
                <small>{data.name.length}/80</small>
              </label>
              <label className="league-field full">
                <span>Endereço</span>
                <div className="league-slug-input">
                  <span>copa-ant.com/leagues/</span>
                  <input
                    value={data.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      update('slug', slugify(event.target.value));
                    }}
                    placeholder="copa-da-firma"
                  />
                </div>
              </label>
              <label className="league-field full">
                <span>Descrição <em>opcional</em></span>
                <textarea value={data.description} onChange={(event) => update('description', event.target.value)} maxLength={400} rows={4} placeholder="Uma frase curta sobre a disputa." />
                <small>{data.description.length}/400</small>
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="league-form-section">
            <div className="league-section-heading">
              <span>02</span>
              <div><h2>Acesso e capacidade</h2><p>Defina quem encontra o bolão e como novos membros entram.</p></div>
            </div>
            <div className="league-choice-grid two">
              <button type="button" className={data.visibility === 'public' ? 'selected' : ''} onClick={() => update('visibility', 'public')}>
                <i className="bi bi-globe-americas" aria-hidden="true"></i>
                <strong>Público</strong>
                <span>Aparece na descoberta.</span>
              </button>
              <button type="button" className={data.visibility === 'private' ? 'selected' : ''} onClick={() => update('visibility', 'private')}>
                <i className="bi bi-lock-fill" aria-hidden="true"></i>
                <strong>Privado</strong>
                <span>Acesso apenas para convidados.</span>
              </button>
            </div>
            <div className="league-choice-grid three">
              {[
                ['open', 'door-open', 'Entrada aberta', 'Participação imediata.'],
                ['approval', 'person-check', 'Com aprovação', 'Você revisa pedidos.'],
                ['invite', 'ticket-perforated', 'Por convite', 'Exige um código válido.'],
              ].map(([value, icon, title, description]) => (
                <button key={value} type="button" className={data.joinPolicy === value ? 'selected' : ''} onClick={() => update('joinPolicy', value as WizardData['joinPolicy'])}>
                  <i className={`bi bi-${icon}`} aria-hidden="true"></i>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </button>
              ))}
            </div>
            <div className="league-field-grid">
              <label className="league-field">
                <span>Limite de participantes</span>
                <input type="number" min={2} max={50} value={data.maxMembers} onChange={(event) => update('maxMembers', Number(event.target.value))} />
              </label>
              <label className="league-field">
                <span>Encerramento</span>
                <input type="date" value={data.expiresAt} onChange={(event) => update('expiresAt', event.target.value)} />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="league-form-section">
            <div className="league-section-heading">
              <span>03</span>
              <div><h2>Pontuação</h2><p>Escolha uma base pronta ou ajuste cada valor.</p></div>
            </div>
            <div className="league-preset-list">
              {(Object.keys(SCORING_PRESETS) as PresetKey[]).map((preset) => (
                <button key={preset} type="button" className={data.scoringPreset === preset ? 'selected' : ''} onClick={() => applyPreset(preset)}>
                  <span className="league-radio" aria-hidden="true"></span>
                  <span><strong>{SCORING_PRESETS[preset].label}</strong><small>{SCORING_PRESETS[preset].description}</small></span>
                </button>
              ))}
            </div>
            <div className="league-score-grid">
              {[
                ['pointsExact', 'Placar exato'],
                ['pointsDiff', 'Saldo correto'],
                ['pointsWinnerHome', 'Vitória Casa'],
                ['pointsWinnerAway', 'Vitória Fora'],
                ['pointsDraw', 'Empate correto'],
              ].map(([key, label]) => (
                <label className="league-score-field" key={key}>
                  <span>{label}</span>
                  <div><button type="button" onClick={() => update(key as keyof WizardData, Math.max(0, Number(data[key as keyof WizardData]) - 1) as never)}>-</button><strong>{String(data[key as keyof WizardData])}</strong><button type="button" onClick={() => update(key as keyof WizardData, Math.min(100, Number(data[key as keyof WizardData]) + 1) as never)}>+</button></div>
                </label>
              ))}
            </div>
            <div className="league-field-grid">
              <label className="league-field">
                <span>Janela de palpites (horas)</span>
                <input type="number" min={1} max={168} value={data.windowHours} onChange={(event) => update('windowHours', Number(event.target.value))} />
              </label>
              <label className="league-field">
                <span>Edições por palpite</span>
                <input type="number" min={0} max={999} value={data.maxEdits} onChange={(event) => update('maxEdits', Number(event.target.value))} />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="league-form-section">
            <div className="league-section-heading">
              <span>04</span>
              <div><h2>Publicação do ranking</h2><p>Controle quando os pontos calculados aparecem para todos.</p></div>
            </div>
            <div className="league-field-grid">
              <label className="league-field">
                <span>Começar a pontuar na rodada</span>
                <input type="number" min={1} max={99} value={data.scoringStartMatchday} onChange={(event) => update('scoringStartMatchday', Number(event.target.value))} />
              </label>
              <label className="league-field">
                <span>Fase de grupos</span>
                <select value={data.groupPublicationMode} onChange={(event) => update('groupPublicationMode', event.target.value)}>
                  <option value="match">A cada partida</option>
                  <option value="round">Ao fim da rodada</option>
                  <option value="every_2_rounds">A cada 2 rodadas</option>
                  <option value="every_3_rounds">A cada 3 rodadas</option>
                  <option value="phase">Ao fim da fase</option>
                  <option value="manual">Publicação manual</option>
                </select>
              </label>
              <label className="league-field">
                <span>Mata-mata</span>
                <select value={data.knockoutPublicationMode} onChange={(event) => update('knockoutPublicationMode', event.target.value)}>
                  <option value="match">A cada partida</option>
                  <option value="stage">Ao fim da fase</option>
                  <option value="manual">Publicação manual</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="league-form-section">
            <div className="league-section-heading">
              <span>05</span>
              <div><h2>Revisão</h2><p>Confira os principais detalhes antes de abrir a disputa.</p></div>
            </div>
            <div className="league-review">
              <div className="league-review-title">
                <span className="league-card-emblem">{data.name.slice(0, 2).toUpperCase() || 'CA'}</span>
                <div><h3>{data.name}</h3><p>{data.description || 'Sem descrição'}</p></div>
              </div>
              <dl>
                <div><dt>Acesso</dt><dd>{data.visibility === 'public' ? 'Público' : 'Privado'} / {data.joinPolicy === 'open' ? 'aberto' : data.joinPolicy === 'approval' ? 'aprovação' : 'convite'}</dd></div>
                <div><dt>Capacidade</dt><dd>{data.maxMembers} participantes</dd></div>
                <div><dt>Pontuação</dt><dd>{SCORING_PRESETS[data.scoringPreset].label}</dd></div>
                <div><dt>Placar exato</dt><dd>+{data.pointsExact} pontos</dd></div>
                <div><dt>Vitória Casa / Fora</dt><dd>+{data.pointsWinnerHome} / +{data.pointsWinnerAway} pts</dd></div>
                <div><dt>Empate</dt><dd>+{data.pointsDraw} pontos</dd></div>
                <div><dt>Grupos</dt><dd>{data.groupPublicationMode.replaceAll('_', ' ')}</dd></div>
                <div><dt>Mata-mata</dt><dd>{data.knockoutPublicationMode.replaceAll('_', ' ')}</dd></div>
              </dl>
            </div>
          </div>
        )}

        {error && <div className="league-alert error"><i className="bi bi-exclamation-circle" aria-hidden="true"></i>{error}</div>}

        <div className="league-form-actions">
          <button type="button" className="btn league-secondary-button" onClick={() => step === 0 ? router.push('/leagues') : setStep((current) => current - 1)}>
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="btn league-primary-button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue}>
              Continuar <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          ) : (
            <button type="button" className="btn league-primary-button" onClick={submit} disabled={pending}>
              {pending ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-check2-circle" aria-hidden="true"></i>}
              Criar bolão
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
