const express = require("express");
const router = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../../../models/user.model");

router.post(
  "/",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { email, password } = req.body;

    try {
      //see if user exists
      let user = await User.findOne({
        email,
      });

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: "Invaild credentials",
            },
          ],
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: "Invaild credentials",
            },
          ],
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.SECRET,
        {
          expiresIn: 36000,
        },
        (err, token) => {
          if (err) {
            throw err;
          }
          res.json({
            token,
          });
        }
      );

      // res.send('User registered')
    } catch (err) {
      console.error(err.message);
      return res.status(500).json("Server Error");
    }
  }
);

module.exports = router;
