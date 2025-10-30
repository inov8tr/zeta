interface TeacherEmptyStateProps {
  message: string;
}

const TeacherEmptyState = ({ message }: TeacherEmptyStateProps) => (
  <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-teacher-primary/20 bg-teacher-primary/5 text-center text-sm text-neutral-muted">
    <p className="max-w-sm px-6">{message}</p>
  </div>
);

export default TeacherEmptyState;
