const { stat } = require("fs");
const path = require("path");


// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
//validates that the order exists.
function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        return next();
    }
    next({ status: 404, message: `Order does not exist: ${orderId}`})
}

//validates that the body has the data required.
function hasData(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    if(!deliverTo || deliverTo.length === 0){
        return next({ status: 400, message: "Order must include a deliverTo"})
    }
    if(!mobileNumber || mobileNumber.length === 0) {
        return next({ status: 400, message: "Order must include a mobileNumber"})
    }
    if(!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        return next({ status: 400, 
            message: !dishes ? "Order must include a dish" : "Order must include at least one dish"})
    }
    dishes.forEach((dish, index) => {
        if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
        }
    })
    next();
}

function read(req, res) {
    res.json({ data: res.locals.order })
}

function create(req, res) {
    const { data: {deliverTo, mobileNumber, dishes} = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}

function list(req, res, next) {
    res.json({ data: orders })
}

//updates an order, checks if the id's match, and the status is correct.
function update(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = res.locals.order;
    const { data: { id, deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    foundOrder.deliverTo = deliverTo;
    foundOrder.status = status;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.dishes = dishes;
    if(id && orderId !== id){
        return next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`})
    }
    if(!status || status.length === 0 || status === "invalid") {
        return next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"})
    }
    if(status === "delivered") {
        return next({ status: 400, message: "A delivered order cannot be changed"})
    }
res.json({ data: foundOrder })
}

//deletes an order as long as the status is pending.
function destroy(req, res, next) {
    const orderId = req.params.orderId
    const foundOrder = res.locals.order;
    const index = orders.findIndex((order) => order.id === orderId)
    if(foundOrder.status !== "pending") {
        return next({ status: 400, message: "An order cannot be deleted unless it is pending"})
    }
    if (index > -1) {
        orders.splice(index, 1)
    }
    res.sendStatus(204)
}

module.exports = {
    list,
    create: [hasData, create],
    read: [orderExists, read],
    update: [orderExists, hasData, update],
    destroy: [orderExists, destroy],

}