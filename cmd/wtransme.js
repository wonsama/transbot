const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const wlog = require('../util/wlog');							// logs
const {_getLang} = require ('../util/wlangs');			// check languages
const {getLang} = require ('../util/wlangs');			// check languages

const steem = require('steem');											// steem api
const translate = require('google-translate-api');	// google translator
const striptags = require('striptags');							// strip tags

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 20 * 1000;
const CUT_BODY_LENGTH = 5000; 				// max is 5000

// manual link
const TRANSBOT_MANUAL_KO_LINK = 'https://steemit.com/kr/@wonsama/kr-dev-v1-1-0-wtransme-wtransup-wtransdel';
const TRANSBOT_MANUAL_EN_LINK = 'https://steemit.com/utopian-io/@wonsama/wtrans-translation-bot-wtransme-wtransup-translate-with-comments';

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testme':'#wtransme';

let fn = {};

fn.name = MONITOR_COMMAND;

/*
* translate current sentense
* @param item replies
*/
fn.command = async (item) =>{

	let err;

	// print replies log
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wtransme_reply');

	// STEP 1 : Perform translation of the typed comment.
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	contents = contents.replace(/\!\[(.*?)\]\((.*?)\)/gi,'$2');	// remove markdown image tag
	let lang = getLang(item.body, MONITOR_COMMAND).toLowerCase();
	let trans;
	[err, trans] = await to(translate(contents, {to:lang}));
	
	if(!err){
		// STEP 2 : create comment
		let reply;
		let time = new Date().getTime();
		let header = `${_getLang(trans.from.language.iso)} has been translated into ${_getLang(lang)}.\n\n`;
		let footer = `created by @wonsama / id [ ${time} ] / [메뉴얼](${TRANSBOT_MANUAL_KO_LINK}) / [MANUAL](${TRANSBOT_MANUAL_EN_LINK}) \n`;
		let body = striptags(trans.text, [], '\n');	// Remove All Tags
		body = `${header}---\n${body}\n\n---\n${footer}`;

		let wif = STEEM_TRANS_KEY_POSTING;
		let author = STEEM_TRANS_AUTHOR;
		let permlink = `${item.author}-wtrans-${time}`;	// make permlink same way
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
			},'wtransme_translation_wait');

			// wait for 20 sec.
			await to(sleep(WAIT_FOR_REPLY));

			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wtransme_analisys');
		return Promise.reject(err);
	}
}

module.exports = fn;