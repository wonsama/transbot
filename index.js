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

// clear screen
clear();

/*
* 버퍼에 담긴 내용을 모니터링 한다
*/
let buffers = [];
let lock = false;
async function monitorBuffer(sec=5){
	
	let err;

	if(!lock && buffers.length>0){
		// 작업중에는 잠금처리함.
		lock = true;

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
			let body = `본문(${_getLang(trans.from.language.iso)}) 이(가) ${_getLang(item.cmd)} 로 아래와 같이 번역되었습니다. created by @wonsama\n\n${trans.text}`
			body = striptags(body, [], '\n');
			let wif = STEEM_TRANS_KEY_POSTING;
			let author = STEEM_TRANS_AUTHOR;
			let permlink = `${author}-trans-${new Date().getTime()}`;
			let title = '';
			let jsonMetadata = {
				tags:['wonsama','transbot'],
				app: 'transbot/v1.0.0',
				format: 'markdown'
			};
			[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));
			if(!err){
				// 번역된 정보 출력 - 확인용
				console.log(`translate : https://steemit.com/@${author}/${permlink}`);

				// 버퍼 제거
				buffers.shift();
			}else{
				console.log('reply error',err);
			}
		}else{
			console.log('get content error',err);
		}

		// TODO : 각단계에서 오류가 나는 경우 파일로 기록
		// 부모글조회, 댓글 작성

		// 잠금해제 
		lock = false;
	}

	setTimeout(monitorBuffer, 1000 * sec);
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
}

// start monitoring
// steem.api.streamOperations : doesn't exist async function
steem.api.streamOperations(function (err, results) {

	if(results){

		let command = results[0];
		let data = results[1];	
		
		// 댓글만 추출
		if(command=='comment' && data && data.parent_author && data.parent_author!=''){
			
			// @번역해 태그가 포함된 댓글정보만 가져온다
			let cmd = getLang(data.body);
			if(cmd){
				monitoring(data, cmd);	
			}

		}
	}

});