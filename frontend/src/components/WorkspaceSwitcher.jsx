import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";

import { api } from "../services/api";

export default function WorkspaceSwitcher({
  teams,
  activeTeam,
  isOwner,
  onSelect,
  onCreated,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createWorkspace = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.createTeam({
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(response.data);
      setName("");
      setDescription("");
      setCreateOpen(false);
      setMenuOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="relative [margin-bottom:26px]">
        <button
          className="flex items-center [gap:9px] [margin-bottom:26px] [padding:9px] [border:1px_solid_var(--line)] [border-radius:9px] text-xs [&_>_svg]:[margin-left:auto] [&_>_svg]:text-muted [&_b]:[display:block] [&_small]:[display:block] [&_small]:text-muted [&_small]:[font-size:10px] [&_small]:[margin-top:2px] max-[760px]:[&_>_svg]:[display:none] max-[760px]:justify-center max-[760px]:[padding:6px] dark:text-ink dark:border-line dark:bg-paper dark:[&_>_svg]:text-muted"
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="[width:26px] [height:26px] [border-radius:7px] grid place-items-center [color:#fff] [background:#596479] font-bold">
            {activeTeam?.name?.slice(0, 1).toUpperCase() || "W"}
          </span>
          <span className="flex-1 min-w-0 [&_b]:[overflow:hidden] [&_b]:[text-overflow:ellipsis] [&_b]:[white-space:nowrap] dark:[&_small]:text-muted">
            <b>{activeTeam?.name || "Select a workspace"}</b>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>

        {menuOpen && (
          <div
            className="absolute [z-index:20] [top:calc(100%_+_7px)] [left:0] grid [gap:4px] w-full [padding:7px] [border:1px_solid_var(--line)] [border-radius:8px] bg-paper [box-shadow:var(--shadow)] dark:text-ink dark:border-line dark:bg-paper"
            role="menu"
          >
            <p className="[margin:3px_7px_5px] text-muted [font-size:9px] font-bold uppercase">
              Your workspaces
            </p>
            {teams.map((team) => (
              <button
                className="flex items-center gap-2 w-full [min-height:36px] [padding:6px_8px] border-0 [border-radius:5px] text-ink [background:transparent] text-left [font:inherit] [font-size:11px] [&:hover]:[background:#f7f0ee] [&_>_svg]:[margin-left:auto] [&_>_svg]:text-coral dark:[&:hover]:text-ink dark:[&:hover]:[background:#37343a]"
                key={team._id}
                role="menuitem"
                type="button"
                onClick={() => {
                  onSelect(team._id);
                  setMenuOpen(false);
                }}
              >
                <span className="grid [flex:0_0_24px] place-items-center [width:24px] [height:24px] [border-radius:6px] [color:#fff] [background:#596479] [font-size:10px] font-bold">
                  {team.name.slice(0, 1).toUpperCase()}
                </span>
                <span>{team.name}</span>
                {team._id === activeTeam?._id && <Check size={15} />}
              </button>
            ))}
            {isOwner && (
              <button
                className="flex items-center gap-2 w-full [min-height:36px] [padding:6px_8px] border-0 [border-radius:5px] text-ink [background:transparent] text-left [font:inherit] [font-size:11px] [&:hover]:[background:#f7f0ee] [margin-top:4px] [border-top:1px_solid_var(--line)] [border-radius:0_0_5px_5px] text-coral dark:[&:hover]:text-ink dark:[&:hover]:[background:#37343a] dark:border-line"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setCreateOpen(true);
                  setError("");
                }}
              >
                <Plus size={15} />
                Create workspace
              </button>
            )}
          </div>
        )}
      </div>

      {createOpen && (
        <div
          className="modal-backdrop dark:[background:rgba(5,_7,_10,_0.74)]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setCreateOpen(false);
            }
          }}
        >
          <form
            className="modal-form dark:text-ink dark:border-line dark:bg-paper"
            onSubmit={createWorkspace}
          >
            <div className="flex items-start justify-between [&_h2]:[margin:0] [&_h2]:[font:600_20px_'Space_Grotesk']">
              <div>
                <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
                  NEW WORKSPACE
                </p>
                <h2>Create workspace</h2>
              </div>
              <button
                type="button"
                className="border-0 text-muted [background:transparent] [font-size:24px] [line-height:1]"
                aria-label="Close dialog"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <label>
              Workspace name
              <input
                autoFocus
                required
                maxLength="100"
                minLength="2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product Studio"
              />
            </label>
            <label>
              Description
              <textarea
                maxLength="500"
                rows="3"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this workspace for?"
              />
            </label>
            {error && (
              <p
                className="[margin:0] [color:#a94c43] [font-size:10px] dark:[color:#ffaaa0]"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="flex [justify-content:end] gap-2 [margin-top:5px]">
              <button
                type="button"
                className="action-button [color:#77747a] [border:1px_solid_var(--line)] [background:#fffefa] dark:text-ink dark:border-line dark:[background:#30333a] dark:[&:hover]:[background:#3a3d45]"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                className="action-button [color:#fff] bg-navy [box-shadow:0_4px_10px_rgba(36,_44,_61,_0.17)]"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create workspace"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
