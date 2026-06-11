'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import type React from 'react';

type AuthMode = 'login' | 'register';

interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  points: number;
}

interface AuthResponse {
  success?: boolean;
  user?: AuthUser;
  error?: string;
  code?: string;
}

interface AuthFormProps {
  mode: AuthMode;
  nextPath?: string;
}

interface Notice {
  type: 'success' | 'danger';
  text: string;
  node?: React.ReactNode;
}

const avatarOptions = [
  { value: '\u26bd', label: 'Bola' },
  { value: '\ud83c\udfc6', label: 'Taça' },
  { value: '\ud83e\udd47', label: 'Medalha' },
  { value: '\ud83c\udde7\ud83c\uddf7', label: 'Brasil' },
  { value: '\ud83c\udfdf\ufe0f', label: 'Estádio' },
  { value: '\ud83d\udd25', label: 'Fase boa' },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir agora.';
}

async function readAuthResponse(response: Response, fallback: string) {
  const data = (await response.json().catch(() => ({}))) as AuthResponse;
  if (!response.ok) {
    const err = new Error(data.error || fallback) as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

function sanitizeNextPath(path?: string) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  if (path.startsWith('/login') || path.startsWith('/register')) return '/dashboard';
  return path;
}

export default function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const safeNextPath = sanitizeNextPath(nextPath);

  const [recoverMode, setRecoverMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(avatarOptions[0].value);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const title = useMemo(() => {
    if (recoverMode) return 'Recuperar acesso';
    return isRegister ? 'Criar conta' : 'Entrar no bolão';
  }, [isRegister, recoverMode]);

  const subtitle = useMemo(() => {
    if (recoverMode) return 'Informe seu e-mail e a nova senha desejada. O administrador aprova a troca.';
    if (isRegister) return 'Entre no ranking global, salve seus palpites e dispute bolões com amigos.';
    return 'Acesse seus palpites, ranking e bolões privados em poucos segundos.';
  }, [isRegister, recoverMode]);

  const persistUser = (user: AuthUser) => {
    localStorage.setItem('authenticatedUser', JSON.stringify(user));
    router.replace(safeNextPath);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!email || !password || (isRegister && !name)) {
      setNotice({ type: 'danger', text: isRegister ? 'Preencha nome, e-mail e senha.' : 'Preencha e-mail e senha.' });
      return;
    }

    if ((isRegister || recoverMode) && password.length < 6) {
      setNotice({ type: 'danger', text: 'Use uma senha com pelo menos 6 caracteres.' });
      return;
    }

    setPending(true);

    try {
      if (recoverMode) {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password }),
        });

        await readAuthResponse(response, 'Erro ao solicitar troca de senha.');
        setNotice({ type: 'success', text: 'Pedido enviado. Aguarde aprovação do administrador.' });
        setRecoverMode(false);
        setPassword('');
        return;
      }

      const response = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? { name, email, password, image: avatar } : { email, password }),
      });

      const data = await readAuthResponse(response, isRegister ? 'Erro no cadastro.' : 'Erro ao realizar login.');
      if (!data.user) {
        throw new Error('A autenticação foi concluída, mas o usuário não foi retornado.');
      }

      persistUser(data.user);
    } catch (error) {
      const err = error as Error & { code?: string };

      if (err.code === 'user_not_found') {
        // Usuário tentou logar sem ter conta — redireciona para o cadastro
        setNotice({
          type: 'danger',
          text: err.message,
          node: (
            <>
              {err.message}{' '}
              <Link href={`/register?next=${encodeURIComponent(safeNextPath)}`} className="alert-link">
                Cadastre-se aqui
              </Link>
              .
            </>
          ),
        });
        return;
      }

      if (err.code === 'email_already_registered') {
        // Usuário tentou cadastrar com e-mail já existente
        setNotice({
          type: 'danger',
          text: err.message,
          node: (
            <>
              {err.message}{' '}
              <Link href={`/login?next=${encodeURIComponent(safeNextPath)}`} className="alert-link">
                Faça login aqui
              </Link>
              .
            </>
          ),
        });
        return;
      }

      setNotice({ type: 'danger', text: getErrorMessage(error) });
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="auth-form-panel" onSubmit={handleSubmit}>
      <div className="auth-form-icon" aria-hidden="true">
        <i className={`bi ${isRegister ? 'bi-person-plus-fill' : recoverMode ? 'bi-key-fill' : 'bi-box-arrow-in-right'}`}></i>
      </div>

      <div className="mb-4">
        <p className="auth-eyebrow mb-2">{recoverMode ? 'Senha' : isRegister ? 'Novo jogador' : 'Área do jogador'}</p>
        <h1 className="auth-title mb-2">{title}</h1>
        <p className="auth-subtitle mb-0">{subtitle}</p>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2 mb-3`} role="status" aria-live="polite">
          {notice.node ?? notice.text}
        </div>
      )}

      {isRegister && !recoverMode && (
        <div className="mb-3">
          <label className="form-label auth-label" htmlFor="auth-name">Nome</label>
          <input
            id="auth-name"
            type="text"
            className="form-control auth-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome no ranking"
            autoComplete="name"
            required
          />
        </div>
      )}

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="auth-email">E-mail</label>
        <input
          id="auth-email"
          type="email"
          className="form-control auth-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seuemail@exemplo.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="auth-password">
          {recoverMode ? 'Nova senha' : 'Senha'}
        </label>
        <input
          id="auth-password"
          type="password"
          className="form-control auth-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={recoverMode ? 'Digite a nova senha' : 'Digite sua senha'}
          autoComplete={isRegister || recoverMode ? 'new-password' : 'current-password'}
          required
        />
        <div className="form-text text-secondary">Mínimo de 6 caracteres.</div>
      </div>

      {isRegister && !recoverMode && (
        <div className="mb-4">
          <label className="form-label auth-label">Avatar</label>
          <div className="auth-avatar-grid" role="radiogroup" aria-label="Escolha seu avatar">
            {avatarOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`auth-avatar-option ${avatar === option.value ? 'active' : ''}`}
                onClick={() => setAvatar(option.value)}
                aria-pressed={avatar === option.value}
                title={option.label}
              >
                {option.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isRegister && !recoverMode && (
        <div className="mb-4 text-end">
          <button
            type="button"
            className="btn btn-link p-0 auth-inline-link"
            onClick={() => {
              setRecoverMode(true);
              setNotice(null);
              setPassword('');
            }}
          >
            Esqueceu a senha?
          </button>
        </div>
      )}

      <button type="submit" className="btn btn-neon-green w-100 py-2 fw-bold" disabled={pending}>
        {pending ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            Aguarde
          </>
        ) : (
          <>
            <i className={`bi ${recoverMode ? 'bi-send-fill' : isRegister ? 'bi-person-check-fill' : 'bi-box-arrow-in-right'} me-2`}></i>
            {recoverMode ? 'Solicitar troca' : isRegister ? 'Criar e entrar' : 'Entrar'}
          </>
        )}
      </button>

      <div className="auth-switcher">
        {recoverMode ? (
          <button
            type="button"
            className="btn btn-link p-0 auth-inline-link"
            onClick={() => {
              setRecoverMode(false);
              setNotice(null);
              setPassword('');
            }}
          >
            Voltar para login
          </button>
        ) : isRegister ? (
          <>
            Já tem conta? <Link href={`/login?next=${encodeURIComponent(safeNextPath)}`}>Entrar agora</Link>
          </>
        ) : (
          <>
            Novo por aqui? <Link href={`/register?next=${encodeURIComponent(safeNextPath)}`}>Criar conta</Link>
          </>
        )}
      </div>
    </form>
  );
}
