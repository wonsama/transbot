////////////////////////////////////////////////////////////
//
// information
//

/*
	RPC20 통신을 손쉽게 할 수 있도록 도와주는 유틸리티

	request : https://www.npmjs.com/package/request
*/

////////////////////////////////////////////////////////////
//
// require
//

const request = require('request');

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36';

////////////////////////////////////////////////////////////
//
// const
//

////////////////////////////////////////////////////////////
//
// let
//

let fn = {};

////////////////////////////////////////////////////////////
//
// private functions
//

/*
* RPC 2.0 통신 모델 생성
* @param method 호출 메소드 
* @param params 전송 파라미터 
* @param id 아이디 (수신 시 동일 id 값을 리턴해준다)
*/
let rpc20 = (method, params, id)=>{
	let json = {};
	json.jsonrpc = '2.0';
	json.method = method;
	if(params){
		json.params = params;	
	}
	json.id = id;

	return json;
}

////////////////////////////////////////////////////////////
//
// default functions
//

/*
* 서버로 RPC2.0 데이터를 전송한다.
* @param method 호출 메소드 
* @param params 전송 파라미터 
* @param url API URL
* @param id 아이디 (수신 시 동일 id 값을 리턴해준다)
*/
fn.send_rpc = function (method, params, url='https://api.steemit.com', id=1){

	return new Promise((resolve, reject)=>{

		let options = {
		  'method': "POST",
		  'url': url,
		  'json': rpc20(method,params,id)
		};

		request(options, function (error, response, body) {
		  if (error){
		  	// 통신오류 
		  	reject(error);
		  }else{
		  	if(body.result){
		  		// 정상 처리 된 경우임 
		  		resolve(body.result);	
		  	}else{
		  		// 응답은 받았으나 업무처리 오류
		  		reject(body.error);
		  	}
		  }
		});

	});
}

/*
* GET 방식으로 웹을 호출한다
* @param url 호출 URL 
* @param user_agent 사용자 단말정보 
* @param referer 이전 호출 정보
*/
fn.send_get_body_json = function (url){

	return new Promise((resolve, reject)=>{
		request(url, function (error, response, body) {
		  if (error){
		  	// 통신오류 
		  	reject(error);
		  }else{
		  	if(body){
		  		// body.result 가 아닌 body 부분에 값을 설정해서 보내주기 때문 
		  		resolve(JSON.parse(body));
		  	}else{
		  		// 오류인 
		  		reject(response);
		  	}
		  }
		});

	});
}

////////////////////////////////////////////////////////////
//
// module exports
//
module.exports = fn;