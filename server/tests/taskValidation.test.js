import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateTaskCreate,
  validateTaskListQuery,
  validateTaskUpdate,
} from '../utils/taskValidation.js'

test('valid task input is trimmed and preserves allowed fields', () => {
  const result = validateTaskCreate({
    title: '  Prepare launch  ',
    description: '  Release checklist  ',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-12-31',
  })

  assert.equal(result.error, undefined)
  assert.equal(result.data.title, 'Prepare launch')
  assert.equal(result.data.description, 'Release checklist')
  assert.equal(result.data.status, 'in-progress')
  assert.equal(result.data.priority, 'high')
  assert.ok(result.data.dueDate instanceof Date)
})

test('task creation requires a non-empty title', () => {
  assert.equal(validateTaskCreate({ title: '  ' }).error, 'A task title is required.')
})

test('due dates must be real ISO calendar dates or timestamps', () => {
  assert.match(validateTaskCreate({ title: 'Review', dueDate: '2026-02-31' }).error, /valid date/)
  assert.match(validateTaskCreate({ title: 'Review', dueDate: 'tomorrow' }).error, /valid date/)
})

test('task fields reject invalid enums and client-supplied ownership', () => {
  assert.match(validateTaskCreate({ title: 'Review', status: 'blocked' }).error, /Status must be one of/)
  assert.match(validateTaskUpdate({ user: 'another-user' }).error, /cannot be set/)
})

test('task updates require at least one allowed field and allow clearing a due date', () => {
  assert.match(validateTaskUpdate({}).error, /at least one task field/)
  const result = validateTaskUpdate({ dueDate: null })
  assert.equal(result.error, undefined)
  assert.equal(result.data.dueDate, null)
})

test('task list query validates filters and caps page size', () => {
  const result = validateTaskListQuery({ status: 'pending', page: '2', limit: '500', search: '  launch  ' })
  assert.deepEqual(result.data, { status: 'pending', page: 2, limit: 100, search: 'launch' })
  assert.match(validateTaskListQuery({ status: 'blocked' }).error, /Status must be one of/)
  assert.match(validateTaskListQuery({ page: '0' }).error, /positive whole numbers/)
})
