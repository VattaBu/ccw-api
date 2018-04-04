const { Router } = require('express');
const {
  getProjectByID,
  getProjectInYear,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectDetailController');
const router = new Router();

router.route('/projects').get(getProjects);
router.route('/projects-in-year/:year').get(getProjectInYear);
router.route('/project/:project_id').get(getProjectByID);
router.route('/project').post(createProject);
router.route('/project/:project_id').put(updateProject);
router.route('/project/:project_id/:revenue_id/:expenditure_id/:predict_revenue_id/:predict_expenditure_id').delete(deleteProject);

module.exports = router;