import mongoose from 'mongoose'
import Task from '../models/Task.js'
import { sendError } from '../utils/authErrors.js'
import { handleTaskError } from '../utils/taskErrors.js'
import { validateTaskCreate, validateTaskListQuery, validateTaskUpdate } from '../utils/taskValidation.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const validTaskId = (id) => mongoose.isValidObjectId(id)

export const createTask = async (request, response) => {
  const { data, error } = validateTaskCreate(request.body)
  if (error) return sendError(response, 400, error)

  try {
    const task = await Task.create({ ...data, user: request.userId })
    console.info('Task persisted.', {
      database: Task.db.name,
      collection: Task.collection.name,
      taskId: task._id.toString(),
    })
    return response.status(201).json({ success: true, task })
  } catch (creationError) {
    return handleTaskError(creationError, response)
  }
}

export const listTasks = async (request, response) => {
  const { data, error } = validateTaskListQuery(request.query)
  if (error) return sendError(response, 400, error)

  const filter = { user: request.userId }
  if (data.status) filter.status = data.status
  if (data.search) {
    const term = new RegExp(escapeRegex(data.search), 'i')
    filter.$or = [{ title: term }, { description: term }]
  }

  try {
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((data.page - 1) * data.limit)
        .limit(data.limit),
      Task.countDocuments(filter),
    ])

    return response.status(200).json({
      success: true,
      tasks,
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages: Math.ceil(total / data.limit),
      },
    })
  } catch (error) {
    return handleTaskError(error, response)
  }
}

export const getTask = async (request, response) => {
  if (!validTaskId(request.params.id)) return sendError(response, 400, 'Task ID is invalid.')

  try {
    const task = await Task.findOne({ _id: request.params.id, user: request.userId })
    if (!task) return sendError(response, 404, 'Task not found.')
    return response.status(200).json({ success: true, task })
  } catch (error) {
    return handleTaskError(error, response)
  }
}

export const updateTask = async (request, response) => {
  if (!validTaskId(request.params.id)) return sendError(response, 400, 'Task ID is invalid.')
  const { data, error } = validateTaskUpdate(request.body)
  if (error) return sendError(response, 400, error)

  try {
    const task = await Task.findOneAndUpdate(
      { _id: request.params.id, user: request.userId },
      { $set: data },
      { new: true, runValidators: true },
    )
    if (!task) return sendError(response, 404, 'Task not found.')
    return response.status(200).json({ success: true, task })
  } catch (error) {
    return handleTaskError(error, response)
  }
}

export const deleteTask = async (request, response) => {
  if (!validTaskId(request.params.id)) return sendError(response, 400, 'Task ID is invalid.')

  try {
    const task = await Task.findOneAndDelete({ _id: request.params.id, user: request.userId })
    if (!task) return sendError(response, 404, 'Task not found.')
    return response.status(200).json({ success: true, message: 'Task deleted.' })
  } catch (error) {
    return handleTaskError(error, response)
  }
}
