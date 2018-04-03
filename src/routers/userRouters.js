const { Router } = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const router = new Router();

router.route('/users').get(getUsers);
router.route('/user').post(createUser);
router.route('/user/:username/:user_det_id').put(updateUser);
router.route('/user/:username/:user_det_id').delete(deleteUser);

module.exports = router;
