const router = require('express').Router()
const { AuthController, PlansController } = require('../controllers')

// Get *ALL* plans; this is Admin only
router.get('/', AuthController.isAdmin, PlansController.index)

// Get a specific plan; this is admin only
router.get('/:id', AuthController.isAdmin, PlansController.show)

// Get all plans for user (token must match user)
router.get('/user/:userId', AuthController.isThisUser, PlansController.index)

// Get a specific plan for a user (token must match user)
router.get('/:id/user/:userId', AuthController.isThisUser, PlansController.show)

// Get all items for a plan for a user (token must match user)
router.get('/:id/user/:userId/items/', AuthController.isThisUser, PlansController.getPlanItems)

// Create plan for a user (token must match user)
router.post('/user/:userId', AuthController.isThisUser, PlansController.create)

// Update plan for a user (token must match user)
router.put('/:id/user/:userId', AuthController.isThisUser, PlansController.update)

// Delete plan (for the current user token)
router.delete('/:id', AuthController.ownsThisPlan, PlansController.destroy)
// router.delete('/:id/user/:userId', AuthController.isThisUser, PlansController.destroy)

module.exports = router
