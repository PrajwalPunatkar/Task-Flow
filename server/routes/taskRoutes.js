import { Router } from 'express'
import authenticate from '../middleware/authMiddleware.js'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js'

const router = Router()

router.use(authenticate)
router.route('/').post(createTask).get(listTasks)
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask)

export default router
