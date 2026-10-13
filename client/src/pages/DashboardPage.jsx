import { useCallback, useEffect, useState } from 'react'
import TaskDialog from '../components/TaskDialog.jsx'
import { useAuth } from '../auth/authContext.js'
import { createTask, deleteTask, listTasks, updateTask } from '../services/tasks.js'

const statusLabels = { pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed' }
const statusOptions = Object.entries(statusLabels)

const getRequestError = (error) =>
  error.response?.data?.message || 'Something went wrong. Please try again.'

function Brand() {
  return (
    <a className="brand" href="/dashboard" aria-label="TaskFlow dashboard">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.2 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span>taskflow</span>
    </a>
  )
}

function TaskCard({ task, busy, onEdit, onDelete, onStatusChange }) {
  const dueKey = task.dueDate?.slice(0, 10)
  const [year, month, day] = dueKey ? dueKey.split('-').map(Number) : []
  const due = dueKey ? new Date(year, month - 1, day) : null
  const [today] = useState(() => {
    const current = new Date()
    return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
  })
  const isOverdue = dueKey && dueKey < today && task.status !== 'completed'

  return (
    <article className={`task-card${task.status === 'completed' ? ' task-card-completed' : ''}`}>
      <div className="task-card-main">
        <div className="task-title-line">
          <h3>{task.title}</h3>
          <span className={`priority-pill priority-${task.priority}`}><i />{task.priority}</span>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`status-dot status-${task.status}`}>{statusLabels[task.status]}</span>
          <span className={`due-date${isOverdue ? ' due-overdue' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M7.5 3v4M16.5 3v4M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            {due ? `${isOverdue ? 'Overdue - ' : ''}${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No due date'}
          </span>
        </div>
      </div>
      <div className="task-actions">
        <label className="sr-only" htmlFor={`status-${task._id}`}>Update status for {task.title}</label>
        <select id={`status-${task._id}`} className="task-status-select" value={task.status} onChange={(event) => onStatusChange(task, event.target.value)} disabled={busy}>
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="task-action-button" type="button" onClick={() => onEdit(task)} disabled={busy} aria-label={`Edit ${task.title}`}>Edit</button>
        <button className="task-action-button task-delete-button" type="button" onClick={() => onDelete(task)} disabled={busy} aria-label={`Delete ${task.title}`}>Delete</button>
      </div>
    </article>
  )
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialogTask, setDialogTask] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busyTask, setBusyTask] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const { data } = await listTasks({ page, limit: 10, status, search })
      setTasks(data.tasks)
      setPagination(data.pagination)
      if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
        setPage(data.pagination.totalPages)
      }
    } catch (error) {
      setLoadError(getRequestError(error))
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    const timer = window.setTimeout(loadTasks, 0)
    return () => window.clearTimeout(timer)
  }, [loadTasks])

  const showError = (error) => setNotice(getRequestError(error))

  const submitTask = async (values) => {
    setBusyTask(dialogTask?._id || 'new')
    setNotice('')
    try {
      if (dialogTask) {
        await updateTask(dialogTask._id, values)
        setNotice('Task updated.')
      } else {
        await createTask(values)
        setNotice('Task created.')
        setPage(1)
      }
      setDialogOpen(false)
      setDialogTask(null)
      await loadTasks()
    } catch (error) {
      showError(error)
      throw error
    } finally {
      setBusyTask('')
    }
  }

  const handleStatusChange = async (task, nextStatus) => {
    setBusyTask(task._id)
    setNotice('')
    try {
      await updateTask(task._id, { status: nextStatus })
      setNotice('Task status updated.')
      await loadTasks()
    } catch (error) {
      showError(error)
    } finally {
      setBusyTask('')
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setBusyTask(task._id)
    setNotice('')
    try {
      await deleteTask(task._id)
      setNotice('Task deleted.')
      await loadTasks()
    } catch (error) {
      showError(error)
    } finally {
      setBusyTask('')
    }
  }

  const handleLogout = () => {
    logout()
    window.location.replace('/login')
  }

  const openCreateDialog = () => {
    setDialogTask(null)
    setDialogOpen(true)
  }

  const openEditDialog = (task) => {
    setDialogTask(task)
    setDialogOpen(true)
  }

  const hasFilters = search || status

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Main navigation">
        <Brand />
        <button className="logout-button" type="button" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Log out
        </button>
      </nav>

      <section className="dashboard-content">
        <header className="task-heading-row">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h1>Good to see you, {user?.name || 'there'}.</h1>
            <p className="dashboard-subtitle">A little progress adds up. Let's make today count.</p>
          </div>
          <button type="button" className="button-primary create-task-button" onClick={openCreateDialog}>
            <span aria-hidden="true">+</span> New task
          </button>
        </header>

        <section className="task-toolbar" aria-label="Task filters">
          <label className="task-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <span className="sr-only">Search tasks</span>
            <input type="search" placeholder="Search tasks..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </label>
          <label className="filter-select">
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <span className="task-count">{pagination.total} {pagination.total === 1 ? 'task' : 'tasks'}</span>
        </section>

        {notice && <p className="task-notice" role="status">{notice}</p>}
        {loadError && <div className="task-error" role="alert"><span>{loadError}</span><button type="button" onClick={loadTasks}>Try again</button></div>}

        {loading ? (
          <div className="task-loading" role="status"><span className="spinner spinner-dark" /> Loading your tasks...</div>
        ) : loadError ? null : tasks.length ? (
          <div className="task-list">
            {tasks.map((task) => <TaskCard key={task._id} task={task} busy={busyTask === task._id} onEdit={openEditDialog} onDelete={handleDelete} onStatusChange={handleStatusChange} />)}
          </div>
        ) : (
          <section className="empty-card task-empty" aria-labelledby="empty-task-title">
            <div className="empty-content">
              <span className="empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" /><path d="M8 9h8M8 13h5m-5 4h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </span>
              <h2 id="empty-task-title">{hasFilters ? 'No matching tasks' : 'Your task list is clear'}</h2>
              <p>{hasFilters ? 'Try a different search or status filter.' : 'Create your first task and give your next work session a clear starting point.'}</p>
              {!hasFilters && <button type="button" className="button-primary empty-create-button" onClick={openCreateDialog}>Create your first task</button>}
            </div>
          </section>
        )}

        {!loading && !loadError && pagination.totalPages > 1 && (
          <nav className="pagination" aria-label="Task pages">
            <button type="button" className="button-secondary" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {pagination.totalPages}</span>
            <button type="button" className="button-secondary" onClick={() => setPage((current) => current + 1)} disabled={page >= pagination.totalPages}>Next</button>
          </nav>
        )}
      </section>

      {dialogOpen && <TaskDialog task={dialogTask} busy={busyTask === (dialogTask?._id || 'new')} onClose={() => { setDialogOpen(false); setDialogTask(null) }} onSubmit={submitTask} />}
    </main>
  )
}

export default DashboardPage
