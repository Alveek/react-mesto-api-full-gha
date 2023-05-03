const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const cors = require('./middlewares/cors');
const auth = require('./middlewares/auth');
const centralizedErrorController = require('./middlewares/centralizedErrorController');
const authRouter = require('./routes/auth');
const router = require('./routes');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const { NotFound } = require('./errors');

const { PORT = 3000 } = process.env;
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/mestodb');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(cors);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.use(authRouter);
app.use(auth);
app.use(router);

app.use((req, res, next) => {
  next(new NotFound('Запрошен несуществующий роут'));
});

app.use(errorLogger);
app.use(errors());

app.use(centralizedErrorController);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
