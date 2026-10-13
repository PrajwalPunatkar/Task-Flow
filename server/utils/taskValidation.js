export const TASK_STATUSES = ['pending', 'in-progress', 'completed']
export const TASK_PRIORITIES = ['low', 'medium', 'high']

const allowedFields = new Set(['title', 'description', 'status', 'priority', 'dueDate'])
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i

const isValidDueDate = (value) => {
  if (typeof value !== 'string') return false
  if (dateOnlyPattern.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  return dateTimePattern.test(value) && Number.isFinite(Date.parse(value))
}

const parseTaskFields = (body, { partial }) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' }
  }

  const unknownField = Object.keys(body).find((field) => !allowedFields.has(field))
  if (unknownField) return { error: `Field "${unknownField}" cannot be set.` }

  const data = {}
  if (!partial && (typeof body.title !== 'string' || !body.title.trim())) {
    return { error: 'A task title is required.' }
  }

  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
      return { error: 'Title must contain 1 to 120 characters.' }
    }
    data.title = body.title.trim()
  }

  if (Object.hasOwn(body, 'description')) {
    if (typeof body.description !== 'string' || body.description.length > 5000) {
      return { error: 'Description must be a string of at most 5000 characters.' }
    }
    data.description = body.description.trim()
  }

  if (Object.hasOwn(body, 'status')) {
    if (!TASK_STATUSES.includes(body.status)) {
      return { error: `Status must be one of: ${TASK_STATUSES.join(', ')}.` }
    }
    data.status = body.status
  }

  if (Object.hasOwn(body, 'priority')) {
    if (!TASK_PRIORITIES.includes(body.priority)) {
      return { error: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}.` }
    }
    data.priority = body.priority
  }

  if (Object.hasOwn(body, 'dueDate')) {
    if (body.dueDate === null || body.dueDate === '') {
      data.dueDate = null
    } else if (!isValidDueDate(body.dueDate)) {
      return { error: 'Due date must be a valid date or null.' }
    } else {
      data.dueDate = new Date(body.dueDate)
    }
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: 'Provide at least one task field to update.' }
  }

  return { data }
}

export const validateTaskCreate = (body) => parseTaskFields(body, { partial: false })
export const validateTaskUpdate = (body) => parseTaskFields(body, { partial: true })

export const validateTaskListQuery = (query) => {
  const status = query.status || ''
  if (status && !TASK_STATUSES.includes(status)) {
    return { error: `Status must be one of: ${TASK_STATUSES.join(', ')}.` }
  }

  const search = typeof query.search === 'string' ? query.search.trim() : ''
  if (search.length > 100) return { error: 'Search must be at most 100 characters.' }

  const page = Number(query.page ?? 1)
  const limit = Number(query.limit ?? 10)
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    return { error: 'Page and limit must be positive whole numbers.' }
  }

  return { data: { status, search, page, limit: Math.min(limit, 100) } }
}
