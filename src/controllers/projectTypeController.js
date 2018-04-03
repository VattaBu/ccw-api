const db = require('../configs/db');

const getAllProjectType = ((req, res) => {
  try {
    return db.query(`
      select project_type_id as id , project_type_name as value
      from project_type
    `, (error, results) => {
      if (error) {
        res.sendStatus(500);
      };

      return res.send(results);
    });
  } catch (error) {
   console.log(error);
   // return res.sendStatus(500); 
  }
});

module.exports = {
  getAllProjectType,
};
