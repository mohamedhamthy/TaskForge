import { Bell, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Dropdown from "./ui/Dropdown";
import { RoleBadge } from "./ui/RoleSelect";

export function NotificationPanel({
  notifications,
  notificationItems,
  notificationOpen,
  onToggle,
  onMarkAllRead,
  onNotificationClick,
}) {
  return (
    <div className="relative">
      <button
        className="relative grid place-items-center border-0 [background:transparent] [color:#9b999b] [&_i]:absolute [&_i]:[top:-6px] [&_i]:[right:-8px] [&_i]:[width:15px] [&_i]:[height:15px] [&_i]:grid [&_i]:place-items-center [&_i]:[background:var(--coral)] [&_i]:[color:#fff] [&_i]:[border:2px_solid_#fffefa] [&_i]:[border-radius:50%] [&_i]:[font-size:8px] [&_i]:[font-style:normal]"
        aria-label="Notifications"
        aria-expanded={notificationOpen}
        aria-controls="notification-panel"
        onClick={onToggle}
      >
        <Bell size={18} />
        {notifications > 0 && <i>{notifications}</i>}
      </button>
      {notificationOpen && (
        <div
          className="absolute [z-index:8] [top:35px] [right:-8px] [width:295px] [overflow:hidden] [border:1px_solid_var(--line)] [border-radius:9px] bg-paper [box-shadow:0_14px_35px_rgba(36,_44,_61,_0.14)] dark:text-ink dark:border-line dark:bg-paper"
          id="notification-panel"
        >
          <div className="flex items-center justify-between [padding:13px_14px] [border-bottom:1px_solid_var(--line)] [font-size:11px] [&_button]:border-0 [&_button]:text-coral [&_button]:[background:transparent] [&_button]:[font-size:9px] dark:[&_button]:[background:transparent]">
            <strong>Notifications</strong>
            <button onClick={onMarkAllRead}>Mark all read</button>
          </div>
          {notificationItems.length ? (
            notificationItems.map((item) => (
              <button
                type="button"
                className={
                  item.isRead
                    ? "flex [gap:9px] [padding:12px_14px] [border-bottom:1px_solid_#f0f0ec] [background:#fff8f6] [&_strong]:[display:block] [&_strong]:text-ink [&_strong]:[font-size:10px] [&_p]:[margin:4px_0] [&_p]:[color:#77747a] [&_p]:[font-size:9px] [&_p]:[line-height:1.35] [&_small]:[color:#aaa8a6] [&_small]:[font-size:8px] w-full border-0 [color:inherit] text-left [font:inherit] [cursor:pointer] [&:hover]:[background:#fff0ed] [&:focus-visible]:[outline:2px_solid_var(--coral)] [&:focus-visible]:[outline-offset:-2px] dark:border-line dark:[background:#30282a] dark:[&:hover]:[background:#393137] dark:[&_p]:[color:#c0bec4] [.notification-item&]:bg-paper [.notification-item&]:[opacity:0.7] dark:[.notification-item&]:bg-paper"
                    : "flex [gap:9px] [padding:12px_14px] [border-bottom:1px_solid_#f0f0ec] [background:#fff8f6] [&_strong]:[display:block] [&_strong]:text-ink [&_strong]:[font-size:10px] [&_p]:[margin:4px_0] [&_p]:[color:#77747a] [&_p]:[font-size:9px] [&_p]:[line-height:1.35] [&_small]:[color:#aaa8a6] [&_small]:[font-size:8px] w-full border-0 [color:inherit] text-left [font:inherit] [cursor:pointer] [&:hover]:[background:#fff0ed] [&:focus-visible]:[outline:2px_solid_var(--coral)] [&:focus-visible]:[outline-offset:-2px] dark:border-line dark:[background:#30282a] dark:[&:hover]:[background:#393137] dark:[&_p]:[color:#c0bec4]"
                }
                key={item._id}
                onClick={() => onNotificationClick(item)}
              >
                <span className="[width:6px] [height:6px] [margin-top:4px] shrink-0 [border-radius:50%] [background:var(--coral)]"></span>
                <span className="grid [gap:4px] min-w-0 [&_>_span]:[color:#77747a] [&_>_span]:[font-size:9px] [&_>_span]:[line-height:1.35] dark:[&_>_span]:[color:#c0bec4]">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="[padding:22px_14px] text-muted [text-align:center] [font-size:10px]">
              You&apos;re all caught up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header({
  activeNav,
  query,
  onQueryChange,
  notifications,
  notificationItems,
  notificationOpen,
  onToggleNotifications,
  onMarkAllRead,
  onNotificationClick,
  user,
  roleKey,
  onOpenSettings,
  onToggleSidebar,
  logout,
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line bg-paper/95 px-[clamp(16px,3vw,38px)] backdrop-blur dark:text-ink">
      <div className="text-xs flex [gap:11px] [color:#aaa8aa] [&_b]:text-ink [&_b]:font-semibold dark:text-muted max-[760px]:gap-2">
        <button
          type="button"
          className="mr-1 hidden h-9 w-9 place-items-center rounded-lg border border-line bg-field text-ink max-[760px]:grid"
          aria-label="Open navigation"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </button>
        <span className="max-[760px]:hidden">Workspace</span>
        <span className="max-[760px]:hidden">/</span>
        <b>{activeNav}</b>
      </div>
      <div className="flex items-center [gap:20px] max-[760px]:gap-3">
        <ThemeToggle />
        <label className="flex items-center gap-2 [color:#aaa9a8] [border-bottom:1px_solid_var(--line)] [padding:6px_0] [&_input]:border-0 [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[width:130px] [&_input]:[font-size:11px] [&_kbd]:[border:1px_solid_var(--line)] [&_kbd]:[border-radius:4px] [&_kbd]:[padding:1px_5px] [&_kbd]:[color:#a5a3a0] [&_kbd]:[font-size:9px] max-[760px]:[display:none] dark:text-muted dark:[&_input]:[background:transparent]">
          <Search size={16} />
          <input
            aria-label="Search tasks"
            placeholder="Search tasks..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>
        <NotificationPanel
          notifications={notifications}
          notificationItems={notificationItems}
          notificationOpen={notificationOpen}
          onToggle={onToggleNotifications}
          onMarkAllRead={onMarkAllRead}
          onNotificationClick={onNotificationClick}
        />
        <Dropdown
          label="User menu"
          trigger={({ open, onToggle, triggerRef }) => (
            <button
              ref={triggerRef}
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-coral/15 text-xs font-bold text-ink hover:border-coral"
              aria-label="Open user menu"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={onToggle}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </button>
          )}
        >
          <div className="border-b border-line px-2 py-2">
            <strong className="block truncate text-sm text-ink">
              {user.name}
            </strong>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {user.email}
            </span>
            <span className="mt-2 inline-flex rounded-full bg-canvas px-2 py-1">
              <RoleBadge role={roleKey} />
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
            onClick={onOpenSettings}
          >
            <UserRound size={15} /> Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
            onClick={onOpenSettings}
          >
            <Settings size={15} /> Settings
          </button>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
            onClick={logout}
          >
            <LogOut size={15} /> Log out
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
