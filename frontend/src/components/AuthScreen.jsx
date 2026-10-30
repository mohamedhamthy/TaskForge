import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "../store/auth";

export default function AuthScreen() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [mode, setMode] = useState("login");
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, createAccount, loading, error, clearError } = useAuthStore();
  const isRegistering = mode === "register";
  const passwordRequirements = [
    ["At least 8 characters", form.password.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(form.password)],
    ["One lowercase letter", /[a-z]/.test(form.password)],
    ["One number", /[0-9]/.test(form.password)],
    ["One special character", /[^A-Za-z0-9]/.test(form.password)],
  ];

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
    setSuccess("");
    clearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    setSuccess("");
    clearError();
    if (isRegistering) {
      const errors = {};
      if (!form.name.trim()) errors.name = "Full name is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errors.email = "Enter a valid email address";
      if (passwordRequirements.some(([, valid]) => !valid))
        errors.password = "Your password does not meet all requirements";
      if (form.password !== form.confirmPassword)
        errors.confirmPassword = "Passwords do not match";
      setFormErrors(errors);
      if (Object.keys(errors).length) return;

      try {
        const response = await createAccount({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        const role = response.data.user.role === "OWNER" ? "Owner" : "Member";
        setSuccess(
          `Your ${role} account was created. Sign in to continue.`,
        );
        setForm((current) => ({
          ...current,
          name: "",
          password: "",
          confirmPassword: "",
        }));
        setFormErrors({});
        setMode("login");
      } catch {
        // The authentication store exposes the request error.
      }
      return;
    }

    const errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Enter your password";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      await login({ email: form.email.trim(), password: form.password });
    } catch {
      /* form displays store error */
    }
  };

  const switchMode = () => {
    setMode(isRegistering ? "login" : "register");
    setFormErrors({});
    setSuccess("");
    clearError();
  };

  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr] bg-paper text-ink max-[720px]:block">
      <div className="relative [overflow:hidden] flex flex-col justify-between [padding:38px_8%] [color:#fff] [background:#252d40] [&::before]:[content:''] [&::before]:absolute [&::before]:[width:560px] [&::before]:[height:560px] [&::before]:[right:-190px] [&::before]:[bottom:-230px] [&::before]:[border:1px_solid_rgba(255,_255,_255,_0.15)] [&::before]:[border-radius:50%] [&::before]:[box-shadow:0_0_0_48px_rgba(255,_255,_255,_0.03),_0_0_0_96px_rgba(255,_255,_255,_0.025)] max-[720px]:[min-height:275px] max-[720px]:[padding:26px_24px]">
        <div className="relative z-[1] flex items-center gap-2.5 font-display text-[21px] font-bold tracking-tight text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral text-white">
            <Sparkles size={16} />
          </span>
          taskforge
        </div>
        <div className="relative z-[1] mt-[10vh] max-[720px]:mt-10">
          <p className="text-xs font-bold tracking-[0.15em] text-[#ffab9d]">
            WORK IN SYNC
          </p>
          <h1 className="mb-6 mt-4 font-display text-[clamp(40px,5vw,72px)] font-semibold leading-[0.98] tracking-[-3px] max-[720px]:mb-0 max-[720px]:mt-3 max-[720px]:text-[42px] max-[720px]:tracking-tight">
            Make progress
            <br />
            <i className="text-[#ffab9d] not-italic">visible.</i>
          </h1>
          <div className="max-w-[300px] border-l-2 border-coral pl-4 text-sm leading-relaxed text-white/75 max-[720px]:hidden">
            &quot;The clearest view of work is the one your whole team can
            share.&quot;
          </div>
          <div className="mt-7 max-w-[480px] rounded-xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur max-[720px]:hidden">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90">
                Product launch
              </span>
              <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-xs text-emerald-100">
                On track
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["To do", "Prepare launch brief", "Review analytics"],
                ["In progress", "Build landing page", "Update onboarding"],
                ["Done", "Align on scope", "Create project plan"],
              ].map(([column, ...items]) => (
                <div className="rounded-lg bg-white/10 p-2" key={column}>
                  <span className="mb-2 block text-xs font-semibold text-white/70">
                    {column}
                  </span>
                  {items.map((item) => (
                    <div
                      className="mb-1 rounded-md border border-white/10 bg-white/10 p-2 text-xs leading-snug text-white/90 last:mb-0"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-[1] text-xs text-white/70 max-[720px]:hidden">
          Realtime workspace for teams that build with intention <span>✦</span>
        </div>
      </div>
      <section className="grid place-items-center px-10 py-10 max-[720px]:px-6 max-[720px]:py-9">
        <div className="[width:min(100%,_355px)] [&_h2]:[margin:12px_0_9px] [&_h2]:[font:600_28px/1.1_'Space_Grotesk'] [&_h2]:[letter-spacing:-0.8px]">
          <div className="relative z-[1] mb-10 hidden items-center gap-2.5 font-display text-[21px] font-bold tracking-tight text-ink max-[720px]:flex">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral text-white">
              <Sparkles size={16} />
            </span>
            taskforge
          </div>
          <p className="text-xs font-bold tracking-[0.15em] text-coral">
            {isRegistering ? "GET STARTED" : "TEAM WORKSPACE"}
          </p>
          <h2>{isRegistering ? "Create your account." : "Pick up where you left off."}</h2>
          <p className="mb-7 mt-2 text-sm text-muted">
            {isRegistering
              ? "Join your team on taskforge."
              : "Sign in to your taskforge workspace."}
          </p>
          <form
            onSubmit={submit}
            className="grid gap-4 [&_label_>_span]:mb-2 [&_label_>_span]:block [&_label_>_span]:text-sm [&_label_>_span]:font-semibold [&_label_>_span]:text-ink"
          >
            {isRegistering && (
              <label>
                <span>Full name</span>
                <div className="flex items-center gap-2.5 rounded-lg border border-line bg-field px-3 py-2.5 text-muted focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none">
                  <UserRound size={16} />
                  <input
                    required
                    maxLength="80"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Your full name"
                    aria-invalid={Boolean(formErrors.name)}
                  />
                </div>
                {formErrors.name && <FieldError>{formErrors.name}</FieldError>}
              </label>
            )}
            <label>
              <span>Email</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-field px-3 py-2.5 text-muted focus-within:border-line focus-within:ring-0 [&_input]:min-w-0 [&_input]:w-full [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none [&_input]:focus:outline-none [&_input]:focus:ring-0">
                <Mail size={16} />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@company.com"
                  aria-invalid={Boolean(formErrors.email)}
                />
              </div>
              {formErrors.email && <FieldError>{formErrors.email}</FieldError>}
            </label>
            <label>
              <span>Password</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-field px-3 py-2.5 text-muted focus-within:border-line focus-within:ring-0 [&_input]:min-w-0 [&_input]:w-full [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none [&_input]:focus:outline-none [&_input]:focus:ring-0">
                <LockKeyhole size={16} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder={isRegistering ? "Create a strong password" : "Your password"}
                  aria-invalid={Boolean(formErrors.password)}
                />
                <button
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-muted hover:text-ink"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isRegistering && (
                <ul className="mt-2 grid list-none grid-cols-2 gap-2 p-0 text-xs">
                  {passwordRequirements.map(([requirement, valid]) => (
                    <li
                      className={`flex items-center gap-1 ${valid ? "text-emerald-700" : "text-muted"}`}
                      key={requirement}
                    >
                      <Check size={11} />
                      {requirement}
                    </li>
                  ))}
                </ul>
              )}
              {formErrors.password && <FieldError>{formErrors.password}</FieldError>}
            </label>
            {!isRegistering && (
              <button
                type="button"
                className="justify-self-start border-0 bg-transparent p-0 text-sm font-semibold text-coral hover:underline"
                onClick={() =>
                  setSuccess(
                    "Password resets are managed by your workspace administrator. Contact them for help.",
                  )
                }
              >
                Forgot password?
              </button>
            )}
            {isRegistering && (
              <label>
                <span>Confirm password</span>
                <div className="flex items-center gap-2.5 rounded-lg border border-line bg-field px-3 py-2.5 text-muted focus-within:border-line focus-within:ring-0 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:text-ink [&_input]:outline-none [&_input]:focus:outline-none [&_input]:focus:ring-0">
                  <LockKeyhole size={16} />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    placeholder="Re-enter your password"
                    aria-invalid={Boolean(formErrors.confirmPassword)}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <FieldError>{formErrors.confirmPassword}</FieldError>
                )}
              </label>
            )}
            {success && (
              <p
                className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                role="status"
              >
                {success}
              </p>
            )}
            {error && (
              <p
                className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-navy p-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? isRegistering
                  ? "Creating account..."
                  : "Connecting..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {isRegistering ? "Already have an account? " : "New to taskforge? "}
            <button
              type="button"
              className="border-0 bg-transparent p-0 font-bold text-coral hover:underline"
              onClick={switchMode}
            >
              {isRegistering ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function FieldError({ children }) {
  return (
    <small className="mt-1.5 block text-xs font-medium text-rose-700" role="alert">
      {children}
    </small>
  );
}
