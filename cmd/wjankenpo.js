const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 20 * 1000;

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testjankenpo':'#wjankenpo';

let fn = {};

fn.name = MONITOR_COMMAND;

/*
* Do it Jan Ken Po & Make reply
* @param reply
*/
fn.command = async (item) =>{

	let err;

	// print replies log
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wdice_start');

	if(!err){
		// STEP 1 : create comment
		let reply;
		let time = new Date().getTime();
		let jkp_num = Math.floor(Math.random()*3)%3;
		let jkpe = ["✌️","✊","🖐"];
		let jkpt = ["가위","바위","보"];
		let body = `가위,바위,보 ~ @${item.author} 님께서 ${jkpt[jkp_num]}(${jkpe[jkp_num]}) 을(를) 내셨습니다.`;

		let wif = STEEM_TRANS_KEY_POSTING;
		let author = STEEM_TRANS_AUTHOR;
		let permlink = `${item.author}-wjankenpo-${time}`;	// make permlink same way
		let title = '';
		let jsonMetadata = {
			tags:['wonsama','wjankenpo'],
			app: STEEM_TRANS_APP,
			format: 'markdown'
		};
		[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

		if(!err){
			wlog.info({
				author:author,
				permlink:permlink,
				url:`https://steemit.com/@${author}/${permlink}`
			},'wjankenpo_reply_wait');

			// wait for 20 sec.
			await to(sleep(WAIT_FOR_REPLY));

			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wjankenpo_error');
		return Promise.reject(err);
	}
}

module.exports = fn;