const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const {rndInt} = require ('../util/wutil');				// get random int value
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 20 * 1000;
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testdice':'#wdice';

let fn = {};

fn.name = MONITOR_COMMAND;

/*
* run dice
* @param item replies
*/
fn.command = async (item) =>{

	let err;

	// print replies log
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wdice_start');

	// STEP 0 : get contents information & check is modified
	let cur;
	[err, cur] = await to(steem.api.getContentAsync(item.author, item.permlink));
	if(!err){
		if(cur.created!=cur.last_update){
			return Promise.reject(`https://steemit.com/@${item.author}/${item.permlink} is modified contents.`);
		}
	}

	// STEP 1 : get information of the typed comment.
	let range = getCommand(item.body, MONITOR_COMMAND);	// max value must be numeric
	let start = DEFAULT_MIN;
	let end = DEFAULT_MAX;
	if(range){
		let ss = range.split(',');
		if(ss.length==1 && !isNaN(ss[0])){
			end = Number(ss[0]);
		}else if(ss.length>=2 && !isNaN(ss[0]) && !isNaN(ss[1])){
			start = Number(ss[0]);
			end = Number(ss[1]);
		}
	}
		
	if(!err){
		// STEP 2 : create comment
		let reply;
		let time = new Date().getTime();
		let body = `🎲주사위를 굴려 ${rndInt(start,end)} 이(가) 나왔습니다.`;

		let wif = STEEM_TRANS_KEY_POSTING;
		let author = STEEM_TRANS_AUTHOR;
		let permlink = `${item.author}-wdice-${time}`;	// make permlink same way
		let title = '';
		let jsonMetadata = {
			tags:['wonsama','wdice'],
			app: STEEM_TRANS_APP,
			format: 'markdown'
		};
		[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

		if(!err){
			wlog.info({
				author:author,
				permlink:permlink,
				url:`https://steemit.com/@${author}/${permlink}`
			},'wdice_reply_wait');

			// wait for 20 sec.
			await to(sleep(WAIT_FOR_REPLY));

			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wdice_error');
		return Promise.reject(err);
	}
}

module.exports = fn;