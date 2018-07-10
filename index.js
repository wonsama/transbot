const {monitor} = require ('./util/wmonitor');		// 스팀잇 댓글 모니터링
const {to} = require ('./util/wutil');						// async 처리
const {getLang} = require ('./util/wlangs');			// 구글번역 지원 언어 확인
const {getCommand} = require ('./util/wlangs');		// 명령어 내부 값 추출
const {_getLang} = require ('./util/wlangs');			// 구글번역 지원 언어 확인
const wlog = require('./util/wlog');							// 로그


const steem = require('steem');
const translate = require('google-translate-api');
const striptags = require('striptags');

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;

const IS_TEST_MODE = false;						// 테스트 할 때에는 커맨드를 별도로 사용하도록 함
const CUT_BODY_LENGTH = 5000; 				// 구글번역은 최대 5000자 까지 가능, 물론 split하면 되지만 5000 글자 자체가 많음.
const MONITOR_COMMAND_WTRANSUP = IS_TEST_MODE?'#testup':'#wtransup';
const MONITOR_COMMAND_WTRANSME = IS_TEST_MODE?'#testme':'#wtransme';
const MONITOR_COMMAND_WTRANSDEL = IS_TEST_MODE?'#testdel':'#wtransdel';

const TRANSBOT_MANUAL_KO_LINK = 'https://steemit.com/kr/@wonsama/kr-dev-v1-1-0-wtransme-wtransup-wtransdel';
const TRANSBOT_MANUAL_EN_LINK = 'https://steemit.com/utopian-io/@wonsama/wtrans-translation-bot-wtransme-wtransup-translate-with-comments';


/*
[ [ 'comment',
    { parent_author: 'wonsama',
      parent_permlink: 'voteview-wonsama-1530288386275',
      author: 'wonsama',
      permlink:
       're-wonsama-voteview-wonsama-1530288386275-20180706t091541980z',
      title: '',
      body: '와우 !\n\n#wtrans\n\n번역이 되냐 ?',
      json_metadata: '{"tags":["voteview","wtrans"],"app":"steemit/0.1"}' } ] ]
*/

/*
* 댓글 분석 수행 - wtransup / 상위 글 번역
* @param item 댓글정보
*/
async function wtransup(item){

	let err;

	// 댓글 링크 정보 출력
	wlog.info({
		parent_author:item.parent_author,
		parent_permlink:item.parent_permlink,
		url:`https://steemit.com/@${item.parent_author}/${item.parent_permlink}`
	},'wtransup_parent');
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wtransup_reply');

	// STEP 1 : 부모글 정보 조회 
	[err, par] = await to(steem.api.getContentAsync(item.parent_author, item.parent_permlink));	
	if(!err){

		// STEP 2 : 부모글의 body를 번역 수행
		let contents = par.body.substr(0, CUT_BODY_LENGTH);
		contents = contents.replace(/\!\[(.*?)\]\((.*?)\)/gi,'$2');	// 이미지 앞에 태그 제거
		let lang = getLang(item.body, MONITOR_COMMAND_WTRANSUP).toLowerCase();
		let trans;
		[err, trans] = await to(translate(contents, {to:lang}));
		
		if(!err){
			// STEP 3 : 댓글 작성하기
			let reply;
			let time = new Date().getTime();
			let header = `${_getLang(trans.from.language.iso)} has been translated into ${_getLang(lang)}.\n\n`;
			let footer = `created by @wonsama / id [ ${time} ] / [메뉴얼](${TRANSBOT_MANUAL_KO_LINK}) [MANUAL](${TRANSBOT_MANUAL_EN_LINK}) \n`;
			// let body = `${header}---\n${trans.text}\n\n---\n${footer}`;
			let body = striptags(trans.text, [], '\n');	// 모든 태그 제거
			body = `${header}---\n${body}\n\n---\n${footer}`;


			let wif = STEEM_TRANS_KEY_POSTING;
			let author = STEEM_TRANS_AUTHOR;
			let permlink = `${item.author}-wtrans-${time}`;	// 삭제를 위해 통일, 삭제코드는 시간
			let title = '';
			let jsonMetadata = {
				tags:['wonsama','wtrans'],
				app: STEEM_TRANS_APP,
				format: 'markdown'
			};
			[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

			if(!err){
				wlog.info({
					author:author,
					permlink:permlink,
					url:`https://steemit.com/@${author}/${permlink}`
				},'wtransup_translation');
				return Promise.resolve(reply);
			}
		}
	}

	if(err){
		// TODO : 오류가 발생하면 마지막 읽어들인 블록 정보를 이전으로 돌려서 작업 수행하는 것을 고려
		wlog.error(err, 'wtransup_analisys');
		return Promise.reject(err);
	}
	// TODO : 오류 발생건은 파일에 기록하여 수동으로 작업을 처리할 수 있는 메소드를 별도 생성
}

/*
* 댓글 분석 수행 - wtransme / 내 댓글 번역
* @param item 댓글정보
*/
async function wtransme(item){

	let err;

	// 댓글 링크 정보 출력
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wtransme_reply');

	// STEP 1 : 내글의 body를 번역 수행
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	contents = contents.replace(/\!\[(.*?)\]\((.*?)\)/gi,'$2');	// 이미지 앞에 태그 제거
	let lang = getLang(item.body, MONITOR_COMMAND_WTRANSME).toLowerCase();
	let trans;
	[err, trans] = await to(translate(contents, {to:lang}));
	
	if(!err){
		// STEP 2 : 댓글 작성하기
		let reply;
		let time = new Date().getTime();
		let header = `${_getLang(trans.from.language.iso)} has been translated into ${_getLang(lang)}.\n\n`;
		let footer = `created by @wonsama / id [ ${time} ] / [메뉴얼](${TRANSBOT_MANUAL_KO_LINK}) [MANUAL](${TRANSBOT_MANUAL_EN_LINK}) \n`;
		// let body = `${header}---\n${trans.text}\n\n---\n${footer}`;
		let body = striptags(trans.text, [], '\n');	// 모든 태그 제거
		body = `${header}---\n${body}\n\n---\n${footer}`;

		let wif = STEEM_TRANS_KEY_POSTING;
		let author = STEEM_TRANS_AUTHOR;
		let permlink = `${item.author}-wtrans-${time}`;	// 삭제를 위해 통일, 삭제코드는 시간
		let title = '';
		let jsonMetadata = {
			tags:['wonsama','wtrans'],
			app: STEEM_TRANS_APP,
			format: 'markdown'
		};
		[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

		if(!err){
			wlog.info({
				author:author,
				permlink:permlink,
				url:`https://steemit.com/@${author}/${permlink}`
			},'wtransme_translation');
			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : 오류가 발생하면 마지막 읽어들인 블록 정보를 이전으로 돌려서 작업 수행하는 것을 고려
		wlog.error(err, 'wtransme_analisys');
		return Promise.reject(err);
	}
	// TODO : 오류 발생건은 파일에 기록하여 수동으로 작업을 처리할 수 있는 메소드를 별도 생성
}

/*
* 댓글 분석 수행 - wtransdel / 번역 완료된 댓글 삭제
* @param item 댓글정보
*/
async function wtransdel(item){

	let err;

	// 댓글 링크 정보 출력
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wtransdel_reply');

	// STEP 1 : 내글의 body를 번역 수행
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	let id = getCommand(item.body, MONITOR_COMMAND_WTRANSDEL);	// id 값이라 반드시 숫자여야 됨
	if(id==null||isNaN(id)){
		let errmsg = `cmd is (${id}), cmd must number !`;
		wlog.error(errmsg, 'wtransdel_empty');
		return Promise.reject(errmsg);
	}

	// 삭제할 번역글 정보 출력
	let permlink = `${item.author}-wtrans-${id}`;
	wlog.info({
		author:item.author,
		permlink:permlink,
		id:id,
		url:`https://steemit.com/@${STEEM_TRANS_AUTHOR}/${permlink}`
	},'wtransdel_translation');
		
	// STEP 2 : 댓글 지우기
	let reply;
	[err, reply] = await to(steem.broadcast.deleteCommentAsync(STEEM_TRANS_KEY_POSTING, STEEM_TRANS_AUTHOR, permlink));
	if(!err){
		wlog.info({
			author:STEEM_TRANS_AUTHOR,
			permlink:permlink,
			url:`https://steemit.com/@${STEEM_TRANS_AUTHOR}/${permlink}`
		},'wtransdel_success');
		return Promise.resolve(reply);
	}

	if(err){
		// TODO : 오류가 발생하면 마지막 읽어들인 블록 정보를 이전으로 돌려서 작업 수행하는 것을 고려
		wlog.error(err, 'wtransdel_reply');
		return Promise.reject(err);
	}

	// STEP 3 : 삭제가 완료/실패 했다는 댓글 달아주기, 안하는게 낳을듯 또 지워야 됨 !
	// 나중에 필요시 
	
}

/*
* 댓글 분석 수행 - 진입점
*/
function init(){

	// 모니터링 시작
	monitor()

	// 댓글 정보를 얻어와 이후 작업 수행
	.then(async replies=>{

		// 커맨드를 포함한 것을 필터링 + 부모글 작성자가 wdev가 아니어야 됨
		try{

			// #wtransup (상위 글 번역)
			let replies_wtransup = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSUP)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransup){
				// 분석 수행
				await wtransup(item[1]);	// 딱히 여기도 애러처리는 안해도 될듯
			}

			// #wtransme (현재 글 번역)
			let replies_wtransme = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSME)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransme){
				// 분석 수행
				await wtransme(item[1]);	// 딱히 여기도 애러처리는 안해도 될듯
			}

			// #wtransdel (번역 글 삭제)
			let replies_wtransdel = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSDEL)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransdel){
				// 분석 수행
				await wtransdel(item[1]);	// 딱히 여기도 애러처리는 안해도 될듯
			}

		}catch(e){
			wlog.error(e, 'monitor_e');
		}
		
		// 다시 모니터링을 수행한다
		init();

	})
	.catch(err=>{
		wlog.error(err, 'monitor_err');
		init();
	});	// 오류나도 다시 모니터링 수행 
}
init();