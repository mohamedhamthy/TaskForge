import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { dynamicStyles } from "../../tailwindStyles.js";

const activity = [
  {
    initials: "KM",
    color: "mint",
    text: "Kumar moved",
    strong: "Create payment API",
    time: "12 min ago",
  },
  {
    initials: "PN",
    color: "lilac",
    text: "Priya commented on",
    strong: "Design empty states",
    time: "38 min ago",
  },
  {
    initials: "JR",
    color: "sky",
    text: "Jordan completed",
    strong: "Review auth flows",
    time: "1 hr ago",
  },
];

export default function DashboardInsights({
  isOwner,
  onCreateProject,
  onOpenMembers,
  onViewActivity,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const runAction = (action) => {
    setMenuOpen(false);
    action();
  };

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 [[data-view=calendar]_&]:hidden">
      <div className="rounded-[var(--radius-md)] border border-line bg-paper p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between [&_h2]:m-0 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
          <div>
            <h2>Recent activity</h2>
            <p>Latest updates from your team</p>
          </div>
          <button
            className="border-0 bg-transparent text-xs font-semibold text-coral hover:underline [&_span]:ml-1 [&_span]:text-sm"
            onClick={onViewActivity}
          >
            View all <span>→</span>
          </button>
        </div>
        <div className="[margin-top:21px]">
          {activity.map((item) => (
            <div
              className="flex gap-3 border-t border-line py-3 [&_p]:m-0 [&_p]:text-sm [&_p]:text-muted [&_strong]:font-semibold [&_strong]:text-ink [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted"
              key={item.strong}
            >
              <div
                className={`inline-grid h-8 w-8 place-items-center rounded-full text-xs font-bold shrink-0 ${dynamicStyles.avatar[item.color]}`}
              >
                {item.initials}
              </div>
              <p>
                {item.text} <strong>{item.strong}</strong>
                <small>{item.time}</small>
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] border border-line bg-paper p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between [&_h2]:m-0 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
          <div>
            <h2>Project progress</h2>
            <p>Across your active projects</p>
          </div>
          <div className="relative [&_>_button]:[cursor:pointer]">
            <button
              className="relative grid place-items-center border-0 [background:transparent] [color:#9b999b]"
              type="button"
              aria-label="More project progress actions"
              aria-expanded={menuOpen}
              aria-controls="progress-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal size={17} />
            </button>
            {menuOpen && (
              <div
                className="absolute [z-index:5] [top:calc(100%_+_6px)] [right:0] grid [min-width:150px] [padding:5px] [border:1px_solid_var(--line)] [border-radius:7px] bg-paper [box-shadow:0_8px_24px_rgba(37,_36,_42,_0.12)] [&_button]:[padding:9px_10px] [&_button]:border-0 [&_button]:[border-radius:4px] [&_button]:text-ink [&_button]:[background:transparent] [&_button]:text-left [&_button]:[font:inherit] [&_button]:text-xs [&_button]:[cursor:pointer] [&_button:hover]:[background:var(--line)]"
                id="progress-menu"
              >
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => runAction(onCreateProject)}
                  >
                    Create project
                  </button>
                )}
                <button type="button" onClick={() => runAction(onOpenMembers)}>
                  Team members
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="[margin-top:23px]">
          <div className="flex items-center gap-2 text-sm [&_b]:font-medium [&_span:last-child]:ml-auto [&_span:last-child]:text-xs [&_span:last-child]:text-muted">
            <span className={`inline-block h-2 w-2 shrink-0 rounded-sm ${dynamicStyles.color.coral}`}></span>
            <b>E-commerce Platform</b>
            <span>68%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
            <span className={`block h-full w-[68%] rounded-full ${dynamicStyles.color.coral}`}></span>
          </div>
        </div>
        <div className="[margin-top:23px]">
          <div className="flex items-center gap-2 text-sm [&_b]:font-medium [&_span:last-child]:ml-auto [&_span:last-child]:text-xs [&_span:last-child]:text-muted">
            <span className={`inline-block h-2 w-2 shrink-0 rounded-sm ${dynamicStyles.color.sky}`}></span>
            <b>Mobile App</b>
            <span>42%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
            <span className={`block h-full w-[42%] rounded-full ${dynamicStyles.color.sky}`}></span>
          </div>
        </div>
        <div className="[margin-top:23px]">
          <div className="flex items-center gap-2 text-sm [&_b]:font-medium [&_span:last-child]:ml-auto [&_span:last-child]:text-xs [&_span:last-child]:text-muted">
            <span className={`inline-block h-2 w-2 shrink-0 rounded-sm ${dynamicStyles.color.lilac}`}></span>
            <b>Marketing Website</b>
            <span>85%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
            <span className={`block h-full w-[85%] rounded-full ${dynamicStyles.color.lilac}`}></span>
          </div>
        </div>
      </div>
    </section>
  );
}
