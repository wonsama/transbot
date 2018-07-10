const readline = require('readline');

let fn = {};

/*
* sleep
* @param ms time to sleep
*/
fn.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
* input source change to number
* @param source input string
* @return number
*/
fn.getNumber = (source) =>{  
  if(!source || isNaN(source)){
    return null;
  }
  return Number(source);
}

/*
* await error handler
* @param promise promise object
* @return results [err, data]
*/
fn.to = (promise) =>{
  return promise
  .then(data=>[null,data])
  .catch(err=>[err]);
}

module.exports = fn;