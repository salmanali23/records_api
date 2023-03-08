
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

const DEFAULT_LIMIT = 11;
const OPEN = 'open';
const CLOSED = 'closed';
const primaryColors = ['red', 'blue', 'yellow'];

/**
 * 
 * @param {string} color in string 
 * @returns boolean
 */
const isPrimary = (color) => primaryColors.includes(color);

/**
 * 
 * @param {*} data is the input in any type and checks if its an array or not 
 * @returns boolean
 */
const isArray = (data) => data && Array.isArray(data);

/**
 * 
 * @param {object} options can have two value, 1. page 2. colors. This function converts options into queryParams
 * @returns a valid query params as string
 */
const serializeQueryParams = (options) => {
  let queryParams = `limit=${DEFAULT_LIMIT}`;

  if (!options) {
    return queryParams;
  }

  if (options.page) {
    const page = (options.page - 1) * (DEFAULT_LIMIT - 1);
    queryParams += `&offset=${page}`;
  }
  
  if (isArray(options.colors) && options.colors.length) {
    queryParams += options.colors.map(
      color => (
        `&color[]=${color}`
        )
      ).join('')
  }
  return queryParams;
}

/**
 * 
 * @param {array} response is an array of object 
 * @param {object} options is the object given to serializeQueryParams to serialize 
 * @returns filters the response and changes its form to required one
 */
const serializeResponse = (response, options) => {
  let output = [];
  if (isArray(response)) {
    const isLast = response.length < DEFAULT_LIMIT;
    if (!isLast) {
      response.pop();
    }
    const openPrimaries = response.reduce((acc, curr) => {
      if (curr.disposition === OPEN) {
        acc.push({
          ...curr,
          isPrimary: isPrimary(curr.color)
        })
      }
      return acc;
    }, []);

    output = {
      previousPage: options?.page && options?.page > 1 ? options.page - 1 : null,
      nextPage: isLast ? null : options?.page ? options.page + 1 : 2,
      ids: response.map(res => res.id),
      open: openPrimaries,
      closedPrimaryCount: response.filter(res => res.disposition === CLOSED && isPrimary(res.color)).length,
    }
  }
  return output;
}

/**
 * 
 * @param {object} options is an object given as paramameter, contains page and color options inside
 * @returns response in required form
 */
const retrieve = async (options) => {
  
  const queryParams = serializeQueryParams(options);
  const path = `${window.path}${queryParams ? '?'.concat(queryParams) : ''}`
  const uri = new URI(path);
  try {
    const response = await new Promise(
      (resolve, reject) => {
        fetch(uri)
          .then((result) => result.json())
          .then((data) => resolve(data))
          .catch((error) => reject(error))
      }
    )
    const output = serializeResponse(response, options);
    return output;
  } catch (error) {
    console.log('ERROR:', error);
  }
}

export default retrieve;
