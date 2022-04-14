/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get id() {
    return this._id;
  }

  set id(val) {
    if (this._id) throw new Error("Cannot change reservation id.");
    this._id = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (val < 1) throw new Error("The number of guests must be at least 1.");
    this._numGuests = val; 
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(val) {
    this._startAt = new Date(val);
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(val) {
    if (this._customerId) {
      throw new Error ("Cannot change customer id.");
    } 
    this._customerId = val;
  }

  get notes() {
    return this._notes;
  }

  set notes(val) {
    this._notes = val ? val : '';
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. order reservations by most recent */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
          customer_id AS "customerId", 
          num_guests AS "numGuests", 
          start_at AS "startAt", 
          notes AS "notes"
          FROM reservations 
          WHERE customer_id = $1
          ORDER BY start_at`,
          [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  // get reservation by id
  static async get(id) {
    const result = await db.query(
      `SELECT id, 
      customer_id AS "customerId", 
      num_guests AS "numGuests", 
      start_at AS "startAt", 
      notes AS "notes"
      FROM reservations 
      WHERE id = $1`,
    [id]
    );

    return new Reservation(result.rows[0]); 
  }

  // save the reservation
  async save() {
    if (this.id === undefined) { // reservation not in db
     
      const result = await db.query(`
        INSERT INTO reservations
        (customer_id, start_at, num_guests, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [this.customerId, this.startAt, this.numGuests, this.notes]);
      
      this.id = result.rows[0].id; // set id in db to Reservation object id
    
    } else { // reservation exists, update info in db
      await db.query(`
        UPDATE reservations
        SET start_at = $1, num_guests = $2, notes = $3
        WHERE id = $4
      `, [this.startAt, this.numGuests, this.notes, this.id]);
    }
  }
}


module.exports = Reservation;
