const {to} = require ('../util/wutil');					// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const {rndInt} = require ('../util/wutil');				// get random int value
const wlog = require('../util/wlog');					// logs

const steem = require('steem');							// steem api

const dateformat = require('dateformat');

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 3 * 1000;
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;

const TIME_FMT= 'yy.mm.dd HH:MM:ss';

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testcome':'#wcome';

const SUPER_USER = 'wonsama'; // 내 글이 아니여도 wcome 을 호출 할 수 있음

let fn = {};

fn.name = MONITOR_COMMAND;

const to_date_time = (created) => new Date(`${created}.000Z`).getTime();

async function getRepliesFlat(author, permlink, output=[]){
    let items = await steem.api.getContentRepliesAsync(author, permlink);
    let children = [];
    for(let item of items){
        output.push(item);
        if(item.children!=0){
            children.push(getRepliesFlat(item.author, item.permlink, output));
        }
    }
    await Promise.all(children);
    return output;
} 

/*
* run wcome
* @param item replies
*/
fn.command = async (item) =>{

 	// STEP 0 : 현재 글 정보를 가져온다
	let err;
	let res;
	let cur;
	[err, cur] = await to(steem.api.getContentAsync(item.author, item.permlink));
	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wcome_error_1');
		return Promise.reject(err);
	}
	if(item.author!=SUPER_USER && item.author!=cur.root_author){
		err = `wcome is called but between author(${item.author}) and root_author(${cur.root_author}) is difference.`;
		wlog.error(err, 'wcome_error_author');
		return Promise.reject(err);
	}
	let author = cur.root_author;
	let permlink = cur.root_permlink;

	// 로깅 START
	wlog.info({
		url:`https://steemit.com/@${author}/${permlink}`,
		permlink:permlink,
		author:author
	},'wcome_get_author_info');

	// STEP 1 : 글의 전체 댓글 목록을 가져온다
	[err, res] = await to(getRepliesFlat(author, permlink));
	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wcome_error_2');
		return Promise.reject(err);
	}

	// 댓글 목록 정보 필터링
	res.sort((a,b)=>to_date_time(a.created)-to_date_time(b.created));
	let rep = [];
	res = res.map(x=>{
		let is_inc = rep.includes(x.author);
		if(!is_inc){
			rep.push(x.author);
			return x;
		}
		return undefined;
	}).filter(x=>x).filter(x=>x.author!=author && STEEM_TRANS_AUTHOR!=author);	// 작성자 대댓글은 제외, wdev

	let textout = [];
	textout.push(`"${res[0].root_title}" (선착순 댓글 모음)`);
	textout.push(``);
	textout.push(`|순위|작성자|댓글|시간|`);
	textout.push(`|-|-|-|-|`);
	let idx = 1;
	for(let r of res){
		let df = dateformat(new Date(`${r.created}.000Z`), 'yy.mm.dd HH:MM:ss')
		let body = r.body.replace(/\n/gi,'');
		if(body.length>20){
			body = `${body.substring(0,20)}...`;
		}
		textout.push(`|${idx}|${r.author}|${body}|${df}|`);
		idx++;
	}
	textout.push(``);
	textout.push(`last update time : ${dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss')}`);
	// console.log(textout.join('\n'));
	// console.log();

	// STEP 2 : 댓글 작성처리
	let title = '';
	let jsonMetadata = {
		tags:['wonsama','wcome'],
		app: STEEM_TRANS_APP,
		format: 'markdown'
	};
	[err, reply] = await to(steem.broadcast.commentAsync(STEEM_TRANS_KEY_POSTING, author, permlink, STEEM_TRANS_AUTHOR, permlink+'-wcome', title, textout.join('\n'), jsonMetadata));

	if(!err){
		// 로깅 START
		wlog.info({
			url:`https://steemit.com/@${author}/${permlink}`,
			permlink:permlink,
			author:author
		},'wdstat_reply_statstics_done');

		return Promise.resolve(textout);
	}
}

module.exports = fn;