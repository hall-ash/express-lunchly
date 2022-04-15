/** Routes for Lunchly */

const express = require("express");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function(req, res, next) {
  try {
    let customers = await Customer.all();
    
    customers = await Promise.all(customers.map(async(c) => {
      
      c.mostRecentReservation = await c.mostRecentReservation();
      return c;
    }));

    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Form to add a new customer. */

router.get("/add/", async function(req, res, next) {
  try {
    return res.render("customer_new_form.html");
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new customer. */

router.post("/add/", async function(req, res, next) {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const notes = req.body.notes;

    const customer = new Customer({ firstName, lastName, phone, notes });
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

// search customer by name
router.get('/search', async (req, res, next) => {
  try {
    const { name } = req.query;

    // find customers with matching name
    let customers = await Customer.find(name);

    customers = await Promise.all(customers.map(async(c) => {
      
      c.mostRecentReservation = await c.mostRecentReservation();
      return c;
    }));
    
    res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err)
  }
});

// get list of top n customers by number of reservations
router.get('/top-customers', async (req, res, next) => {
  try {
    const customers = await Customer.getBestCustomers();
    const best = true;

    res.render("customer_list.html", { customers, best })
  } catch (err) {
    return next(err);
  }
});

/** Show a customer, given their ID. */

router.get("/:id/", async function(req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    const reservations = await customer.getReservations();

    return res.render("customer_detail.html", { customer, reservations });
  } catch (err) {
    return next(err);
  }
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function(req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    res.render("customer_edit_form.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function(req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);
    customer.firstName = req.body.firstName;
    customer.lastName = req.body.lastName;
    customer.phone = req.body.phone;
    customer.notes = req.body.notes;
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function(req, res, next) {
  try {
    const customerId = req.params.id;
    const startAt = new Date(req.body.startAt);
    const numGuests = req.body.numGuests;
    const notes = req.body.notes;

    const reservation = new Reservation({
      customerId,
      startAt,
      numGuests,
      notes
    });
   
    await reservation.save();

    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

// get reservation detail page
router.get("/reservations/:id", async (req, res, next) => {
  try {
    const reservation = await Reservation.get(req.params.id);

    const customer = await Customer.get(reservation.customerId);

    res.render("reservation_detail.html", { customer, reservation });
  } catch (e) {
    return next(e);
  }
});

// Edit the start time, number of guests, or notes for a reservation
router.post("/reservations/:id", async (req, res, next) => {
  try {
    const reservation = await Reservation.get(req.params.id);
    const { startAt, numGuests, notes } = req.body;

    // update reservation
    reservation.startAt = startAt;
    reservation.numGuests = numGuests;
    reservation.notes = notes;
    
    await reservation.save();

    return res.redirect(`/reservations/${reservation.id}`)
  } catch (err) {
    return next(err);
  }
})





module.exports = router;
