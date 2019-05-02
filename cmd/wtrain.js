////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
   transfer 모니터링 / train 보팅 수행
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//

const steem = require('steem');											// steem api
const wlog = require('../util/wlog');							// logs
////////////////////////////////////////////////////////////
//
// const (상수정의)
//

const TRAIN_IDS = (process.env.TRAIN_IDS||'').split(',').map(x=>x.replace(/\s/gi,''));


////////////////////////////////////////////////////////////
//
// let (변수정의)
//


////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작 
//

// const _aaa = (param)=> {
//
// }

const _get_url = (memo)=>{

	if(!memo){
		return undefined;
	}

	memo = memo.replace(/\s/gi, '');
	let url = memo.split('/').reverse();
	if(!url || url.length<3){
		return undefined;
	}

	let permlink = url[0];
	let author = url[1];

	if(author.indexOf("@")!=0){
		return undefined;
	}

	return {
		author : author.replace("@", ''),
		permlink : permlink
	};
}

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

const command = async (item) =>{
	
	// wdev 로 송금한 것만 모니터링
	const money = parseFloat(item.amount.split(' ')[0]);
	const type = item.amount.split(' ')[1];
	if(item.to!='wdev' || money!=0.1){
		return Promise.resolve('pass not me');
	}

	let uval = _get_url(item.memo);
	if(!uval){
		// TODO : refund
		return Promise.resolve('not includes valid url');
	}

	wlog.info(`will upvoted : author : ${uval.author} permlink : ${uval.permlink}`);

	// 보팅 수행
	for(let t of TRAIN_IDS){
		let wif = process.env[`ENV_AUTHOR_KEY_POSTING_${t}`];
		let weight = 10000;
		steem.broadcast.voteAsync(wif, t, uval.author, uval.permlink, weight);
	}

	wlog.info('wait 3 sec.');

	await new Promise((resolve,reject)=>setTimeout(resolve, 1000*3));	// 3초간 대기

	wlog.info('wait end.');

	return Promise.resolve('upvoted');
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
	command
}; // public function 에서 지정하여 외부 노출을 시켜준다 (개발진척에 따라서 노출여부 결정)


/*
{ 
	from: 'kryptogames',
	to: 'cryptoeater',
	amount: '210.638 STEEM',
	memo: 'hello' 
}
*/