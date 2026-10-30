import Button from "./ui/Button";

export default function ReviewWorkflowPanel({
  selectedTask,
  isTeamLead,
  userId,
  saving,
  reviewDraft,
  setReviewDraft,
  onRequestChanges,
  onApprove,
  onSubmitForReview,
}) {
  return (
    <div className="[position:fixed] [z-index:20] [right:28px] [bottom:24px] [width:min(360px,_calc(100vw_-_32px))] grid [gap:9px] [padding:14px] [border:1px_solid_#eadfdb] [border-radius:9px] bg-paper [box-shadow:0_14px_35px_rgba(36,_44,_61,_0.16)] [&_strong]:[font:600_12px_'Space_Grotesk'] [&_textarea]:w-full [&_textarea]:[resize:vertical] [&_textarea]:[padding:8px] [&_textarea]:[border:1px_solid_var(--line)] [&_textarea]:[border-radius:5px] [&_textarea]:[outline:0] [&_textarea]:[font-size:10px] [&_>_div]:flex [&_>_div]:[justify-content:end] [&_>_div]:[gap:7px] dark:text-ink dark:border-line dark:bg-paper">
      <strong>Review workflow</strong>
      {isTeamLead && selectedTask.status === "REVIEW" && (
        <>
          <textarea
            aria-label="Review feedback"
            value={reviewDraft}
            onChange={(event) => setReviewDraft(event.target.value)}
            placeholder="Add review feedback..."
            rows="2"
          />
          <div>
            <Button
              variant="secondary"
              disabled={saving || !reviewDraft.trim()}
              onClick={onRequestChanges}
            >
              Request changes
            </Button>
            <Button disabled={saving} onClick={onApprove}>
              Approve &amp; complete
            </Button>
          </div>
        </>
      )}
      {!isTeamLead &&
        selectedTask.assignee?._id === userId &&
        selectedTask.status === "REVIEW" && (
          <Button disabled={saving} onClick={onSubmitForReview}>
            {saving ? "Submitting..." : "Submit for review"}
          </Button>
        )}
    </div>
  );
}
