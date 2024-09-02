const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// 3) ROUTES
/*
All right now how are we gonna implement a route handler for a route that was not cached by any of our other route handlers
all these middlewarefunctions are executed in the order they are in the code.
*/
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//only be reached again if not handled by any of our other routers,
//Now we could use get here right, so just like we did before but then what about post requests, or delete, or patch requests?
//You would then have to write handlers for these as well,and we don't want that, we simply want to handle all the routes, so all the URL's, for all the verbs right here in this one handle
app.all('*', (req, res, next) => {
    //Well we simply want to send back a response in the JSON format, so not the HTML that we have right now.
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;