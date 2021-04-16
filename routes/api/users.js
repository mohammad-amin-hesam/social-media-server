const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const User = require("../../models/User");

// @route GET api/users
// @desc Tests users route
// @access Public
router.get("/test", (req, res) => {
  res.json({
    msg: "Users Works"
  });
});

// @route GET api/register
// @desc Register User
// @access Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", // Size
        r: "jpg", // Rating
        d: "mm" // Default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        avatar
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              res.json({
                item: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar
                },
                msg: "success",
                code: 200,
                status: true
              });
            })
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route GET api/users/login
// @desc Login User / returning JWT Token
// @access Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check for User
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }

    //Check Password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User Matched
        const payload = { id: user.id, name: user.name, avatar: user.avatar }; //Create JWT payload

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              msg: "success",
              token: "Bearer " + token,
              code: 200,
              status: true
            });
          }
        );
      } else {
        errors.password = "password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

// @route GET api/users/current
// @desc Return current user
// @access Private

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      item: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      },
      msg: "success",
      code: 200,
      status: true
    });
  }
);

router.get("/logout", (req, res) => {
  req.logout();
  res.json({ msg: "you loged out :)" });
});

module.exports = router;