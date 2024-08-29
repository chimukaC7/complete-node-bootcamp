const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [10, 'A tour name must have more or equal then 10 characters']
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {//customer validator
            validator: function (val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String], //Because we have multiple images, and I want to save those images as an array. And actually, as an array of strings.
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false //excluding a field from being exposed to the client
    },
    //so different dates for the same tour are simply different, let's say,instances of the tour starting on different dates.
    startDates: [Date], //these startDates are basically different dates at which a tour starts.
    secretTour: {
        type: Boolean,
        default: false
    }
}, 

//object for options 
{//we need to explicitly define in our schema that we want the virtual properties in our output.
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

//which is not going to be persisted in the database, but it's only gonna be there as soon as we get the data.
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});


//Just like Express, Mongoose also has the concept of middleware.
//For example, each time a new document is saved to the database, we can run a function between the save command is issued and the actual saving
//of the document, or also after the actual saving.
//And that's the reason why Mongoose middleware is also called pre and post hooks.
//So again, because we can define functions to run before or after a certain event, like saving a document to the database.

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
//So it runs before the save command and the create command. But not on insertMany.
//It's not gonna run, for example, for insert many and also not for find one and update or find by ID and update, which we already used before.
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {
        lower: true
    });

    //just like in Express, we also have the next function in mongoose middleware, basically to call the next middleware in the stack as we already know.
    next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
//as the name says, query middleware allows us to run functions before or after a certain query is executed.
//so let's now add a pre-find hook,so basically, a middleware that is gonna run before any find query is executed.
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function (next) {

    //So let's suppose that we can have secret tours in our database, like for tours that are only offered internally,or for a very small, like, VIP group of people,
    //and that the public shouldn't know about.
    //Now, since these tours are secret,we do not want the secret tours to ever appearin the result outputs. Right?
    // so what we're gonna do is to create a secret tour field and then query only for tours that are not secret.
    this.find({secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({
        $match: {
            secretTour: {
                $ne: true
            }
        }
    });

    console.log(this.pipeline());
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;