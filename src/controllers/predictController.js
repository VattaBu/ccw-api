const db = require("../configs/db");

const getPredictRev = (req, res) => {
  let querySQL = `
    select distinct p.predict_revenue_id, pd.period, pd.price 
    from predict_revenue p
    inner join predict_revenue_detail pd on p.predict_revenue_det_id = pd.predict_revenue_det_id 
    order by pd.period;
  `;

  try {
    // get users by query string
    return db.query(querySQL, (error, results) => {
      console.log(error);

      if (error) res.sendStatus(500);

      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const getPredictExp = (req, res) => {
  let querySQL = `
    select distinct e.predict_expenditure_id, ed.period, ed.price 
    from predict_expenditure e
    inner join predict_expenditure_detail ed on e.predict_expenditure_det_id = ed.predict_expenditure_det_id 
    order by ed.period;
  `;

  try {
    // get users by query string
    return db.query(querySQL, (error, results) => {
      console.log(error);

      if (error) res.sendStatus(500);

      return res.send(results);
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const createPredictRev = (req, res) => {
  console.log('in fn')
  const queryGetMaxPredictRevId = `
      select ( max(predict_revenue_det_id) + 1 ) as id_now
      from predict_revenue_detail;
    `;

  const queryInsertPredictRevDatail = `
    INSERT INTO ccw.predict_revenue_detail
    (predict_revenue_det_id, predict_revenue_id, 
    period, price) 
    VALUES(?, ?, ?, ?);
  `;

  try {
    // get connection
    db.getConnection((error, connection) => {
      console.log("err 1", error);
      if (error) res.sendStatus(500);
      // begin transaction
      connection.beginTransaction(error => {
        console.log("err 2", error);
        if (error) res.sendStatus(500);
        // get max id + 1 of revenue-detail table
        connection.query(
          queryGetMaxPredictRevId,
          (error, resultsByMaxRevenueId) => {
            console.log("err 3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            const idNow = resultsByMaxRevenueId[0]["id_now"] || 1;
            const paramsBindingRevExpDetail = [
              idNow,
              req.body.predict_revenue_id,
              req.body.period,
              req.body.price,
            ];
            // insert revenue detail
            connection.query(
              queryInsertPredictRevDatail,
              paramsBindingRevExpDetail,
              (error, resultsByRevenueDatail) => {
                console.log("err 4", error);

                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                // insert revenue
                connection.commit(error => {
                  console.log("err 5", error);

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
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const createPredictExpense = (req, res) => {
  const queryGetMaxPredictExpId = `
      select ( max(predict_expenditure_det_id) + 1 ) as id_now
      from predict_expenditure_detail;
    `;

  const queryInsertPredictExpDatail = `
    INSERT INTO ccw.predict_expenditure_detail
    (predict_expenditure_det_id, predict_expenditure_id, 
    period, price) 
    VALUES(?, ?, ?, ?);
  `;

  try {
    // get connection
    db.getConnection((error, connection) => {
      console.log("err 1", error);
      if (error) res.sendStatus(500);
      // begin transaction
      connection.beginTransaction(error => {
        console.log("err 2", error);
        if (error) res.sendStatus(500);
        // get max id + 1 of revenue-detail table
        connection.query(
          queryGetMaxPredictExpId,
          (error, resultsByMaxExpenditureId) => {
            console.log("err 3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            const idNow = resultsByMaxExpenditureId[0]["id_now"] || 1;
            const paramsBindingRevExpDetail = [
              idNow,
              req.body.predict_expenditure_id,
              req.body.period,
              req.body.price,
            ];
            // insert Expenditure detail
            connection.query(
              queryInsertPredictExpDatail,
              paramsBindingRevExpDetail,
              (error, resultsByExpenditureDatail) => {
                console.log("err 4", error);

                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                // insert Expenditure
                connection.commit(error => {
                  console.log("err 5", error);

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
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const getPredictRevByID = (req, res) => {
  const paramsBinding = [req.params.predict_revenue_id];
  let querySQL = `
    select distinct p.predict_revenue_id, pd.predict_revenue_det_id, pd.period, pd.price 
    from predict_revenue p
    inner join predict_revenue_detail pd on p.predict_revenue_id = pd.predict_revenue_id  
    where p.predict_revenue_id = ?
    order by pd.period;
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

const getPredictExpByID = (req, res) => {
  const paramsBinding = [req.params.predict_expenditure_id];
  let querySQL = `
    select distinct e.predict_expenditure_id, ed.predict_expenditure_det_id, ed.period, ed.price 
    from predict_expenditure e
    inner join predict_expenditure_detail ed on e.predict_expenditure_id = ed.predict_expenditure_id 
    where e.predict_expenditure_id = ?
    order by ed.period;
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

const updatePredictRev = (req, res) => {
  const queryUpdateRevenueDetail = `
    UPDATE ccw.predict_revenue_detail
    SET predict_revenue_id= ?, period= ?, price= ? 
    WHERE predict_revenue_det_id= ? ;
  `;
  const paramsBindingRevenueDetail = [
    req.body.predict_revenue_id,
    req.body.period,
    req.body.price,
    req.params.predict_revenue_det_id,
  ];

  console.log(req.body)
  console.log(req.params)

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });
      // begin transaction
      connection.beginTransaction(error => {
        console.log("1", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });
        // update
        connection.query(
          queryUpdateRevenueDetail,
          paramsBindingRevenueDetail,
          (error, resultsRevenueDetail) => {
            console.log("2", error);

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
              return res.sendStatus(200);
            });
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const updatePredictExp = (req, res) => {
  const queryUpdateExpenditureDetail = `
    UPDATE ccw.predict_expenditure_detail
    SET predict_expenditure_id= ?, period= ?, price= ? 
    WHERE predict_expenditure_det_id= ? ;
  `;
  const paramsBindingExpenditureDetail = [
    req.body.predict_expenditure_id,
    req.body.period,
    req.body.price,
    req.params.predict_expenditure_det_id,
  ];

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });
      // begin transaction
      connection.beginTransaction(error => {
        console.log("1", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });
        // update
        connection.query(
          queryUpdateExpenditureDetail,
          paramsBindingExpenditureDetail,
          (error, resultsExpenditureDetail) => {
            console.log("2", error);

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
              return res.sendStatus(200);
            });
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const deletePredictRevDetail = (req, res) => {
  const queryDeletePredictRevenueDetail = `
    DELETE FROM ccw.predict_revenue_detail
    WHERE predict_revenue_det_id = ?;
  `;
  const { predict_revenue_det_id } = req.params;

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });
      // begin transaction
      connection.beginTransaction(error => {
        console.log("1", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });

        connection.query(
          queryDeletePredictRevenueDetail,
          [predict_revenue_det_id],
          error => {
            console.log("2", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });

            // commit transaction
            connection.commit(error => {
              console.log("3", error);
              if (error)
                return connection.rollback(() => {
                  res.sendStatus(500);
                });

              connection.destroy();
              return res.sendStatus(200);
            });
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const deletePredictExpDetail = (req, res) => {
  const queryDeletePredictExpenseDetail = `
    DELETE FROM ccw.predict_expenditure_detail
    WHERE predict_expenditure_det_id = ?;
  `;
  const { predict_expenditure_det_id } = req.params;

  try {
    // begin transection
    return db.getConnection((error, connection) => {
      if (error)
        return connection.rollback(() => {
          res.sendStatus(500);
        });
      // begin transaction
      connection.beginTransaction(error => {
        console.log("1", error);
        if (error)
          return connection.rollback(() => {
            res.sendStatus(500);
          });

        connection.query(
          queryDeletePredictExpenseDetail,
          [predict_expenditure_det_id],
          error => {
            console.log("2", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });

            // commit transaction
            connection.commit(error => {
              console.log("3", error);
              if (error)
                return connection.rollback(() => {
                  res.sendStatus(500);
                });

              connection.destroy();
              return res.sendStatus(200);
            });
          }
        );
      });
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

module.exports = {
  getPredictRev,
  getPredictExp,
  getPredictRevByID,
  getPredictExpByID,
  createPredictRev,
  createPredictExpense,
  deletePredictRevDetail,
  deletePredictExpDetail,
  updatePredictRev,
  updatePredictExp,
};
