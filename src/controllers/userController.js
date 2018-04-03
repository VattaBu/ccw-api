const db = require('../configs/db');

const getUsers = ((req, res) => {
  const paramsBinding = [];
  let querySQL = `
    select u.username, u.password , r.role_name , ud.name , ud.lastname , ud.tel , ud.email , ud.address, ud.user_det_id, r.role_id
    from user u
    inner join user_detail ud on u.user_det_id = ud.user_det_id
    inner join role r on u.role_id = r.role_id
    where 1=1
  `;
  const datas = [
    { key: 'u.username', value: req.query.username },
    { key: 'r.role_id', value: req.query['role_id'] },
    { key: 'ud.name', value: req.query.name },
    { key: 'ud.lastname', value: req.query.lastname },
    { key: 'ud.tel', value: req.query.tel },
    { key: 'ud.email', value: req.query.email },
    { key: 'ud.address', value: req.query.address },
    { key: 'ud.del_flag', value: 'N' },
    { key: 'u.del_flag', value: 'N' },
  ];

  datas.map((data) => {
    if (data.value) {
      querySQL = querySQL + ` and ${data.key} = ? `;
      paramsBinding.push(data.value);
    }
  });
  // end statemant
  querySQL = querySQL + ';';

  try {
    // get users by query string
    return db.query(querySQL, paramsBinding, (error, results) => {
      if (error) res.sendStatus(500);
  
      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

const getUsernamePassword = () => new Promise((resolve, reject) => {
  try {
    let querySQL = `
      select username, password, role_id, del_flag 
      from user;
    `;
    return db.query(querySQL, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(JSON.stringify(results)));
      }
    });
  } catch (error) {
    reject(error);
  }
});

const createUser = ((req, res) => {
  const queryGetMaxUserId = `
    select ( max(user_det_id) + 1 ) as id_now
    from user_detail ;
  `;
  const queryDuplicateUser = `
    select COUNT(username) as Cnt 
    from user u
    where 1=1
    and u.username = ? ;
  `;
  const queryInsertUserDatail = `
    INSERT INTO ccw.user_detail
    (user_det_id, name, lastname, tel, email, address, del_flag)
    VALUES(?, ? , ? , ? , ? , ? , ?);
  `;
  const queryInsertUser = `
    INSERT INTO ccw.\`user\`
    (username, password, user_det_id, role_id, del_flag)
    VALUES(?, ?, ? , ? , ?);
  `;

  try {
    // get connection
    db.getConnection((error, connection) => {
      if (error) res.sendStatus(500);
      // begin transaction
      connection.beginTransaction((err) => {
        if (error) res.sendStatus(500);
        // get max id + 1 of user-detail table
        connection.query(queryGetMaxUserId, (error, resultsByMaxUserId) => {
          if (error) return connection.rollback(() => { res.sendStatus(500); });
          const idNow = resultsByMaxUserId[0]['id_now'] || 1;
          // get duplicate username in user table
          connection.query(queryDuplicateUser, [ req.body.username ], (error, resultsByduplicateUser) => {
            if (error) return connection.rollback(() => { res.sendStatus(500); });
            if (resultsByduplicateUser.Cnt > 0) return connection.rollback(() => {
              res.sendStatus(400);
            });
            const paramsBindingUserDetail = [
              idNow,
              req.body.name,
              req.body.lastname,
              req.body.tel,
              req.body.email,
              req.body.address,
              'N',
            ];
            // insert user detail
            connection.query(queryInsertUserDatail, paramsBindingUserDetail,(error, resultsByUserDatail) => {
              if (error) return connection.rollback(() => { res.sendStatus(500); });
              const paramsBindingUser = [
                req.body.username,
                req.body.password,
                idNow,
                req.body['role_id'],
                'N'
              ];
              // insert user
              connection.query(queryInsertUser, paramsBindingUser,(error, resultsByUser) => {
                if (error) return connection.rollback(() => { res.sendStatus(500); });
                // commit transaction
                connection.commit((error) => {
                  if (error) return connection.rollback(() => { res.sendStatus(500); });
  
                  connection.destroy();
                  return res.sendStatus(201);
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
});

const updateUser = ((req, res) => {
  const queryUpdateUserDetail = `
    UPDATE ccw.user_detail
    SET name= ?, lastname= ?, tel= ?, email= ?, address= ?
    WHERE user_det_id= ? ;
  `;
  const queryUpdateUser = `
    UPDATE ccw.\`user\`
    SET password= ?, user_det_id= ?, role_id= ?
    WHERE username= ? ;
  `;
  const paramsBindingUserDetail = [
    req.body.name,
    req.body.lastname,
    req.body.tel,
    req.body.email,
    req.body.address,
    req.params['user_det_id'],
  ];
  const paramsBindingUser = [
    req.body.password,
    req.params['user_det_id'],
    req.body['role_id'],
    req.params.username,
  ];

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      if (error) return connection.rollback(() => { res.sendStatus(500); });
      // begin transaction
      connection.beginTransaction((error) => {
        if (error) return connection.rollback(() => { res.sendStatus(500); });
        // update user detail
        connection.query(queryUpdateUserDetail, paramsBindingUserDetail, (error, resultsUserDetail) => {
          if (error) return connection.rollback(() => { res.sendStatus(500); });
          // update user
          connection.query(queryUpdateUser, paramsBindingUser, (error, resultsUser) => {
            if (error) return connection.rollback(() => { res.sendStatus(500); });
            // commit transaction
            connection.commit((error) => {
              if (error) return connection.rollback(() => { res.sendStatus(500); });
  
              connection.destroy();
              return res.sendStatus(200);
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
});

const deleteUser = ((req, res) => {
  const queryDeleteUserDetail = `
    UPDATE ccw.user_detail
    SET del_flag= 'Y'
    WHERE user_det_id= ?;
  `;
  const queryDeleteUser = `
    UPDATE ccw.\`user\`
    SET del_flag= 'Y'
    WHERE username= ?;
  `;
  try {
    return db.getConnection((error, connection) => {
      if (error) return connection.rollback(() => { res.sendStatus(500); });
      connection.beginTransaction((error) => {
        if (error) return connection.rollback(() => { res.sendStatus(500); });
  
        connection.query(queryDeleteUserDetail, [ req.params['user_det_id'] ], (error, resultsUserDetail) => {
          if (error) return connection.rollback(() => { res.sendStatus(500); });
  
          connection.query(queryDeleteUser, [ req.params.username ], (error, resultsUser) => {
            if (error) return connection.rollback(() => { res.sendStatus(500); });
    
            connection.commit((error) => {
              if (error) return connection.rollback(() => { res.sendStatus(500); });

              connection.destroy();
              return res.sendStatus(200);
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
});

module.exports = {
  getUsers,
  getUsernamePassword,
  createUser,
  updateUser,
  deleteUser,
};
