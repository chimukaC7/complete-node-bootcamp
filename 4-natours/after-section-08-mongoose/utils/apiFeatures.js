class APIFeatures {

    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //these three dots, will basically take all the fields out of the object.
        //Here with the curly braces, well,we simply create a new object.
        //So we have a new object that is basically going to contain all the key value pairs that were in our req dot query object.
        const queryObj = {
            ...this.queryString
        };
        const excludedFields = ['page', 'sort', 'limit', 'fields']; //an array of  all the fields that we want to exclude.
        excludedFields.forEach(el => delete queryObj[el]); // remove all of these fields from our query object.

        // 1B) Advanced filtering
        // {difficult: 'easy', duration: {$gte:5}}
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;//returns the entire object
    }

    sort() {
        if (this.queryString.sort) {

            // query = query.sort(req.query.sort);

            //we want to rank them, basically,according to a second criteria.
            //So in case there is a tie, then we want to have a second field by which we can then sort where the first one is the same.
            // this.sort('price ratingsAverage')
            //Now we cannot leave a space here in the URL and so instead we're gonna add a comma.
            //So we want to sort first by price and then as a second criteria, also by ratings average.

            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            //default sorting
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        //So, for a client, it's always ideal to receive as little data as possible, in order to reduce the bandwidththat is consumed with each request.
        //And that's, of course, especially truewhen we have really data-heavy data sets
        if (this.queryString.fields) {

            // query = query.select('name duration price')

            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');//minus is then not including, but excluding

            /*
            we can also exclude fields right from the schema.
            Alright, and that can be very useful, for example, when we have sensitive data that should only be used internally.
            For example, stuff like passwords should never be exposed to the client
            */
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;