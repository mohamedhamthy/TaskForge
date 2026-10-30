import Avatar from "./ui/Avatar";

export default function ActivityModal({ activityItems, onClose }) {
  return (
    <div
      className="modal-backdrop dark:[background:rgba(5,_7,_10,_0.74)]"
      role="presentation"
    >
      <section className="[width:min(100%,_620px)] [max-height:78vh] [overflow:auto] [padding:24px] [border:1px_solid_var(--line)] [border-radius:10px] bg-paper [box-shadow:0_24px_80px_rgba(31,_37,_52,_0.2)] dark:text-ink dark:border-line dark:bg-paper">
        <div className="flex items-start justify-between [&_h2]:[margin:0] [&_h2]:[font:600_20px_'Space_Grotesk']">
          <div>
            <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
              WORKSPACE HISTORY
            </p>
            <h2>Recent activity</h2>
          </div>
          <button
            className="border-0 text-muted [background:transparent] [font-size:24px] [line-height:1]"
            onClick={onClose}
            aria-label="Close activity"
          >
            ×
          </button>
        </div>
        <div className="[margin-top:20px]">
          {activityItems.length ? (
            activityItems.map((item) => (
              <div
                className="flex items-center [gap:10px] [padding:12px_0] [border-top:1px_solid_#f0f0ec] [&_p]:[margin:0] [&_p]:[color:#77747a] [&_p]:[font-size:10px] [&_strong]:text-ink [&_small]:[display:block] [&_small]:[margin-top:4px] [&_small]:text-muted [&_small]:[font-size:9px]"
                key={item._id}
              >
                <Avatar
                  as="div"
                  name={item.user?.name?.slice(0, 2) || "?"}
                />
                <p>
                  <strong>{item.user?.name || "Team member"}</strong>{" "}
                  {item.action}
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted [font-size:10px]">
              No activity recorded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
