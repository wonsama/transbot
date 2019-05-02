// 설정 정보를 읽어들인다 
require('dotenv').config();

// project utils
const {monitor} = require ('./util/wmonitor');		// monitoring
const {toBoolean} = require ('./util/wutil');			// is true ?
const wlog = require('./util/wlog');							// logs

// const wjankenpo = require ('./cmd/wjankenpo');		// wjankenpo
const wdice 		= require ('./cmd/wdice');				// wdice
const wdstat 		= require ('./cmd/wdstat');				// wdstat
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
		// 'content'
		'transfer', 
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
				// wtransup, wtransme, wtransdel, 
				wdice,
				wdstat, 
				// wjankenpo
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