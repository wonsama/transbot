// project utils
const {monitor} = require ('./util/wmonitor');		// monitoring
const {toBoolean} = require ('./util/wutil');			// is true ?
const wlog = require('./util/wlog');							// logs

const wjankenpo = require ('./cmd/wjankenpo');		// wjankenpo
const wdice 		= require ('./cmd/wdice');				// wdice
const wtransdel = require ('./cmd/wtransdel');		// wtransdel
const wtransme 	= require ('./cmd/wtransme');			// wtransdel
const wtransup 	= require ('./cmd/wtransup');			// wtransdel

const wvotetrain 	= require ('./cmd/wvotetrain');	// wvotetrain

const wfriends 	= require ('./cmd/wfriends');			// wfriends
const wvips 	= require ('./cmd/wvips');			// wvips

const STEEM_AUTHOR = process.env.STEEM_AUTHOR;
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);

/*
* entry point
*/
function init(){

	// start monitoring
	// available type : reply, vote, content
	// monitor(['reply', 'vote', 'content'])
	monitor(['reply', 'vote', 'content'])

	// get comments information to perform next actions.
	.then(async items=>{

		// 주의 : 정확한 데이터는 getContent 를 통해 상세 정보를 확인해야 됨. block 상에서는 간단한 operation 정보만 담겨져 있음
		// 그래서 변경된것은 @@로 시작한 것 으로 파악해야 됨 ㅜㅜ (짧은 글은 @@도 포함 안됨에 유의)


		// Filter with command + Not equal parent writer and reply author.
		try{

			// 댓글 모니터 - 당사자 본인의 댓글은 모니터링 하지 않음
			const mon_reply = [
				wtransup, wtransme, wtransdel, wdice, wjankenpo
			];
			for(let mon of mon_reply){
				// do not process modified posts : data[1].body.indexOf("@@")!=0
				let ritem = items.reply;
				// console.log(ritem);
				let filtered = ritem.filter(data=>data[1].body.indexOf("@@")!=0 && data[1].body.indexOf(mon.name)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
				for(let item of filtered){
					// Perform Analysis
					await mon.command(item[1]);	// No need to error handling
				}
			}

			// 본문 모니터
			// wfriends : 등록한 친구 새글 알림 (1일 1포스트 - 댓글로 친구의 새글 정보 기록)
			// wanotation : 나를 언급한 것에 대해 알림  (1일 1포스트 - 댓글로 언급한 포스팅의 정보 기록)
			const mon_content = [
				wfriends,
				wvips
				// , wanotation
			];
			for(let mon of mon_content){

				// do not process modified posts : data[1].body.indexOf("@@")!=0
				let ritem = items.content;
				let filtered = ritem.filter(data=>data[1].body.indexOf("@@")!=0 && mon.name.includes(data[1].author) && data[1].author!=STEEM_TRANS_AUTHOR);
				for(let item of filtered){
					// Perform Analysis
					await mon.command(item[1]);	// No need to error handling
				}
			}

			// 보팅 모니터 - STEEM_AUTHOR가 보팅할 경우 모니터링
			const mon_vote = [
				wvotetrain
			];
			for(let mon of mon_vote){
				let ritem = items.vote;
				let filtered = ritem.filter(data=>data[1].voter==STEEM_AUTHOR);
				for(let item of filtered){
					// Perform Analysis
					await mon.command(item[1]);	// No need to error handling
				}
			}

		}catch(e){
			wlog.error(e, 'monitor_e');
		}
		
		// Perform monitoring again when an error occurs.
		init();

	})
	.catch(err=>{

		// Perform monitoring again
		wlog.error(err, 'monitor_err');
		init();
	});
}
init();
wlog.info(`start program as ${STEEM_TRANS_IS_TEST?'test mode':'production mode'}`);