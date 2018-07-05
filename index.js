// my utils
const {clear} = require ('./util/wconsole');	// 화면 클리어 
const {getLang} = require ('./util/wlangs');	// 구글번역 지원 언어 확인
const {_getLang} = require ('./util/wlangs');	// 구글번역 지원 언어 확인
const {to} = require ('./util/wutil');	// async 처리

// 3rd party module
const steem = require('steem');
const translate = require('google-translate-api');
const striptags = require('striptags');

// 기본값
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;

const CUT_BODY_LENGTH = 5000; // 구글번역은 최대 5000자 까지 가능, 물론 split하면 되지만 5000 글자 자체가 많음.
const TIME_SEC = 1000;				// 초
const MONITOR_RELOAD_SEC = 10;	// 버퍼 모니터링 주기

// clear screen
clear();

/*
* 버퍼에 담긴 내용을 모니터링 한다
*/
let buffers = [];
async function monitorBuffer(){
	
	let err;

	if(buffers.length>0){

		// 첫번째로 담긴 내용을 읽어들임
		let item = buffers[0];

		// 부모글 정보를 조회
		let par;
		[err, par] = await to(steem.api.getContentAsync(item.parent_author, item.parent_permlink));
		if(!err){

			// 부모글의 body를 번역 수행
			// TODO : 5천글자 이상 처리
			let contents = par.body.substr(0, 5000);
			let trans;
			// item.cmd = 'ko';	// must remove
			[err, trans] = await to(translate(contents, {to:item.cmd}));

			// 댓글 작성하기
			let reply;
			let body = `본문(${_getLang(trans.from.language.iso)}) 이(가) ${_getLang(item.cmd)} (으)로 아래와 같이 번역되었습니다.\n\n---\n${trans.text}\n\n---\ncreated by @wonsama\n`
			body = striptags(body, [], '\n');
			let wif = STEEM_TRANS_KEY_POSTING;
			let author = STEEM_TRANS_AUTHOR;
			let permlink = `${item.author}-trans-${new Date().getTime()}`;
			let title = '';
			let jsonMetadata = {
				tags:['wonsama','transbot'],
				app: 'transbot/v1.0.0',
				format: 'markdown'
			};
			[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));
			if(!err){

				// 버퍼 제거
				buffers.shift();

				// 번역된 정보 출력 - 확인용
				console.log(new Date(), `translate : https://steemit.com/@${author}/${permlink} , current buffer size : ${buffers.length}`);
				console.log(`--------------------------------------------------`);

				// 다시 N초 이후 버퍼를 재 검색한다 - 정상처리 된 경우임
				setTimeout(monitorBuffer, MONITOR_RELOAD_SEC * TIME_SEC);	
			}
		}
		
	}else{

		console.log(new Date(), 'buffer is empty');

		// 다시 N초 이후 버퍼를 재 검색한다 - 버퍼에 담긴 내용이 없는 경우 
		setTimeout(monitorBuffer, MONITOR_RELOAD_SEC * TIME_SEC);	
	}

	// 오류가 발생한 경우
	if(err){
		// TODO : 각단계(부모글조회, 댓글 작성)에서 오류가 나는 경우 파일로 기록
		console.log(new Date(), err);

		// 다시 N초 이후 버퍼를 재 검색한다 - 오류가 담긴 경우 ( 버퍼는 아직 제거 안됨 )
		setTimeout(monitorBuffer, MONITOR_RELOAD_SEC * TIME_SEC);
	}

}
monitorBuffer();

/*
* 스트림 데이터에서 @번역해 가 포함된 댓글 정보를 모니터링
* @param data 댓글정보
* @param cmd 번역할 대상 언어
*/
function monitoring(data, cmd){
		data.cmd = cmd;
		buffers.push(data);

		console.log(new Date(), 'monitoring', data);
		console.log(`current buffer size : ${buffers.length}`);
		console.log('goto cmd link', `https://steemit.com/@${data.author}/${data.permlink}`);
}

// start monitoring
// steem.api.streamOperations : doesn't exist async function
steem.api.streamOperations(function (err, results) {

	if(results){

		let command = results[0];
		let data = results[1];	
		
		// 댓글만 추출, 댓글봇이 쓴 글에는 댓글을 달지 않음.
		if(command=='comment' && data && data.parent_author && data.parent_author!='' && data.parent_author!=STEEM_TRANS_AUTHOR){
			
			// @번역해 태그가 포함된 댓글정보만 가져온다
			let cmd = getLang(data.body);
			if(cmd){
				monitoring(data, cmd);	
			}

		}
	}

});