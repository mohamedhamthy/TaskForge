import Avatar from "./ui/Avatar";
import Button from "./ui/Button";

export default function TaskDetailsModal({
  selectedTask,
  loading,
  comments,
  activity,
  commentDraft,
  setCommentDraft,
  savingComment,
  onAddComment,
  onClose,
}) {
  return (
    <div
      className="modal-backdrop dark:[background:rgba(5,_7,_10,_0.74)]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="[width:min(100%,_860px)] [max-height:min(88vh,_760px)] [overflow:auto] [padding:26px] [border:1px_solid_var(--line)] [border-radius:11px] bg-paper [box-shadow:0_24px_80px_rgba(31,_37,_52,_0.2)] max-[650px]:[padding:19px] dark:text-ink dark:border-line dark:bg-paper">
        <div className="flex items-start justify-between [&_h2]:[margin:0] [&_h2]:[font:600_20px_'Space_Grotesk']">
          <div>
            <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
              TASK DETAILS
            </p>
            <h2>{loading ? "Loading task..." : selectedTask.title}</h2>
          </div>
          <button
            className="border-0 text-muted [background:transparent] [font-size:24px] [line-height:1]"
            onClick={onClose}
            aria-label="Close task details"
          >
            ×
          </button>
        </div>
        {loading ? (
          <p className="text-muted [font-size:10px]">
            Loading comments and activity...
          </p>
        ) : (
          <>
            <p className="[margin:20px_0] [color:#77747a] text-xs [line-height:1.6] dark:text-muted">
              {selectedTask.description || "No description added."}
            </p>
            <div className="grid [grid-template-columns:repeat(3,_1fr)] [gap:1px] [overflow:hidden] [border:1px_solid_var(--line)] [border-radius:7px] [background:var(--line)] [&_div]:[min-height:58px] [&_div]:[padding:11px] [&_div]:bg-paper [&_span]:[display:block] [&_strong]:[display:block] [&_span]:text-muted [&_span]:[font-size:9px] [&_strong]:[margin-top:5px] [&_strong]:[font-size:11px] [&_strong]:[text-transform:capitalize] max-[650px]:[grid-template-columns:repeat(2,_1fr)]">
              <div>
                <span>Assignee</span>
                <strong>{selectedTask.assignee?.name || "Unassigned"}</strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>{selectedTask.priority}</strong>
              </div>
              <div>
                <span>Due date</span>
                <strong>
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString()
                    : "No due date"}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedTask.status.replace("_", " ")}</strong>
              </div>
              <div>
                <span>Created by</span>
                <strong>{selectedTask.createdBy?.name || "Unknown"}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>
                  {new Date(selectedTask.updatedAt).toLocaleDateString()}
                </strong>
              </div>
            </div>
            <div className="grid [grid-template-columns:1.1fr_0.9fr] [gap:28px] [margin-top:26px] [&_h3]:flex [&_h3]:items-center [&_h3]:[gap:7px] [&_h3]:[margin:0_0_14px] [&_h3]:[font:600_13px_'Space_Grotesk'] [&_h3_span]:grid [&_h3_span]:place-items-center [&_h3_span]:[min-width:18px] [&_h3_span]:[height:18px] [&_h3_span]:[border-radius:50%] [&_h3_span]:[color:#e8796b] [&_h3_span]:[background:#fff0ed] [&_h3_span]:[font:600_9px_'DM_Sans'] max-[650px]:[grid-template-columns:1fr] max-[650px]:[gap:24px]">
              <div>
                <h3>
                  Comments <span>{comments.length}</span>
                </h3>
                <div className="[max-height:210px] [overflow:auto]">
                  {comments.length ? (
                    comments.map((comment) => (
                      <div
                        className="flex [gap:9px] [padding:10px_0] [border-top:1px_solid_#f0f0ec] [&_p]:[margin:0] [&_p]:[color:#77747a] [&_p]:[font-size:10px] [&_p]:[line-height:1.45] [&_strong]:[display:block] [&_strong]:text-ink [&_strong]:[font-size:10px] [&_small]:[display:block] [&_small]:[margin-top:4px] [&_small]:[color:#aaa8a6] [&_small]:[font-size:9px]"
                        key={comment._id}
                      >
                        <Avatar
                          as="div"
                          name={comment.user?.name?.slice(0, 2) || "?"}
                        />
                        <p>
                          <strong>{comment.user?.name || "Member"}</strong>
                          {comment.content}
                          <small>
                            {new Date(comment.createdAt).toLocaleString()}
                          </small>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted [font-size:10px]">
                      No comments yet.
                    </p>
                  )}
                </div>
                <form
                  className="flex [gap:7px] [margin-top:13px] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:[padding:9px_10px] [&_input]:[border:1px_solid_var(--line)] [&_input]:[border-radius:6px] [&_input]:[outline:0] [&_input]:[font-size:10px]"
                  onSubmit={onAddComment}
                >
                  <input
                    aria-label="Add a comment"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add a comment..."
                  />
                  <Button disabled={savingComment}>
                    {savingComment ? "..." : "Comment"}
                  </Button>
                </form>
              </div>
              <div>
                <h3>
                  Activity History <span>{activity.length}</span>
                </h3>
                <div className="[max-height:210px] [overflow:auto]">
                  {activity.length ? (
                    activity.map((item) => (
                      <div
                        className="[&_p]:[margin:0] [&_p]:[color:#77747a] [&_p]:[font-size:10px] [&_p]:[line-height:1.45] [&_small]:[display:block] [&_small]:[margin-top:4px] [&_small]:[color:#aaa8a6] [&_small]:[font-size:9px] relative flex [gap:9px] [padding:0_0_14px] [&_>_span]:[width:7px] [&_>_span]:[height:7px] [&_>_span]:[margin-top:4px] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--coral)] [&_>_span]:[box-shadow:0_0_0_3px_#fff0ed] [&_strong]:text-ink"
                        key={item._id}
                      >
                        <span></span>
                        <p>
                          <strong>{item.user?.name || "Member"}</strong>{" "}
                          {item.action}
                          <small>
                            {new Date(item.createdAt).toLocaleString()}
                          </small>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted [font-size:10px]">
                      No activity yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
