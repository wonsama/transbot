const steem = require('steem');
const {to} = require('./wutil');

let fn = {};

/*
* 계정의 최신 글 정보를 알려준다
* 없는 경우는 undefined를 반환한다
* @param author 계정명
* @param from 조회 시작위치 -1 : 최신글, 글 번호는 1부터 해서 순차적으로 계정별로 있음에 유의
* @param limit 조회 카운트 최대 10000까지 조회 가능
*/
const getRecentComment = async(author, limit=200, from=-1)=>{
	let [err, data] = await to(steem.api.getAccountHistoryAsync(author, from, limit));
	
	if(data){
		data.sort((a,b)=>b[0]-a[0]);
		data = data.filter(x=>x[1]&&x[1].op[0]&&x[1].op[0]=='comment'&&x[1].op[1].author==author&&x[1].op[1].parent_author=='');

		if(data.length>0){
			return Promise.resolve(data[0][1].op[1]);
		}
	}
	
	return Promise.resolve(undefined);
}

module.exports = {
	getRecentComment
}