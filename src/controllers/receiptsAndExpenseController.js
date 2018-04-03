const db = require("../configs/db");
const idx = require("idx");
const { find, uniqBy } = require("lodash");

const mergeRecAndExp = (rec, exp) => {
  const month = [...rec, ...exp].map(data => data.month);
  const results = month.map(m => ({
    month: m,
    price_revenue: idx(rec, _ => find(_, { month: m }).price_revenue) || 0,
    price_expenditure:
      idx(exp, _ => find(_, { month: m }).price_expenditure) || 0
  }));

  return uniqBy(results, "month");
};

const addIndex = data => data.map((d, i) => ({ ...d, index: i }));

const getTotal = data => {
  const results = [...data];
  for (let i = 0; i < results.length; i++) {
    const prevTotal = i === 0 ? 0 : results[i - 1].total;
    const total =
      prevTotal + results[i].price_revenue - results[i].price_expenditure;
    results[i].total = total;
  }

  return results;
};

// compose function
const reFormatRecAndExp = (rec, exp) =>
  getTotal(addIndex(mergeRecAndExp(rec, exp)));

const getReceipts = year => {
  return new Promise((resolve, reject) => {
    // const querySQL = `
    //   select *
    //   from ccw.revenue r
    //   inner join ccw.revenue_detail rd on r.revenue_id = rd.revenue_id
    //   where SUBSTRING(rd.withdraw_date,1,4) = ?
    //   order by rd.withdraw_date;
    // `;
    const querySQL = `
      select month(rd.withdraw_date) as month, sum(rd.price) as price_revenue  
      from ccw.revenue r
      inner join ccw.revenue_detail rd on r.revenue_id = rd.revenue_id
      where SUBSTRING(rd.withdraw_date,1,4) = ? and rd.status = 'RECEIVE' 
      group by month(rd.withdraw_date)
      order by month(rd.withdraw_date);
    `;
    const paramsBinding = [year];

    try {
      db.query(querySQL, paramsBinding, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getExpense = year => {
  return new Promise((resolve, reject) => {
    // const querySQL = `
    //   select *
    //   from ccw.expenditure e
    //   inner join ccw.expenditure_detail ed on e.expenditure_id = ed.expenditure_id
    //   where SUBSTRING(ed.expenditure_date,1,4) = ?
    //   order by ed.expenditure_date;
    // `;
    const querySQL = `
      select month(ed.expenditure_date) as month, sum(ed.price_total) as price_expenditure 
      from ccw.expenditure e
      inner join ccw.expenditure_detail ed on e.expenditure_id = ed.expenditure_id
      where SUBSTRING(ed.expenditure_date,1,4) = ?
      group by month(ed.expenditure_date)
      order by month(ed.expenditure_date);
    `;
    const paramsBinding = [year];
    try {
      db.query(querySQL, paramsBinding, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getReceiptsAndExpense = async (req, res) => {
  try {
    const receipts = await getReceipts(req.params.year);
    const expense = await getExpense(req.params.year);
    const results = reFormatRecAndExp(receipts, expense) || [];
    return res.send(results);
  } catch (error) {
    return res.sendStatus(400);
  }
};

const getReceiptsAndExpenseByMonth = async (req, res) => {
  const querySQL = `
    select *
    from ccw.project p
    inner join ccw.project_detail pd on p.project_det_id = pd.project_det_id
    inner join ccw.revenue r on p.revenue_id = r.revenue_id
    inner join ccw.expenditure e on p.expenditure_id = e.expenditure_id;
  `;
  try {
    return db.query(querySQL, async (error, results) => {
      if (error) return res.sendStatus(500);
      if (!results) return res.sendStatus(500);
      const newResults = [];
      const { year, month } = req.params;

      for(let i = 0; i < results.length; i++) {
        // newResults
        const r = [...results][i];
        const newR = {
          ...r,
          revenue_det_id: r
            .revenue_det_id
            .split(',')
            .filter(id => !!id && id !== 0),
          expenditure_det_id: r
            .expenditure_det_id
            .split(',')
            .filter(id => !!id && id !== 0)
        };
        newR.revenue = await Promise
          .all(newR.revenue_det_id.map(id => getReceiptsByIDNonRes(id, month, year)));
        newR.expenditure = await Promise
          .all(newR.expenditure_det_id.map(id => getExpenseByIDNonRes(id, month, year)));
        
        newR.revenue = newR.revenue.filter(r => !!r);
        newR.expenditure = newR.expenditure.filter(e => !!e);
        newR.revenue = newR.revenue.map(r => ({ ...r, project_value: newR.project_value || 0 }));
        newR.expenditure = newR.expenditure.map(e => ({ ...e, project_value: newR.project_value || 0 }));

        newResults.push(newR);
        // return newR;
      }

      return res.send(newResults);
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

const getReceiptsByIDNonRes = (id, month, year) => new Promise((resolve, reject) => {
  const monthStr = ('0' + month).substr(-2);
  const paramsBinding = [id, monthStr, year];
  let querySQL = `
    select distinct r.revenue_id , rd.revenue_det_id , rd.period, rd.withdraw_date , rd.predict_date 
    , rd.withdraw_date_true , rd.price_per , rd.price , rd.remark , rd.status
    from revenue r
    inner join revenue_detail rd on r.revenue_id = rd.revenue_id
    where rd.revenue_det_id = ? and SUBSTRING(rd.withdraw_date, 6, 2) = ? and SUBSTRING(rd.withdraw_date, 1, 4) = ? 
    order by rd.period;   
  `;

  try {
    // get users by query string
    return db.query(querySQL, paramsBinding, (error, results) => {
      console.log(error);

      if (error){
        reject(error);
        return;
      }
      // console.log('Non res =================')
      // console.log('monthStr ', monthStr)
      // console.log('month ', month)
      // console.log('year', year)
      // console.log(results);
      // console.log('Non res =================')
      if (results.length) {
        resolve(results[0]);
        return;
      } else {
        resolve(null);
        return;
      }
    });
  } catch (error) {
    console.log(error);
    reject(500);
    return;
  }
});

const getExpenseByIDNonRes = (id, month, year) => new Promise((resolve, reject) => {
  const monthStr = ('0' + month).substr(-2);
  const paramsBinding = [id, monthStr, year];
  let querySQL = `
    select distinct e.expenditure_id , ed.expenditure_det_id , ed.period , ed.expenditure_item 
    , ed.amount ,ed.price_per_unit, ed.price_total, ed.remark, ed.expenditure_date, ed.tax
    from expenditure e
    inner join expenditure_detail ed on e.expenditure_id = ed.expenditure_id 
    where ed.expenditure_det_id = ? and SUBSTRING(ed.expenditure_date, 6, 2) = ? and SUBSTRING(ed.expenditure_date, 1, 4) = ? 
    order by ed.period;
  `;

  try {
    // get users by query string
    db.query(querySQL, paramsBinding, (error, results) => {
      console.log(error);

      if (error) {
        reject(error);
        return;
      };

      if (results.length) {
        resolve(results[0]);
        return;
      } else {
        resolve(null);
        return;
      }
    });
  } catch (error) {
    console.log(error);
    reject(error);
    return;
  }
});

const getReceiptsByID = (req, res) => {
  const paramsBinding = [req.params.receipts_id];
  let querySQL = `
    select distinct r.revenue_id , rd.revenue_det_id , rd.period, rd.withdraw_date , rd.predict_date 
    , rd.withdraw_date_true , rd.price_per , rd.price , rd.remark , rd.status
    from revenue r
    inner join revenue_detail rd on r.revenue_id = rd.revenue_id
    where r.revenue_id = ? 
    order by rd.period;   
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

const getExpenseByID = (req, res) => {
  const paramsBinding = [req.params.expense_id];
  let querySQL = `
    select distinct e.expenditure_id , ed.expenditure_det_id , ed.period , ed.expenditure_item 
    , ed.amount ,ed.price_per_unit, ed.price_total, ed.remark, ed.expenditure_date, ed.tax
    from expenditure e
    inner join expenditure_detail ed on e.expenditure_id = ed.expenditure_id 
    where e.expenditure_id = ?
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

const createReceipts = (req, res) => {
  const queryGetMaxRevenueId = `
    select ( max(revenue_det_id) + 1 ) as id_now
    from revenue_detail;
  `;
  const queryInsertRevenueDatail = `
    INSERT INTO ccw.revenue_detail
    (revenue_det_id, revenue_id, period, withdraw_date, predict_date, withdraw_date_true, price_per, price, remark, status)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const getRevenue = `
    select revenue_det_id
    from ccw.revenue
    where revenue_id= ?;
  `;
  const updateRevenue = `
    UPDATE ccw.revenue
    SET revenue_det_id= ?
    WHERE revenue_id= ? ;
  `;

  console.log(req.body)
  if (req.body.withdraw_date_true === 'Invalid date') {
    req.body.withdraw_date_true = null;
  }

  console.log('test save revenue')

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
          queryGetMaxRevenueId,
          (error, resultsByMaxRevenueId) => {
            console.log("err 3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            const idNow = resultsByMaxRevenueId[0]["id_now"] || 1;
            const paramsBindingUserDetail = [
              idNow,
              req.body.revenue_id,
              req.body.period,
              req.body.withdraw_date,
              req.body.predict_date,
              req.body.withdraw_date_true,
              req.body.price_per,
              req.body.price,
              req.body.remark,
              req.body.status
            ];
            // insert revenue detail
            connection.query(
              queryInsertRevenueDatail,
              paramsBindingUserDetail,
              (error, resultsByRevenueDatail) => {
                console.log("err 4", error);

                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                // insert revenue
                connection.query(
                  getRevenue,
                  [req.body.revenue_id],
                  (error, resultsRevenue) => {
                    console.log("err 5", error);

                    if (error)
                      return connection.rollback(() => {
                        res.sendStatus(500);
                      });
                    const paramsRevenue = [
                      `${resultsRevenue[0].revenue_det_id},${idNow}`,
                      req.body.revenue_id
                    ];
                    connection.query(
                      updateRevenue,
                      paramsRevenue,
                      (error, results) => {
                        console.log("err 6", error);

                        if (error)
                          return connection.rollback(() => {
                            res.sendStatus(500);
                          });
                        // commit transaction
                        connection.commit(error => {
                          console.log("err 7", error);

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
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const updateRevenue = (req, res) => {
  const queryUpdateRevenueDetail = `
    UPDATE ccw.revenue_detail
    SET revenue_id= ?, period= ?, withdraw_date= ?, predict_date= ?,
    withdraw_date_true= ?, price_per= ?, price= ?, remark= ?, status= ?
    WHERE revenue_det_id= ? ;
  `;
  const paramsBindingRevenueDetail = [
    req.body.revenue_id,
    req.body.period,
    req.body.withdraw_date,
    req.body.predict_date,
    req.body.withdraw_date_true,
    req.body.price_per,
    req.body.price,
    req.body.remark,
    req.body.status,
    req.params.revenue_det_id
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
          queryUpdateRevenueDetail,
          paramsBindingRevenueDetail,
          (error, resultsUserDetail) => {
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

const createExpense = (req, res) => {
//   INSERT INTO ccw.expenditure
// (expenditure_id, period, expenditure_item, expenditure_date, amount, price_per_unit, price_total, remark, status)
// VALUES(4, '1', 'ค่าใส่กรอบทัศนียภาพยื่นเสนองาน', '2560-10-03', 5, 2000, 10000, 'เงินฝากธนาคาร', NULL);
  const queryGetMaxExpenditureId = `
    select ( max(expenditure_det_id) + 1 ) as id_now
    from expenditure_detail;
  `;


  const queryInsertExpenditureDatail = `
    INSERT INTO ccw.expenditure_detail
    (expenditure_det_id, expenditure_id, period, 
    expenditure_item, expenditure_date, amount, tax, 
    price_per_unit, price_total, remark, status)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const getExpenditure = `
    select expenditure_det_id
    from ccw.expenditure
    where expenditure_id= ?;
  `;
  const updateExpenditure = `
    UPDATE ccw.expenditure
    SET expenditure_det_id= ?
    WHERE expenditure_id= ? ;
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
          queryGetMaxExpenditureId,
          (error, resultsByMaxExpenditureId) => {
            console.log("err 3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            const idNow = resultsByMaxExpenditureId[0]["id_now"] || 1;
            const paramsBindingExpenditureDetail = [
              idNow,
              req.body.expenditure_id,
              req.body.period, 
              req.body.expenditure_item,
              req.body.expenditure_date,
              req.body.amount,
              req.body.tax,
              req.body.price_per_unit,
              req.body.price_total,
              req.body.remark,
              null,
            ];
            // insert Expenditure detail
            connection.query(
              queryInsertExpenditureDatail,
              paramsBindingExpenditureDetail,
              (error, resultsByExpenditureDatail) => {
                console.log("err 4", error);

                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });
                // insert Expenditure
                connection.query(
                  getExpenditure,
                  [req.body.expenditure_id],
                  (error, resultsExpenditure) => {
                    console.log("err 5", error);

                    if (error)
                      return connection.rollback(() => {
                        res.sendStatus(500);
                      });
                    const paramsExpenditure = [
                      `${resultsExpenditure[0].expenditure_det_id},${idNow}`,
                      req.body.expenditure_id
                    ];
                    connection.query(
                      updateExpenditure,
                      paramsExpenditure,
                      (error, results) => {
                        console.log("err 6", error);

                        if (error)
                          return connection.rollback(() => {
                            res.sendStatus(500);
                          });
                        // commit transaction
                        connection.commit(error => {
                          console.log("err 7", error);

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
    });
  } catch (error) {
    console.log(error);
    // return res.sendStatus(500);
  }
};

const updateExpense = (req, res) => {
  const queryUpdateExpenditureDetail = `
    UPDATE ccw.expenditure_detail
    SET expenditure_id= ?, period= ?, 
    expenditure_item= ?, expenditure_date= ?, amount= ?, tax = ?, 
    price_per_unit= ?, price_total= ?, remark= ?, status= ?
    WHERE expenditure_det_id= ? ;
  `;
  const paramsBindingExpenditureDetail = [
    req.body.expenditure_id,
    req.body.period,
    req.body.expenditure_item,
    req.body.expenditure_date,
    req.body.amount,
    req.body.tax,
    req.body.price_per_unit,
    req.body.price_total,
    req.body.remark,
    req.body.status,
    req.params.expenditure_det_id,
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

const deleteReceiptsDetail = (req, res) => {
  const queryDeleteReceiptsDetail = `
    DELETE FROM ccw.revenue_detail
    WHERE revenue_det_id = ?;
  `;
  const queryGetReceipts = `
    SELECT revenue_det_id
    FROM ccw.revenue
    WHERE revenue_id= ?;
  `;
  const queryUpdateReceipts = `
    UPDATE ccw.revenue
    SET revenue_det_id= ?
    WHERE revenue_id= ? ;
  `;

  const { revenue_id, revenue_det_id } = req.params;
  console.log('revenue_id', revenue_id)
  console.log('revenue_det_id', revenue_det_id)
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
        connection.query(queryDeleteReceiptsDetail, [ revenue_det_id ], (error) => {
          console.log("2", error);
          if (error)
            return connection.rollback(() => {
              res.sendStatus(500);
            });

          connection.query(queryGetReceipts, [ revenue_id ], (error, result) => {
            console.log("3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            
            console.log('result', result);
            const newDetIDs = result[0]
              .revenue_det_id
              .split(',')
              .filter(detId => detId != revenue_det_id)
              .join(',');
            console.log('newDetIDs', newDetIDs);
              
              
            connection.query(queryUpdateReceipts, [ newDetIDs, revenue_id ], (error) => {
              console.log("4", error);
              if (error)
                return connection.rollback(() => {
                  res.sendStatus(500);
                });

              // commit transaction
              connection.commit(error => {
                console.log("5", error);
                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });

                connection.destroy();
                return res.sendStatus(200);
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
};

const deleteExpenseDetail = (req, res) => {
  const queryDeleteExpenseDetail = `
    DELETE FROM ccw.expenditure_detail
    WHERE expenditure_det_id = ?;
  `;
  const queryGetExpense = `
    SELECT expenditure_det_id
    FROM ccw.expenditure
    WHERE expenditure_id= ?;
  `;
  const queryUpdateExpense = `
    UPDATE ccw.expenditure
    SET expenditure_det_id= ?
    WHERE expenditure_id= ? ;
  `;

  const { expenditure_id, expenditure_det_id } = req.params;
  console.log('expenditure_id', expenditure_id)
  console.log('expenditure_det_id', expenditure_det_id)
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
        connection.query(queryDeleteExpenseDetail, [ expenditure_det_id ], (error) => {
          console.log("2", error);
          if (error)
            return connection.rollback(() => {
              res.sendStatus(500);
            });

          connection.query(queryGetExpense, [ expenditure_id ], (error, result) => {
            console.log("3", error);
            if (error)
              return connection.rollback(() => {
                res.sendStatus(500);
              });
            
            console.log('result', result);
            const newDetIDs = result[0]
              .expenditure_det_id
              .split(',')
              .filter(detId => detId != expenditure_det_id)
              .join(',');
            console.log('newDetIDs', newDetIDs);
              
              
            connection.query(queryUpdateExpense, [ newDetIDs, expenditure_id ], (error) => {
              console.log("4", error);
              if (error)
                return connection.rollback(() => {
                  res.sendStatus(500);
                });

              // commit transaction
              connection.commit(error => {
                console.log("5", error);
                if (error)
                  return connection.rollback(() => {
                    res.sendStatus(500);
                  });

                connection.destroy();
                return res.sendStatus(200);
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
};

module.exports = {
  getReceiptsAndExpense,
  getReceiptsAndExpenseByMonth,
  getReceiptsByID,
  getExpenseByID,
  createReceipts,
  updateRevenue,
  createExpense,
  updateExpense,
  deleteReceiptsDetail,
  deleteExpenseDetail,
};
