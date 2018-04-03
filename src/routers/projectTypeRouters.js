const { Router } = require('express');
const { getAllProjectType } = require('../controllers/projectTypeController');
const router = new Router();

router.route('/project-types').get(getAllProjectType);

module.exports = router;
