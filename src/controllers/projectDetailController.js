const db = require("../configs/db");

const getProjectInYear = (req, res) => {
  const paramsBinding = [req.params.year];
  let querySQL = `
    select count(p.project_id) as projectNum  
    from project p
    inner join project_detail pd on p.project_det_id = pd.project_det_id 
    inner join project_type pt on pd.project_type_id = pt.project_type_id
    inner join revenue r on p.revenue_id = r.revenue_id
    inner join revenue_detail rd on r.revenue_id = rd.revenue_id
    where SUBSTRING(rd.withdraw_date,1,4) = ? and rd.status = 'RECEIVE' ; 
  `

  try {
    // get users by query string
    return db.query(querySQL, paramsBinding, (error, results) => {
      console.log(error);

      if (error) res.sendStatus(500);

      return res.send(results[0]);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const getProjectByID = (req, res) => {
  const paramsBinding = [req.params.project_id];
  let querySQL = `
    select pd.project_det_id as project_id, pd.project_number , pd.project_name , pt.project_type_id , pd.pact_start_date , pd.pact_end_date , sum(price) as project_total
    , pd.pact_id , pd.employer_name, pd.employer_type, pd.project_value 
    from project p
    inner join project_detail pd on p.project_det_id = pd.project_det_id 
    inner join project_type pt on pd.project_type_id = pt.project_type_id
    inner join revenue r on p.revenue_id = r.revenue_id
    inner join revenue_detail rd on r.revenue_id = rd.revenue_id
    where p.project_det_id = ? ; 
  `;

  try {
    // get users by query string
    return db.query(querySQL, paramsBinding, (error, results) => {
      console.log(error);

      if (error) res.sendStatus(500);

      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const getProjects = (req, res) => {
  const paramsBinding = [];
  let querySQL = `
    select pd.project_number , pd.project_number , pt.project_type_name 
    , pd.pact_start_date , pd.pact_end_date, pd.project_name, pd.project_value
    , p.project_id , p.project_det_id , p.revenue_id , p.expenditure_id, p.predict_revenue_id , p.predict_expenditure_id
    from project p
    inner join project_detail pd on p.project_det_id = pd.project_det_id 
    inner join project_type pt on pd.project_type_id = pt.project_type_id
    where 1=1 
  `;
  const datas = [
    { key: "pd.project_number", value: req.query.project_number },
    { key: "pd.project_name", value: req.query.project_name },
    { key: "pt.project_type_name", value: req.query.project_type_name },
    { key: "pd.pact_start_date", value: req.query.pact_start_date },
    { key: "pd.pact_end_date", value: req.query.pact_end_date }
  ];

  datas.map(data => {
    if (data.value) {
      querySQL = querySQL + ` and ${data.key} = ? `;
      paramsBinding.push(data.value);
    }
  });
  // end statemant
  querySQL = querySQL + ";";

  try {
    // get users by query string
    return db.query(querySQL, paramsBinding, (error, results) => {
      // console.log(error);

      if (error) res.sendStatus(500);

      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const createProject = (req, res) => {
  const queryGetMaxProjectId = `
    select ( max(project_id) + 1 ) as id_now
    from project;
  `;
  const queryInsertProjectDatail = `
    INSERT INTO ccw.project_detail
    (project_det_id,project_number, project_name, project_type_id, pact_id, pact_start_date, pact_end_date, 
    employer_name, employer_type, project_value) 
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const queryInsertProject = `
    INSERT INTO ccw.project
    (project_id, project_det_id, revenue_id, expenditure_id, predict_revenue_id, 
    predict_expenditure_id, create_by, edit_by)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const queryInsertRevenue = `
    INSERT INTO ccw.revenue
    (revenue_id, revenue_det_id)
    VALUES(?, ?);
  `;
  const queryInsertExpenditure = `
    INSERT INTO ccw.expenditure
    (expenditure_id, expenditure_det_id)
    VALUES(?, ?);
  `;
  const queryPredictInsertRevenue = `
    INSERT INTO ccw.predict_revenue
    (predict_revenue_id)
    VALUES(?);
  `;
  const queryInsertPredictExpenditure = `
    INSERT INTO ccw.predict_expenditure
    (predict_expenditure_id)
    VALUES(?);
  `;

  try {
    // get connection
    db.getConnection((error, connection) => {
      console.log("err 1", error);
      if (error) res.sendStatus(500);
      // begin transaction
      connection.beginTransaction(err => {
        console.log("err 2", error);
        if (error) res.sendStatus(500);
        // get max id + 1 of user-detail table
        connection.query(
          queryGetMaxProjectId,
          (error, resultsByMaxProjectId) => {
            console.log("err 3", error);

            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });

            console.log("resultsByMaxProjectId", resultsByMaxProjectId);
            const idNow = resultsByMaxProjectId[0]["id_now"] || 1;
            // get duplicate username in user table

            const paramsBindingProjectDetail = [
              idNow,
              req.body.project_number,
              req.body.project_name,
              req.body.project_type_id,
              req.body.pact_id,
              req.body.pact_start_date,
              req.body.pact_end_date,
              req.body.employer_name,
              req.body.employer_type,
              req.body.project_value
            ];
            // insert user detail
            connection.query(
              queryInsertProjectDatail,
              paramsBindingProjectDetail,
              (error, resultsByProjectDatail) => {
                console.log("err 4", error);
                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                const paramsBindingProject = [
                  idNow,
                  idNow,
                  idNow,
                  idNow,
                  idNow,
                  idNow,
                  req.body.create_by,
                  ""
                ];
                connection.query(queryInsertRevenue, [idNow, ""], error => {
                  console.log("err 6", error);
                  if (error)
                    return connection.rollback(() => {
                      res.sendStatus(500);
                    });
                  connection.query(
                    queryInsertExpenditure,
                    [idNow, ""],
                    error => {
                      console.log("err 7", error);
                      if (error)
                        return connection.rollback(() => {
                          res.sendStatus(500);
                        });
                      // insert
                      connection.query(
                        queryPredictInsertRevenue,
                        [idNow],
                        err => {
                          connection.query(
                            queryInsertPredictExpenditure,
                            [idNow],
                            err => {
                              connection.query(
                                queryInsertProject,
                                paramsBindingProject,
                                (error, resultsByProject) => {
                                  console.log("err 5", error);
                                  if (error)
                                    return connection.rollback(() => {
                                      res.sendStatus(500);
                                    });
                                  // commit transaction

                                  connection.commit(error => {
                                    if (error)
                                      return connection.rollback(() => {
                                        res.sendStatus(500);
                                      });

                                    connection.destroy();
                                    return res.sendStatus(201);
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const updateProject = (req, res) => {
  const queryUpdateProject = `
    UPDATE ccw.project 
    SET edit_by= ?
    WHERE project_id= ? 
  `;
  const queryUpdateProjectDetail = `
    UPDATE ccw.project_detail
    SET project_number= ?, project_name= ?, project_type_id= ?, pact_id= ?, pact_start_date= ?, pact_end_date= ?, employer_name= ?,
    project_value= ?
    WHERE project_det_id= ? ;
  `;

  const updateRevenueDetail = `
    UPDATE ccw.revenue_detail 
    SET price= ? 
    WHERE revenue_id = ?
  `;

  const paramsBindingProjectDetail = [
    req.body.project_number,
    req.body.project_name,
    req.body.project_type_id,
    req.body.pact_id,
    req.body.pact_start_date,
    req.body.pact_end_date,
    req.body.employer_name,
    req.body.project_value,
    Number(req.params.project_id)
  ];

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      console.log("err 1", error);
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });
      // begin transaction
      connection.beginTransaction(error => {
        console.log("err 2", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });
        // update project detail
        connection.query(
          queryUpdateProjectDetail,
          paramsBindingProjectDetail,
          (error, resultsProjectDetail) => {
            console.log("err 3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            connection.query(
              queryUpdateProject,
              [req.body.edit_by, Number(req.params.project_id)],
              error => {
                console.log("err 4", error);
                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                
                // TODO
                console.log('update')
                console.log(req.params.revenue)
                console.log(typeof req.params.revenue)
                console.log('update')
                  
                // update project
                connection.commit(error => {
                  console.log("err 4", error);
                  if (error)
                    return connection.rollback(() => {
                      res.sendStatus(500);
                    });

                  connection.destroy();
                  return res.sendStatus(200);
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const deleteProject = (req, res) => {
  const queryDeleteRevenueDetail = `
    DELETE FROM ccw.revenue_detail
    WHERE revenue_id = ?;
  `;
  const queryDeleteRevenue = `
    DELETE FROM ccw.revenue
    WHERE revenue_id = ?;
  `;
  const queryDeleteExpenditureDetail = `
    DELETE FROM ccw.expenditure_detail
    WHERE expenditure_id = ?;
  `;
  const queryDeleteExpenditure = `
    DELETE FROM ccw.expenditure
    WHERE expenditure_id = ?;
  `;
  const queryDeleteProjectDetail = `
    DELETE FROM ccw.project_detail
    WHERE project_det_id = ?;
  `;
  const queryDeletePredictRev = `
    DELETE FROM ccw.predict_revenue
    WHERE predict_revenue_id = ?;
  `;
  const queryDeletePredictRevDetail = `
    DELETE FROM ccw.predict_revenue_detail
    WHERE predict_revenue_id = ?;
  `;
  const queryDeletePredictExp = `
    DELETE FROM ccw.predict_expenditure
    WHERE predict_expenditure_id = ?;
  `;
  const queryDeletePredictExpDetail = `
    DELETE FROM ccw.predict_expenditure_detail
    WHERE predict_expenditure_id = ?;
  `;
  const queryDeletePeoject = `
    DELETE FROM ccw.project
    WHERE project_id = ?;
  `;

  const {
    project_id,
    revenue_id,
    expenditure_id,
    predict_revenue_id,
    predict_expenditure_id
  } = req.params;

  try {
    return db.getConnection((error, connection) => {
      console.log("err 1", error);
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });

      connection.beginTransaction(error => {
        console.log("err 2", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });
        connection.query(queryDeletePeoject, [project_id], error => {
          console.log("err 3", error);
          if (error)
            return connection.rollback(() => {
              res.sendStatus(500);
            });

          connection.query(queryDeleteProjectDetail, [project_id], error => {
            console.log("err 4", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });

            // connection.query(queryDeleteExpenditureDetail, [ expenditure_id ], (error) => {
            connection.query(queryDeleteRevenue, [revenue_id], error => {
              console.log("err 5", error);
              if (error)
                return connection.rollback(() => {
                  res.sendStatus(500);
                });

              connection.query(
                queryDeleteRevenueDetail,
                [revenue_id],
                error => {
                  console.log("err 6", error);
                  if (error)
                    return connection.rollback(() => {
                      res.sendStatus(500);
                    });

                  connection.query(
                    queryDeleteExpenditure,
                    [expenditure_id],
                    error => {
                      console.log("err 7", error);
                      if (error)
                        return connection.rollback(() => {
                          res.sendStatus(500);
                        });

                      connection.query(
                        queryDeleteExpenditureDetail,
                        [expenditure_id],
                        error => {
                          console.log("err 8", error);
                          if (error)
                            return connection.rollback(() => {
                              res.sendStatus(500);
                            });
                          connection.query(
                            queryDeletePredictExpDetail,
                            [predict_expenditure_id],
                            error => {
                              console.log("err 9", error);
                              if (error)
                                return connection.rollback(() => {
                                  res.sendStatus(500);
                                });
                              connection.query(
                                queryDeleteExpenditure,
                                [predict_expenditure_id],
                                error => {
                                  console.log("err 8", error);
                                  if (error)
                                    return connection.rollback(() => {
                                      res.sendStatus(500);
                                    });
                                  connection.query(
                                    queryDeletePredictRevDetail,
                                    [predict_revenue_id],
                                    error => {
                                      console.log("err 9", error);
                                      if (error)
                                        return connection.rollback(() => {
                                          res.sendStatus(500);
                                        });
                                      connection.query(
                                        queryDeletePredictRev,
                                        [predict_revenue_id],
                                        error => {
                                          console.log("err 10", error);
                                          if (error)
                                            return connection.rollback(() => {
                                              res.sendStatus(500);
                                            });

                                          // final
                                          connection.commit(error => {
                                            console.log("err 9", error);
                                            if (error)
                                              return connection.rollback(() => {
                                                res.sendStatus(500);
                                              });

                                            connection.destroy();
                                            return res.sendStatus(200);
                                          });
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

// TODO
const countProjectInMount = (req, res) => {};

module.exports = {
  getProjectInYear,
  getProjectByID,
  getProjects,
  createProject,
  updateProject,
  deleteProject
};
