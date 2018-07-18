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
* return random integer value
* if end value is empty then run with 1 to start
* @param start start int value
* @param end end int value (optional)
* @return random value 
*/
fn.rndInt = (start, end) => {	
	if(start==end){
		start = 1;
	}
	if(!end){
		return Math.ceil(Math.random() * start);
	}else{
		let gap = end - start;
		return Math.round(Math.random() * gap + start);
	}	
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