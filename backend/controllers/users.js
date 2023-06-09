require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const customError = require('../errors');

const { NODE_ENV, JWT_SECRET } = process.env;

const checkUser = (user, res) => {
  if (!user) {
    throw new customError.NotFound('Нет пользователя с таким id');
  }
  return res.send(user);
};

const createUser = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      User.create({
        email: req.body.email,
        password: hash,
        name: req.body.name,
        about: req.body.about,
        avatar: req.body.avatar,
      })
        .then((newUser) => {
          res.status(201).send({
            email: newUser.email,
            name: newUser.name,
            about: newUser.about,
            avatar: newUser.avatar,
          });
        })
        .catch((error) => {
          if (error.code === 11000) {
            next(
              new customError.Conflict(
                'Пользователь с такой почтой уже зарегистрирвован'
              )
            );
          } else if (error.name === 'ValidationError') {
            next(
              new customError.BadRequest(
                'Некорректные данные при создании нового пользователя'
              )
            );
          } else {
            next(error);
          }
        });
    })
    .catch(next);
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) {
        throw new customError.Unauthorized('Неверные почта или пароль');
      }
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return next(
            new customError.Unauthorized('Неверные почта или пароль')
          );
        }
        const token = jwt.sign(
          { _id: user._id },
          NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
          {
            expiresIn: '7d',
          }
        );
        return res.send({ token });
      });
    })
    .catch(next);
};

const getMe = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => res.send(user))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(
          new customError.BadRequest(
            'Некорректные данные при создании нового пользователя'
          )
        );
      } else {
        next(error);
      }
    });
};

const getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.send({ data: users }))
    .catch(next);
};

const getUserById = (req, res, next) => {
  const { userId } = req.params;

  User.findById(userId)
    .then((user) => checkUser(user, res))
    .catch(next);
};

const editProfile = (req, res, next) => {
  const owner = req.user._id;
  const { name, about } = req.body;

  User.findByIdAndUpdate(
    owner,
    { name, about },
    { new: true, runValidators: true }
  )
    .then((user) => checkUser(user, res))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(
          new customError.BadRequest(
            'Некорректные данные при создании нового пользователя'
          )
        );
      } else {
        next(error);
      }
    });
};

const updateAvatar = (req, res, next) => {
  const owner = req.user._id;
  const avatar = req.body;

  User.findByIdAndUpdate(owner, avatar, { new: true, runValidators: true })
    .then((user) => checkUser(user, res))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(
          new customError.BadRequest(
            'Некорректные данные при создании нового пользователя'
          )
        );
      } else {
        next(error);
      }
    });
};

module.exports = {
  login,
  getUsers,
  createUser,
  getUserById,
  editProfile,
  updateAvatar,
  getMe,
};
