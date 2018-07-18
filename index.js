// project utils
const {monitor} = require ('./util/wmonitor');		// monitoring
const {to} = require ('./util/wutil');						// async 
const {getLang} = require ('./util/wlangs');			// check languages
const {getCommand} = require ('./util/wlangs');		// Extract Commands
const {_getLang} = require ('./util/wlangs');			// check languages
const {rndInt} = require ('./util/wutil');				// get random int value
const {toBoolean} = require ('./util/wutil');			// is true ?
const wlog = require('./util/wlog');							// logs


// 3rd party api
const steem = require('steem');											// steem api
const translate = require('google-translate-api');	// google translator
const striptags = require('striptags');							// strip tags

// load environment properties
const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);

// Commands to watch
const IS_TEST_MODE = true;						// set test mode
const CUT_BODY_LENGTH = 5000; 				// max is 5000
const MONITOR_COMMAND_WTRANSUP = IS_TEST_MODE?'#testup':'#wtransup';
const MONITOR_COMMAND_WTRANSME = IS_TEST_MODE?'#testme':'#wtransme';
const MONITOR_COMMAND_WTRANSDEL = IS_TEST_MODE?'#testdel':'#wtransdel';
const MONITOR_COMMAND_WDICE = IS_TEST_MODE?'#testdice':'#wdice';

// manual link
const TRANSBOT_MANUAL_KO_LINK = 'https://steemit.com/kr/@wonsama/kr-dev-v1-1-0-wtransme-wtransup-wtransdel';
const TRANSBOT_MANUAL_EN_LINK = 'https://steemit.com/utopian-io/@wonsama/wtrans-translation-bot-wtransme-wtransup-translate-with-comments';

/*

sample of reponse

[ [ 'comment',
    { parent_author: 'wonsama',
      parent_permlink: 'voteview-wonsama-1530288386275',
      author: 'wonsama',
      permlink:
       're-wonsama-voteview-wonsama-1530288386275-20180706t091541980z',
      title: '',
      body: 'wow !\n\n#wtrans\n\ntranslate is possible ?',
      json_metadata: '{"tags":["voteview","wtrans"],"app":"steemit/0.1"}' } ] ]
*/

/*
* analisys - wtransup / translate parent text
* @param item replies
*/
async function wtransup(item){

	let err;

	// print replies log
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

	// STEP 1 : get parent contents information
	[err, par] = await to(steem.api.getContentAsync(item.parent_author, item.parent_permlink));	
	if(!err){

		// STEP 2 : Perform translation of the parent content.
		let contents = par.body.substr(0, CUT_BODY_LENGTH);
		contents = contents.replace(/\!\[(.*?)\]\((.*?)\)/gi,'$2');	// remove markdown image tag
		let lang = getLang(item.body, MONITOR_COMMAND_WTRANSUP).toLowerCase();
		let trans;
		[err, trans] = await to(translate(contents, {to:lang}));
		
		if(!err){
			// STEP 3 : create comment
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
				},'wtransup_translation');
				return Promise.resolve(reply);
			}
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wtransup_analisys');
		return Promise.reject(err);
	}
}

/*
* analisys - wtransme / translate typed text
* @param item replies
*/
async function wtransme(item){

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
	let lang = getLang(item.body, MONITOR_COMMAND_WTRANSME).toLowerCase();
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
			},'wtransme_translation');
			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wtransme_analisys');
		return Promise.reject(err);
	}
}


/*
* analisys - wtransme / delete translate text by id
* @param item replies
*/
async function wtransdel(item){

	let err;

	// print replies log
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wtransdel_reply');

	// STEP 1 : get information of the typed comment.
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	let id = getCommand(item.body, MONITOR_COMMAND_WTRANSDEL);	// id Value must be numeric
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

/*
* run dice
* @param item replies
*/
async function wdice(item){

	// 🎲

	let err;

	// print replies log
	wlog.info({
		author:item.author,
		permlink:item.permlink,
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wdice_start');

	// STEP 1 : get information of the typed comment.
	let contents = item.body.substr(0, CUT_BODY_LENGTH);
	let range = getCommand(item.body, MONITOR_COMMAND_WDICE);	// max value must be numeric
	// if(id==null||isNaN(id)){
	// 	let errmsg = `cmd is (${id}), cmd must number !`;
	// 	wlog.error(errmsg, 'wtransdel_empty');
	// 	return Promise.reject(errmsg);
	// }
	let start = 1;
	let end = 100;
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
			},'wdice_reply');
			return Promise.resolve(reply);
		}
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wdice_error');
		return Promise.reject(err);
	}
}

/*
* entry point
*/
function init(){



	// start monitoring
	monitor()

	// get comments information to perform next actions.
	.then(async replies=>{

		// Filter with command + Not equal parent writer and reply author.
		try{

			// #wtransup (translation of parent)
			let replies_wtransup = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSUP)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransup){
				// Perform Analysis
				await wtransup(item[1]);	// No need to error handling
			}

			// #wtransme (translation of typed)
			let replies_wtransme = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSME)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransme){
				// Perform Analysis
				await wtransme(item[1]);	// No need to error handling
			}

			// #wtransdel (delete translation)
			let replies_wtransdel = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WTRANSDEL)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wtransdel){
				// Perform Analysis
				await wtransdel(item[1]);	// No need to error handling
			}

			// #wdice
			let replies_wdice = replies.filter(data=>data[1].body.indexOf(MONITOR_COMMAND_WDICE)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
			for(let item of replies_wdice){
				// Perform Analysis
				await wdice(item[1]);	// No need to error handling
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
wlog.info('start program');