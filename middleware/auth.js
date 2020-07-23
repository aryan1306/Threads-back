const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "no token found" });
  }
  try {
    jwt.verify(token, process.env.SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: "token invaild" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "server error" });
  }
};
