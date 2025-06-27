const connection = require("./database");
const jwt = require('jsonwebtoken');

const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, result) => { //functia de callback primeste eroarea si rezultatul executiei query-ului
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

function authenticateToken(req, res, next) {

  const authHeader = req.headers['authorization']; //header-ul are forma Bearer accestoken
  const tokenFromClient = authHeader && authHeader.split(' ')[1];
  if (!tokenFromClient)
    return res.sendStatus(401);

  jwt.verify(tokenFromClient, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err)
      return res.sendStatus(403);

    req.user = user;
    next();
  })
}

module.exports = {
  queryAsync,
  authenticateToken
};