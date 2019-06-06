// 설정 정보를 읽어들인다 
require('dotenv').config();

const wfile = require('./util/wfile');									// file util
const steem = require('steem');											// steem api

// project utils
const {monitor} = require ('./util/wmonitor');		// monitoring
const {toBoolean} = require ('./util/wutil');			// is true ?
const wlog = require('./util/wlog');							// logs

// const wjankenpo = require ('./cmd/wjankenpo');		// wjankenpo
const wdice 		= require ('./cmd/wdice');				// wdice
const wdstat 		= require ('./cmd/wdstat');				// wdstat
const wcome 		= require ('./cmd/wcome');				// wdstat
const wvoting 		= require ('./cmd/wvoting');				// wvoting
// const wtransdel = require ('./cmd/wtransdel');		// wtransdel
// const wtransme 	= require ('./cmd/wtransme');			// wtransdel
// const wtransup 	= require ('./cmd/wtransup');			// wtransdel
const wtrain = require('./cmd/wtrain');

// const wvotetrain 	= require ('./cmd/wvotetrain');	// wvotetrain

// const wfriends 	= require ('./cmd/wfriends');			// wfriends
// const wvips 	= require ('./cmd/wvips');			// wvips

const STEEM_AUTHOR = process.env.STEEM_AUTHOR;
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);

const STEEM_VOTING = 'wonsama';
const STEEM_VOTING_POSTING = process.env[`ENV_AUTHOR_KEY_POSTING_${STEEM_VOTING}`];

const TRAIN_IDS = (process.env.TRAIN_IDS||'').split(',').map(x=>x.replace(/\s/gi,''));


/*
* entry point
*/
function init(){

	// start monitoring
	// available type : reply, vote, content
	// monitor(['reply', 'vote', 'content'])
	monitor(
		[
		'reply', 
		// 'vote',
		'content',
		'transfer' 
		]
	)

	// get comments information to perform next actions.
	.then(async items=>{

		// 주의 : 정확한 데이터는 getContent 를 통해 상세 정보를 확인해야 됨. block 상에서는 간단한 operation 정보만 담겨져 있음
		// 그래서 변경된것은 @@로 시작한 것 으로 파악해야 됨 ㅜㅜ (짧은 글은 @@도 포함 안됨에 유의)


		// Filter with command + Not equal parent writer and reply author.
		try{

			// 댓글 모니터 - 당사자 본인의 댓글은 모니터링 하지 않음
			const mon_reply = [
				wdice,
				wdstat, 
				wcome
			];
			for(let mon of mon_reply){
				// do not process modified posts : data[1].body.indexOf("@@")!=0
				let ritem = items.reply;
				// console.log(ritem);
				if(ritem){
					let filtered = ritem.filter(data=>data[1].body.indexOf("@@")!=0 && data[1].body.indexOf(mon.name)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
					for(let item of filtered){
						// Perform Analysis
						await mon.command(item[1]);	// No need to error handling
					}	
				}
			}

			const mon_transfer = [
				wtrain
			];
			for(let mon of mon_transfer){
				// do not process modified posts : data[1].body.indexOf("@@")!=0
				let ritem = items.transfer;
				// console.log(ritem);
				if(ritem){

					// const id_to = ritem[1].to;
					// const amount = parseFloat(ritem[1].amount.split(' ')[0]);
					
					// let filtered = ritem.filter(data=>id_to=='wdev' && amount>0.001);
					for(let item of ritem){
						// Perform Analysis
						await mon.command(item[1]);	// No need to error handling
					}	
				}
			}

			const mon_content = [
				wvoting
			];
			for(let mon of mon_content){
				// do not process modified posts : data[1].body.indexOf("@@")!=0
				let ritem = items.content;
				// console.log(ritem);
				if(ritem){

					// const id_to = ritem[1].to;
					// const amount = parseFloat(ritem[1].amount.split(' ')[0]);
					
					// 수정 글 제외
					let filtered = ritem.filter(data=>data[1].body.indexOf("@@")!=0);	
					for(let item of filtered){
						// Perform Analysis
						await mon.command(item[1]);	// No need to error handling
					}	
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


// 매 1분 단위로 작업을 수행한다 
async function timeCheck(){

	const PATH_VOTING_TIME = './voting_time.json';
	const PATH_VOTING_LIST = './voting_list.json';
	const MIN_15 = 1000 * 60 * 15;

	console.log('::::: timeCheck :::::');

	// 파일 존재여부 파악 - 하위에서 생성
	if(wfile.isNotExist(PATH_VOTING_LIST) || wfile.isNotExist(PATH_VOTING_LIST) ){
		return;
	}

	let vt = JSON.parse(wfile.read(PATH_VOTING_TIME));
	let list = JSON.parse(wfile.read(PATH_VOTING_LIST));



	if(list.length>=1){
		let first = list.slice(0,1)[0];
		let reamin = list.slice(1);

		// 글쓴 시간이 15분 이상 지났는지 여부를 확인한다.
		let now = new Date().getTime();
		let time = first.time;

		// console.log(first)
		// console.log('has upvoting', 'remain sec', (time + MIN_15 - now) / 1000 );
		// console.log(STEEM_VOTING, STEEM_VOTING_POSTING, first.author, first.permlink);

		if( time + MIN_15 < now ){
			
			// 첫번째 글에 대한 보팅을 수행한다 
			// await steem.broadcast.sendAsync(
			// {
			// 	operations: [
			//       'vote',
			//         {
			//           voter : STEEM_VOTING,
			//           author : first.author,
			//           permlink : first.permlink,
			//           weight : 10000 // 10000 = 100%
			//         }
			//     ],
			// 	extensions: [] 
			// },
			// 	{ posting: STEEM_VOTING_POSTING }
			// );

			try{
				let weight = first.weight?first.weight:1000;
				await steem.broadcast.voteAsync(STEEM_VOTING_POSTING, STEEM_VOTING, first.author, first.permlink, weight);
				wlog.info(`auto voted ::: https://steemit.com/@${first.author}/${first.permlink} with ${weight/100} %`);

				// scot 보팅
				if(first.tags){
					if(first.tags.includes('aaa')){
						let _wif = process.env[`ENV_AUTHOR_KEY_POSTING_wonsama.aaa`];
						steem.broadcast.voteAsync(_wif, 'wonsama.aaa', first.author, first.permlink, weight);
					}
					if(first.tags.includes('sct')){
						let _wif = process.env[`ENV_AUTHOR_KEY_POSTING_wonsama.sct`];
						steem.broadcast.voteAsync(_wif, 'wonsama.sct', first.author, first.permlink, weight);
					}
				}

				// 개때 보팅
				if(weight>=10000){
					wlog.info(`dogs run : ${TRAIN_IDS[0]} ~ ${TRAIN_IDS[TRAIN_IDS.length-1]} ::: ${TRAIN_IDS}`);
					for(let t of TRAIN_IDS){
						let _wif = process.env[`ENV_AUTHOR_KEY_POSTING_${t}`];
						steem.broadcast.voteAsync(_wif, t, first.author, first.permlink, weight);
					}
				}else{
					wlog.info(`dogs run fail weight is ${weight}`);
				}

			}catch(e){
				// 일반적으로 이미 보팅한 경우나 네트워크 오류인 경우임 , 이런 경우는 안타깝지만 PASS 
				// 구분도 가능하나 귀차니즘
				wlog.info(`auto voted fail ::: https://steemit.com/@${first.author}/${first.permlink}`);
			}
			
			vt[first.author] = new Date().getTime();				// 보팅 시간 업데이트 처리
			wfile.write(PATH_VOTING_TIME, JSON.stringify(vt));		// 최종 보팅시간 업데이트
			wfile.write(PATH_VOTING_LIST, JSON.stringify(reamin));	// 보팅 대기열에서 제거처리
		}
	}

	// 60초 단위로 점검을 수행한다 
	setTimeout(timeCheck,1000*60);
}
timeCheck();