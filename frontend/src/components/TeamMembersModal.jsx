import { useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { api } from "../services/api";

export default function TeamMembersModal({
  members,
  teamId,
  currentUserId,
  isOwner,
  isAdmin,
  onClose,
}) {
  const [resetTarget, setResetTarget] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const canResetPassword = (member) => {
    const memberId = member.user?._id || member.user;
    if (memberId === currentUserId) return false;
    return isOwner || (isAdmin && !["OWNER", "ADMIN"].includes(member.role));
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setSaving(true);
    try {
      const response = await api.resetMemberPassword(
        teamId,
        resetTarget.user?._id || resetTarget.user,
      );
      setTemporaryPassword(response.data.temporaryPassword);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setMessage("Temporary password copied. Share it securely.");
    } catch {
      setCopied(false);
      setMessage(
        "Copy was unavailable. Select the temporary password to copy it.",
      );
    }
  };  

  return (
    <div
      className="modal-backdrop dark:[background:rgba(5,_7,_10,_0.74)]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section    
        className="[width:min(100%,_620px)] [max-height:78vh] [overflow:auto] [padding:24px] [border:1px_solid_var(--line)] [border-radius:10px] bg-paper [box-shadow:0_24px_80px_rgba(31,_37,_52,_0.2)] dark:text-ink dark:border-line dark:bg-paper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-members-title"
      >
        <div className="flex items-start justify-between [&_h2]:[margin:0] [&_h2]:[font:600_20px_'Space_Grotesk']">
          <div>
            <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
              WORKSPACE PEOPLE
            </p>
            <h2 id="team-members-title">Team members</h2>
          </div>
          <button
            className="border-0 text-muted [background:transparent] [font-size:24px] [line-height:1]"
            onClick={onClose}
            aria-label="Close team members"
          >
            <X size={17} />
          </button>
        </div>
        <div className="[margin-top:20px]">
          {members.map((member) => (
            <div
              className="flex items-center [gap:10px] [padding:12px_0] [border-top:1px_solid_#f0f0ec] [&_strong]:text-ink [&_small]:[display:block] [&_small]:[margin-top:4px] [&_small]:text-muted [&_small]:[font-size:9px] [&_>_div:nth-child(2)]:grid [&_>_div:nth-child(2)]:flex-1 [&_>_div:nth-child(2)]:[gap:3px] [&_>_span]:[padding:4px_7px] [&_>_span]:[border-radius:4px] [&_>_span]:[color:#b85e51] [&_>_span]:[background:#fff0ed] [&_>_span]:[font-size:8px] [&_>_span]:font-bold [&_>_span]:uppercase max-[520px]:[align-items:flex-start] max-[520px]:[flex-wrap:wrap] dark:[&_small]:text-muted"
              key={member.user?._id || member.user}
            >
              <div className="[width:27px] [height:27px] inline-grid place-items-center [border-radius:50%] [font-size:9px] font-bold shrink-0 [color:#995349] [background:#f8c1b8]">
                {(member.user?.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="grid flex-1 [gap:3px] min-w-0">
                <strong>{member.user?.name || "Team member"}</strong>
                <small>{member.user?.email || ""}</small>
              </div>
              <div className="flex items-center [justify-content:end] gap-2 [margin-left:auto] [&_>_span]:[padding:4px_7px] [&_>_span]:[border-radius:4px] [&_>_span]:[color:#b85e51] [&_>_span]:[background:#fff0ed] [&_>_span]:[font-size:8px] [&_>_span]:font-bold [&_>_span]:uppercase [&_>_span]:[white-space:nowrap] max-[520px]:w-full max-[520px]:justify-between max-[520px]:[margin-left:42px]">
                <span>{member.role.replace("_", " ")}</span>
                {canResetPassword(member) && (
                  <button
                    type="button"
                    className="flex items-center [gap:5px] [padding:6px_8px] [border:1px_solid_var(--line)] [border-radius:5px] text-ink [background:transparent] [font:inherit] [font-size:9px] [cursor:pointer] [white-space:nowrap] [&:hover]:[background:#fff0ed] [&:disabled]:[cursor:wait] [&:disabled]:[opacity:0.6] dark:text-ink dark:border-line dark:[background:#2b2e34] dark:[&:hover]:[background:#393137]"
                    disabled={saving}
                    onClick={() => {
                      setResetTarget(member);
                      setTemporaryPassword("");
                      setMessage("");
                      setCopied(false);
                    }}
                  >
                    <KeyRound size={13} />
                    Reset password
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {resetTarget && (
          <section
            className="[margin-top:18px] [padding:14px] [border:1px_solid_var(--line)] [border-radius:7px] [background:#fffaf7] [&_h3]:[margin:0] [&_h3]:[font:600_13px_'Space_Grotesk'] [&_p]:[margin:7px_0_11px] [&_p]:text-muted [&_p]:[font-size:10px] [&_p]:[line-height:1.5] dark:border-line dark:[background:#202328] dark:[&_p]:[color:#ffaaa0]"
            aria-live="polite"
          >
            <h3>
              {saving
                ? "Generating temporary password..."
                : `Temporary password for ${resetTarget.user?.name || "team member"}`}
            </h3>
            {temporaryPassword ? (
              <>
                <p>
                  Share this one-time password securely. The account must choose
                  a new password at next sign-in.
                </p>
                <div className="flex items-center gap-2 [&_input]:flex-1 [&_input]:min-w-0 [&_input]:[padding:9px] [&_input]:[border:1px_solid_var(--line)] [&_input]:[border-radius:5px] [&_input]:text-ink [&_input]:bg-paper [&_input]:[font-family:monospace] [&_input]:text-xs dark:[&_input]:[background:#1f2227]">
                  <input
                    aria-label="Temporary password"
                    readOnly
                    value={temporaryPassword}
                    onClick={(event) => event.currentTarget.select()}
                  />
                  <button
                    type="button"
                    className="action-button [color:#77747a] [border:1px_solid_var(--line)] [background:#fffefa] dark:text-ink dark:border-line dark:[background:#30333a] dark:[&:hover]:[background:#3a3d45]"
                    onClick={copyTemporaryPassword}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  type="button"
                  className="action-button [color:#77747a] [border:1px_solid_var(--line)] [background:#fffefa] dark:text-ink dark:border-line dark:[background:#30333a] dark:[&:hover]:[background:#3a3d45] flex items-center [gap:5px] [margin-top:10px]"
                  onClick={() => setResetTarget(null)}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p>
                  Generate a one-time password and sign this account out
                  everywhere. They must choose a new password at next sign-in.
                </p>
                {message && (
                  <p className="[color:#a94c43]" role="alert">
                    {message}
                  </p>
                )}
                <div className="flex [justify-content:end] gap-2">
                  <button
                    type="button"
                    className="action-button [color:#77747a] [border:1px_solid_var(--line)] [background:#fffefa] dark:text-ink dark:border-line dark:[background:#30333a] dark:[&:hover]:[background:#3a3d45]"
                    disabled={saving}
                    onClick={() => setResetTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="action-button [color:#fff] bg-navy [box-shadow:0_4px_10px_rgba(36,_44,_61,_0.17)]"
                    disabled={saving}
                    onClick={resetPassword}
                  >
                    {saving ? "Generating..." : "Generate temporary password"}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
        {message && temporaryPassword && (
          <p className="" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
