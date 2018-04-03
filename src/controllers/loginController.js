const { getUsernamePassword } = require('./userController');

const login = async (req, res) => {
  try { 
    let isMember = false;
    
    const users = await getUsernamePassword();
    if (!users || !users.length) return;

    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      if (user.username !== req.body.username) continue;
      if (user.password !== req.body.password) continue;
      if (user['del_flag'] !== 'N') continue;
      return res.send({
        username: user.username,
        roleID: user.role_id,
      });
    }

    res.sendStatus(400);
  } catch (error) {   
    res.sendStatus(400);
  }
}


module.exports = {
  login
};
