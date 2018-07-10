let fn = {};

/*
* calculate time
* @param h hours
* @return new date
*/
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

/*
* add current hour
* @param h hour
* @return new date
*/
fn.getNowCHour = (h) =>{
	return new Date().addHours(h);
}

/*
* get localtime from iso string
* @param created created date time
* @return new date
*/
fn.getLocalTime = (created)=>{

	if(!created){
		return new Date();
	}else{
		created = created.replace("T", " ")
	  var t = new Date(created).addHours(9);
	  return t;	
	}
}

/*
* get before date
* @param day day before number
* @return new date
*/
fn.getBeforeDate = (day, startWithZero=true)=>{
	var date = new Date();
	date.setDate(date.getDate() - day);
	if(startWithZero){
		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
	}
	return date;
}

module.exports = fn;