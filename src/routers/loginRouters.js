const { Router } = require('express');
const { login } = require('../controllers/loginController');
const router = new Router();

router.route('/login').post(login);

module.exports = router;
