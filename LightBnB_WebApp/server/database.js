const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  //CODE HERE
  return pool
    .query(`SELECT * from users
  WHERE email = $1
  `, [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * from users
WHERE id = $1
`, [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });

};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  //CODE HERE
  return pool
  .query(`INSERT INTO users (
    name, email, password) 
    VALUES (
    $1, $2, $3)
    RETURNING *;
`, [user.name, user.email, user.password])
  .then((result) => {
    return result;
  })
  .catch((err) => {
    return null;
  });

};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  console.log("ando")
  return pool
  .query(`SELECT properties.*, reservations.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id, start_date
  ORDER BY start_date
  LIMIT $2;`, [guest_id, limit])
  .then((result) => {
    console.log(guest_id)
    console.log(result.rows)
    return result.rows;
  })
  .catch((err) => {
    console.log("there")
    return null;
  });
};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  console.log(options)

  const queryParams = [];
  let whereOccured = false
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
    whereOccured = true
  }
  if (options.owner_id && !whereOccured) {
    queryParams.push(options.owner_id*1);
    queryString += `WHERE owner_id = $${queryParams.length} `;
    whereOccured = true
  } else if (options.owner_id && whereOccured){
    queryParams.push(options.owner_id*1);
    queryString += `AND owner_id = $${queryParams.length} `;
  }
  if (options.minimum_price_per_night && !whereOccured) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `WHERE cost_per_night > $${queryParams.length * 100} `;
    whereOccured = true
  } else if (options.minimum_price_per_night && whereOccured){
    queryParams.push(options.minimum_price_per_night* 100);
    queryString += `AND cost_per_night > $${queryParams.length } `;
  }
  if (options.maximum_price_per_night && !whereOccured) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `WHERE cost_per_night < $${queryParams.length} `;
    whereOccured = true
  } else if (options.maximum_price_per_night && whereOccured){
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND cost_per_night < $${queryParams.length} `;
  }
 else if (options.minimum_rating && whereOccured){
    queryParams.push(options.minimum_rating*1);
    queryString += `AND average_rating > $${queryParams.length} `;
  }
  

  // 4

  queryString += `
  GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating*1);
    queryString += `HAVING avg(property_reviews.rating) > $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);
  
 return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(options)
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (user) {
  console.log(user)
  return pool
  .query(`INSERT INTO properties (
    title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id) 
    VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
`, [user.title, user.description, user.number_of_bedrooms, user.number_of_bathrooms, user.parking_spaces , user.cost_per_night , user.thumbnail_photo_url , user.cover_photo_url , user.street, user.country, user.city, user.province, user.post_code, user.owner_id])
  .then((result) => {
    console.log("made it here thank god")
    return result;
  })
  .catch((err) => {
    console.log("uh oh")
    return null;
  });


  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
};
exports.addProperty = addProperty;


