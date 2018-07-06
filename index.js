const {monitor} = require ('./util/wmonitor');		// 스팀잇 댓글 모니터링
const {to} = require ('./util/wutil');						// async 처리
const {getLang} = require ('./util/wlangs');	// 구글번역 지원 언어 확인
const {_getLang} = require ('./util/wlangs');	// 구글번역 지원 언어 확인

const steem = require('steem');
const translate = require('google-translate-api');
const striptags = require('striptags');

const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;

const CUT_BODY_LENGTH = 5000; // 구글번역은 최대 5000자 까지 가능, 물론 split하면 되지만 5000 글자 자체가 많음.
const MONITOR_COMMAND = '#wtrans';
const MONITOR_COMMAND_REPLACE = '# wtrans';
const SHOW_DEBUG = true;

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
* 댓글 분석 수행
* @param item 댓글정보
*/
async function analisys(item){

	let err;

	if(SHOW_DEBUG){
		// 댓글 링크 정보 출력
		console.log(`parent link : https://steemit.com/@${item.parent_author}/${item.parent_permlink}`);
		console.log(`reply link : https://steemit.com/@${item.author}/${item.permlink}`);
	}

	// STEP 1 : 부모글 정보 조회 
	[err, par] = await to(steem.api.getContentAsync(item.parent_author, item.parent_permlink));	
	if(!err){

		// STEP 2 : 부모글의 body를 번역 수행
		let contents = par.body.substr(0, CUT_BODY_LENGTH);
		contents = contents.replace(/\!\[(.*?)\]\((.*?)\)/gi,'$2');	// 이미지 앞에 태그 제거
		let lang = getLang(item.body, MONITOR_COMMAND).toLowerCase();
		let trans;
		[err, trans] = await to(translate(contents, {to:lang}));
		
		if(!err){
			// STEP 3 : 댓글 작성하기
			let reply;
			let body = `${_getLang(trans.from.language.iso)} has been translated into ${_getLang(lang)}.\n\n---\n${trans.text}\n\n---\ncreated by @wonsama /  Upvote this translation if it helps :)\n`
			body = striptags(body, [], '\n');	// 모든 태그 제거

			let wif = STEEM_TRANS_KEY_POSTING;
			let author = STEEM_TRANS_AUTHOR;
			let permlink = `${item.author}-trans-${new Date().getTime()}`;
			let title = '';
			let jsonMetadata = {
				tags:['wonsama','wtrans'],
				app: 'wtrans/v1.0.0',
				format: 'markdown'
			};
			[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

			if(!err){
				if(SHOW_DEBUG){
					console.log(`translation link : https://steemit.com/@${author}/${permlink}`);
				}
				return Promise.resolve(reply);
			}
		}
	}

	if(err){
		// TODO : 오류가 발생하면 마지막 읽어들인 블록 정보를 이전으로 돌려서 작업 수행하는 것을 고려
		console.error(`analisys : ${new Date().toISOString()} - `, err);
		return Promise.reject(err);
	}
	// TODO : 오류 발생건은 파일에 기록하여 수동으로 작업을 처리할 수 있는 메소드를 별도 생성
}

/*
* 진입점 - 댓글 목록 정보를 모니터링 수행한다
*/
function init(){

	// 모니터링 시작
	monitor()

	// 댓글 정보를 얻어와 이후 작업 수행
	.then(async replies=>{

		// 커맨드를 포함한 것을 필터링 + 부모글 작성자가 wdev가 아니어야 됨
		// console.log(replies[0][1].body.indexOf(MONITOR_COMMAND), STEEM_TRANS_AUTHOR)
		try{
			replies = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let rep of replies){
				// 분석 수행
				await analisys(rep[1]);	// 딱히 여기도 애러처리는 안해도 될듯 윗 부분에서 처리
			}	
		}catch(e){
			console.error(`monitor fail : `, e);
		}
		
		// 다시 모니터링을 수행한다
		init();

	})
	.catch(init);	// 오류나도 다시 모니터링 수행 
}
init();