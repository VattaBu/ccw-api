const db = require('../configs/db');

const getAllRole = ((req, res) => {
  try {
    return db.query(`
      select role_id as id , role_name as value
      from role r
    `, (error, results) => {
      if (error) {
        res.sendStatus(500);
      }

      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);  
  }
});

module.exports = {
  getAllRole,
};
