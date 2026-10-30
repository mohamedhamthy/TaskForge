import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { dynamicStyles } from "../../tailwindStyles.js";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function PasswordSettings() {
  const changePassword = useAuthStore((state) => state.changePassword);
  const [form, setForm] = useState(emptyForm);
  const [visibleFields, setVisibleFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const toggleVisibility = (field) =>
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(emptyForm);
      setMessage({ type: "success", text: "Password changed successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="[margin:0_0_22px] [padding-top:20px] [border-top:1px_solid_var(--line)] [&_h3]:[margin:0] [&_h3]:[font:600_16px_'Space_Grotesk'] [&_>_p]:[margin:6px_0_16px] [&_>_p]:text-muted [&_>_p]:[font-size:14px] dark:[&_>_p]:text-muted"
      aria-labelledby="password-settings-title"
    >
      <h3 id="password-settings-title">Change password</h3>
      <p>Choose a new password for your account.</p>
      <form className="grid [gap:12px]" onSubmit={submit}>
        {[
          ["currentPassword", "Current password", "current-password"],
          ["newPassword", "New password", "new-password"],
          ["confirmPassword", "Confirm new password", "new-password"],
        ].map(([field, label, autoComplete]) => (
          <label
            className="grid [gap:6px] text-ink [font-size:12px] font-semibold"
            key={field}
          >
            <span>{label}</span>
            <div className="flex items-center [border:1px_solid_var(--line)] [border-radius:6px] bg-paper [&:focus-within]:[border-color:var(--coral)] [&:focus-within]:[box-shadow:0_0_0_3px_rgba(242,_119,_104,_0.12)] [&_input]:flex-1 [&_input]:min-w-0 [&_input]:p-2.5 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-ink [&_input]:[background:transparent] [&_input]:[font:inherit] [&_input]:text-sm [&_button]:grid [&_button]:place-items-center [&_button]:[margin-right:7px] [&_button]:[padding:5px] [&_button]:border-0 [&_button]:text-muted [&_button]:[background:transparent] [&_button]:[cursor:pointer] dark:[&_input]:[background:transparent] dark:border-line dark:[background:#202328]">
              <input
                autoComplete={autoComplete}
                maxLength="100"
                minLength={field === "currentPassword" ? undefined : 8}
                required
                type={visibleFields[field] ? "text" : "password"}
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
              />
              <button
                type="button"
                aria-label={`${visibleFields[field] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                onClick={() => toggleVisibility(field)}
              >
                {visibleFields[field] ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </label>
        ))}
        {message && (
          <p
            className={`[margin:0] [font-size:12px] ${dynamicStyles.message[message.type]}`}
            role="status"
          >
            {message.text}
          </p>
        )}
        <button
          className="min-h-10 border-0 [border-radius:8px] px-4 py-2.5 flex items-center gap-2 [font-size:14px] font-semibold text-white bg-navy [box-shadow:var(--shadow-card)]"
          disabled={saving}
          type="submit"
        >
          {saving ? "Changing..." : "Change password"}
        </button>
      </form>
    </section>
  );
}
