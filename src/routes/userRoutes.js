const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../validators/userValidator');
const { ROLES } = require('../config/constants');

// All user-management routes require admin role
router.use(protect, restrictTo(ROLES.ADMIN));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
