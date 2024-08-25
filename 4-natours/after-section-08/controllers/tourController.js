const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = async (req, res) => {

    try {
        // EXECUTE QUERY
        //This find method here is going to return a query
        //that is the reason why we can then chain other methods
        const features = new APIFeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
            
        const tours = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        });
    } catch (err) {

        res.status(404).json({
            status: 'fail',
            message: err
        });
        
    }
};

exports.getTour = async (req, res) => {
    //we use async await because this tour.create returns a promise that we're awaiting so that we can then store the newly created tour document
    //inside of this variable and then send it along with the responseto the client down here.
    
    //So we have a try catch here because we're actually using an async await function here.
    try {
        const tour = await Tour.findById(req.params.id);
        // Tour.findOne({ _id: req.params.id })

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });

    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

exports.createTour = async (req, res) => {
    try {
        // const newTour = new Tour({})
        // newTour.save()

        //whatever is not in our schema and so therefore they are not put in the database.
        const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {newTour}
        });

    } catch (err) {

        res.status(400).json({
            status: 'fail',
            message: err
        });

    }
};

exports.updateTour = async (req, res) => {

    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            //Because this way, then the new updated document is the one that will be returned.
            //And since we want to send back that updated document to the client, we always want this method to actually return that new document
            new: true,
            runValidators: true // so that each time that we update a certain document, then the validators that we specified in the schema will run again,
        });

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });

    } catch (err) {

        res.status(404).json({
            status: 'fail',
            message: err
        });

    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null //So in a RESTful API, it is a common practice not to send back any data to the client when there was a delete operation, 
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

exports.getTourStats = async (req, res) => {
    try {
        const stats = await Tour.aggregate([{
                $match: {
                    ratingsAverage: {
                        $gte: 4.5
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $toUpper: '$difficulty'
                    },
                    numTours: {
                        $sum: 1
                    },
                    numRatings: {
                        $sum: '$ratingsQuantity'
                    },
                    avgRating: {
                        $avg: '$ratingsAverage'
                    },
                    avgPrice: {
                        $avg: '$price'
                    },
                    minPrice: {
                        $min: '$price'
                    },
                    maxPrice: {
                        $max: '$price'
                    }
                }
            },
            {
                $sort: {
                    avgPrice: 1
                }
            }
            // {
            //   $match: { _id: { $ne: 'EASY' } }
            // }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

exports.getMonthlyPlan = async (req, res) => {
    try {
        const year = req.params.year * 1; // 2021

        const plan = await Tour.aggregate([{
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $month: '$startDates'
                    },
                    numTourStarts: {
                        $sum: 1
                    },
                    tours: {
                        $push: '$name'
                    }
                }
            },
            {
                $addFields: {
                    month: '$_id'
                }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {
                    numTourStarts: -1
                }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};