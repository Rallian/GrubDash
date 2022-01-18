const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function dishExists(req, res, next) {
    const dishId = req.params.dishId
    const foundDish = dishes.find((dish) => dish.id === dishId)
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    })
}

function hasData(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (!name || name.length === 0) {
        return next({ status: 400, message: "Dish must include a name"})
    }
    if(!description || description.length === 0) {
        return next({ status: 400, message: "Dish must have a description"})
    }
    if(!price) {
        return next ({ status: 400, message: "Dish must include a price"})
    }
    if(!Number.isInteger(price) || price < 0) {
        return next ({ status: 400, message: "Dish must have a price that is an integer greater than 0"})
    }
    if (!image_url || image_url.length === 0) {
        return next ({ status: 400, message: "Dish must include a image_url"})
    }
    next();
}

function read(req, res) {
    res.json({ data: res.locals.dish })
}

function create(req, res) {
const { data: {name, description, price, image_url} = {} } = req.body;
const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
}
dishes.push(newDish);
res.status(201).json({ data: newDish })
}


function list(req, res) {
    res.json({ data: dishes })
}

function update(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = res.locals.dish
    const { data: { id, name, description, price, image_url } = {} } = req.body;
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    if(id && dishId !== id) {
        return next({ status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`})
    }
    res.json({ data: foundDish })
}

module.exports = {
    list,
    create: [hasData, create],
    read: [dishExists, read],
    update: [dishExists, hasData, update]


}