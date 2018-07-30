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
* check input value is true
* @param source text value
* @return is true ?
*/
fn.toBoolean = (source) =>{
	try{
		return JSON.parse(source.toLowerCase())===true;
	}catch(e){
		return false;
	}
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

/*
* 주소 정보에서 유용한 정보를 추출한다
* @param 주소창의 주소
*/
fn.getInfoFromLink = (link)=>{

	// https:// 부분은 cut
  // 이후 구성 [ 도메인 - 태그 - 저자 - 펌링크 ]
  let infos = link.substr(8).split('/');

  if(!infos || infos.length!=4){

  	let msg = [];
  	msg.push(`입력받은 ${link} 는 올바른 주소 형식이 아닙니다.`);
  	msg.push('sample link : https://steemit.com/kr/@wonsama/kr-dev-krob');

  	return {
  		data:{
  			domain: '',
		  	category: '',
		  	author: '',
		  	permlink: ''
  		},
  		ok:false,
  		cd:999,
	  	msg:msg.join('\n')
	  }
  }

  return {
  	data:{
  		domain: infos[0],
	  	category: infos[1],
	  	author: infos[2].substr(1),
	  	permlink: infos[3]
  	},
  	ok:true,
  	cd:0, /* 0 : 정상, 양수 : 비정상, 추후 코드별 분기(로컬라이징, 코드메시지) 필요 */
	  msg:'success'
  }
}

module.exports = fn;