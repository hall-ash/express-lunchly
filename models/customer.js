/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  // returns a list of Customer objects from a Result object
  static getCustomerObjects(results) {
    return results.rows.map( c => {
      return new Customer({ 
        id: c.id, 
        firstName: c.first_name, 
        middleName: c.middle_name,
        lastName: c.last_name, 
        phone: c.phone, 
        notes: c.notes
      })
    });
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  // search for customers by name
  // returns a list of Customers with matching first or last names
  // returns empty list if no customers match
  static async find(nameToFind) {
    const results = await db.query(`
      SELECT id, first_name, middle_name, last_name, phone, notes
      FROM customers
      WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR middle_name ILIKE $1
    `, ['%' + nameToFind + '%']);

    return this.getCustomerObjects(results);
  } 

  // return top 10 customers ordered by most reservations
  static async getBestCustomers() {
    const numCustomersToGet = 10;

    const results = await db.query(`
      SELECT c.id, c.first_name, c.middle_name, c.last_name, c.phone, c.notes
      FROM customers AS c 
      INNER JOIN reservations AS r
      ON c.id = r.customer_id
      GROUP BY c.id
      ORDER BY COUNT(r.customer_id) DESC
      LIMIT $1
    `, [numCustomersToGet]);

    return this.getCustomerObjects(results);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  // get the most recent reservation
  async mostRecentReservation() {
    const reservations = await this.getReservations();

    // return first (most recent) reservation if any
    return reservations? reservations[0] : [];
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) { // customer not in db
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes, middle_name)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes, this.middleName]
      );
      this.id = result.rows[0].id;
    } else { // customer in db, save customer data
      await db.query( 
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4 middle_name=$5
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id, this.middleName]
      );
    }
  }

  get fullName() {
    if (this.middleName) 
      return this.firstName + ' ' + this.middleName + ' ' + this.lastName;
    return this.firstName + ' ' + this.lastName;
  }

  set notes(val) {
    this._notes = val ? val : "";
  }

  async mostRecentReservation() {
    const reservations = await this.getReservations();

    // return first (most recent) reservation if any
    return reservations ? reservations[0] : null;
  }

}

module.exports = Customer;
