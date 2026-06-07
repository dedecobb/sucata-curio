import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Recycle } from "lucide-react";
import { sendPasswordReset, signInWithEmail } from "../lib/authService";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { isAuthenticated, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && profile) {
      navigate(profile.role === "ADMIN" ? from : "/nova-compra", {
        replace: true,
      });
    }
  }, [isAuthenticated, profile, from, navigate]);

  if (!loading && isAuthenticated && profile) {
    return (
      <Navigate to={profile.role === "ADMIN" ? from : "/nova-compra"} replace />
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setError(err.message || "Nao foi possivel entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Informe seu e-mail para recuperar a senha.");
      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordReset(email.trim());
      setMessage("Enviamos um link de recuperacao para o seu e-mail.");
      setRecovering(false);
    } catch (err) {
      setError(err.message || "Nao foi possivel enviar o e-mail.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sucata Curio</h1>
              <p className="text-sm text-gray-500">Acesso ao sistema</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                className="input pl-10"
                placeholder="voce@empresa.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          {!recovering && (
            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input pl-10 pr-10"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {!recovering ? (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3"
              onClick={handlePasswordReset}
            >
              {submitting ? "Enviando..." : "Enviar link de recuperacao"}
            </button>
          )}

          <button
            type="button"
            className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700"
            onClick={() => {
              setRecovering((value) => !value);
              setError("");
              setMessage("");
            }}
          >
            {recovering ? "Voltar para login" : "Esqueci minha senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
