import { useState } from 'react'

const emptyTask = { title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' }

function TaskDialog({ task, busy, onClose, onSubmit }) {
  const [values, setValues] = useState(() => task ? {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
  } : emptyTask)
  const [error, setError] = useState('')

  const setField = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const title = values.title.trim()
    if (!title) {
      setError('Add a title for this task.')
      return
    }
    if (title.length > 120) {
      setError('Task titles can be up to 120 characters.')
      return
    }
    if (values.description.length > 5000) {
      setError('Descriptions can be up to 5000 characters.')
      return
    }
    try {
      await onSubmit({ ...values, title, description: values.description.trim(), dueDate: values.dueDate || null })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save the task. Please try again.')
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">Task details</p>
            <h2 id="task-dialog-title">{task ? 'Edit task' : 'Create a task'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={busy} aria-label="Close dialog">x</button>
        </header>
        <form className="task-form" onSubmit={submit}>
          <label className="task-field task-field-wide">
            <span>Title <b aria-hidden="true">*</b></span>
            <input autoFocus name="title" value={values.title} onChange={setField} maxLength={120} placeholder="What needs to get done?" required />
          </label>
          <label className="task-field task-field-wide">
            <span>Description</span>
            <textarea name="description" value={values.description} onChange={setField} maxLength={5000} rows={4} placeholder="Add a few helpful details..." />
          </label>
          <label className="task-field">
            <span>Priority</span>
            <select name="priority" value={values.priority} onChange={setField}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label className="task-field">
            <span>Due date</span>
            <input name="dueDate" type="date" value={values.dueDate} onChange={setField} />
          </label>
          {task && <label className="task-field task-field-wide">
            <span>Status</span>
            <select name="status" value={values.status} onChange={setField}>
              <option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option>
            </select>
          </label>}
          {error && <p className="form-error task-field-wide" role="alert">{error}</p>}
          <footer className="dialog-actions task-field-wide">
            <button className="button-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : task ? 'Save changes' : 'Create task'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default TaskDialog
