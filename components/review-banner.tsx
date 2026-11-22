import { startReview } from "@/app/exam/actions";
import type { ReviewState } from "@/lib/scoring/exams";
import { EXAM_MINUTES } from "@/lib/scoring/exams";

// Shown when the review exam is due. Once it is overdue, topic quizzes are locked.
export function ReviewBanner({ review }: { review: ReviewState }) {
  if (!review.due) return null;
  return (
    <div role="alert" className={`alert ${review.overdue ? "alert-error" : "alert-warning"} flex flex-wrap`}>
      <span className="flex-1">
        {review.overdue
          ? "Your review exam is overdue. Topic quizzes are locked until you take it."
          : `Your review exam is due: 10 questions from the topics you have finished, weighted to your weak spots, ${EXAM_MINUTES.review} minutes. Topic quizzes lock if it waits more than a day.`}
      </span>
      <form action={startReview}>
        <button className="btn btn-sm">Start review exam</button>
      </form>
    </div>
  );
}

// Dates in the owner's time zone, like "Tue 25 Nov, 14:30".
export function formatWhen(date: Date) {
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
