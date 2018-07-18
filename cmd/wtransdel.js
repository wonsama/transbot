const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 20 * 1000;
const CUT_BODY_LENGTH = 5000; 				// max is 5000

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testdel':'#wtransdel';

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
	},'wtransdel_reply');

	// STEP 1 : get information of the typed comment.
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	let id = getCommand(item.body, MONITOR_COMMAND);	// id Value must be numeric
	if(id==null||isNaN(id)){
		let errmsg = `cmd is (${id}), cmd must number !`;
		wlog.error(errmsg, 'wtransdel_empty');
		return Promise.reject(errmsg);
	}

	// Print the translation information to delete
	let permlink = `${item.author}-wtrans-${id}`;
	wlog.info({
		author:item.author,
		permlink:permlink,
		id:id,
		url:`https://steemit.com/@${STEEM_TRANS_AUTHOR}/${permlink}`
	},'wtransdel_translation');
		
	// STEP 2 : delete comments
	let reply;
	[err, reply] = await to(steem.broadcast.deleteCommentAsync(STEEM_TRANS_KEY_POSTING, STEEM_TRANS_AUTHOR, permlink));
	if(!err){
		wlog.info({
			author:STEEM_TRANS_AUTHOR,
			permlink:permlink,
			url:`https://steemit.com/@${STEEM_TRANS_AUTHOR}/${permlink}`
		},'wtransdel_success');

		// delete is no wait !

		return Promise.resolve(reply);
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wtransdel_reply');
		return Promise.reject(err);
	}

	// if needed
	// STEP 3 : Comment that deletion has been completevery
}

module.exports = fn;