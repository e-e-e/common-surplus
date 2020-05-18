require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');

const tw = require('./tw_service');

const app = new express();

function toDollar(value) {
  return `$${value.toFixed(2)} AUD`
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(helmet());
app.use(express.static('public'));

app.get('*', async (req, res, next) => {
  try {
    const accountBalance = await tw.fetchAccountBalance();
    res.render('main', {total: toDollar(accountBalance.amount.value)});
  } catch (e) {
    next(e)
  }
})

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  console.error(err);
  res.status(500).send('Something went terribly wrong');
}

app.use(errorHandler);

app.listen({port: process.env.PORT}, (err) => {
  if (err) {
    throw err;
  }
  console.log('listening on port', process.env.PORT);
})
