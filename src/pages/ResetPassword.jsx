import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Recycle } from "lucide-react";
import { updateUserPassword } from "../lib/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setSubmitting(true);

    try {
      await updateUserPassword(password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Nao foi possivel atualizar a senha.");
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
              <h1 className="text-xl font-bold text-gray-900">Nova senha</h1>
              <p className="text-sm text-gray-500">
                Defina uma senha segura para continuar.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type="password"
                className="input pl-10"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="confirmPassword">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                className="input pl-10"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center py-3"
          >
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
