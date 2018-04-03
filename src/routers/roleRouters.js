const { Router } = require('express');
const { getAllRole } = require('../controllers/roleController');
const router = new Router();

router.route('/roles').get(getAllRole);

module.exports = router;
