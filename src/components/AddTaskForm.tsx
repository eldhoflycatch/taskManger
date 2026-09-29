import { useState, type FormEvent } from "react";

type AddTaskFormProps = {
  onAdd: (title: string, description?: string) => void;
};

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title, description);
    setTitle("");
    setDescription("");
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <div className="add-task__fields">
        <label className="field">
          <span>Task</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing today?"
            required
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Notes (optional)</span>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Context or expected outcome"
            autoComplete="off"
          />
        </label>
      </div>
      <button type="submit" className="btn btn--primary">
        Add task
      </button>
    </form>
  );
}
