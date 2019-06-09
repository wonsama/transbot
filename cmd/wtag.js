const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const {rndInt} = require ('../util/wutil');				// get random int value
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const dateformat = require('dateformat');
const wrpc = require('../util/wrpc');

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 3 * 1000;
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testtag':'#wtag';

let fn = {};

fn.name = MONITOR_COMMAND;

// 태그 기준 최신글 limit 개를 가져온다
const get_tag_top10 = (tag, item, limit=10) =>{
	const method = "tags_api.get_discussions_by_created";
	const params = {
		tag : tag,
		limit : limit,
		truncate_body : 0
	}
	return wrpc.send_rpc(method, params)
	.then(res=>{
		let out = [];
		let idx = 1;
		let ori_link = `https://steemd.com/whan/@${STEEM_TRANS_AUTHOR}/${item.permlink}-wtag`;

		out.push(`<strong>${params.tag.toUpperCase()}</strong> 태그 최신글  ${limit} 개`);
		out.push(`<code>작성시간 : ${dateformat(new Date(), 'yyyy.mm.dd HH:MM:ss')}</code>`);//<div class='pull-right'></div>
		out.push(``);
		out.push(`|A|T|`);
		out.push(`|-|-|`);
		for(let r of res){
			let d = dateformat(new Date(`${r.created}.000Z`), 'HH:MM:ss');
			out.push(`|@${r.author}|[${r.title}](https://steemit.com/@${r.author}/${r.permlink})|`);
			idx++;
		}
		out.push(``);
		out.push(`<center><a href="/@whan.dev ">WHAN DEVTEAM</a> | <a href='/@wonsama/wtag-useage-kr'>#wtag 사용법</a> | <a href='${ori_link}'>markdown</a><br/><sub>이 글이 좋았다면 ? 업보팅 !</sub></center>`);
		return out.join('\r\n');
	})
}

/*
* run dice
* @param item replies
*/
fn.command = async (item) =>{

	let author = item.author;
	let permlink = item.permlink;
	let tag = getCommand(item.body, MONITOR_COMMAND).replace(/\s/,'');
	let limit = 10;


	wlog.info({
			url:`https://steemit.com/@${author}/${permlink}`,
			permlink:permlink,
			author:author,
			command:tag
		},'wtag_detected');

	if(!tag || tag==''){
		// 로깅 - 호출한 사람의 정보를 기록
		wlog.info({
			url:`https://steemit.com/@${author}/${permlink}`,
			permlink:permlink,
			author:author,
			message:'tag is empty'
		},'wtag_reply_fail');
		return Promise.resolve('fail');
	}else{
		let _tags = tag.split(',');
		tag = _tags[0];
		limit = _tags.length>1?parseInt(_tags[1]):10;
		if(isNaN(limit)){
			limit = 10;
		}else if(limit>100){
			limit = 100;
		}
	}
	let message = await get_tag_top10(tag, item, limit);
	// wlog.info({
	// 		message:message
	// 	},'message');

	// STEP 2 : 댓글 작성처리
	let title = '';
	let jsonMetadata = {
		tags:['wonsama','wtag','sct','aaa','spt'],
		app: STEEM_TRANS_APP,
		format: 'markdown'
	};
	[err, reply] = await to(steem.broadcast.commentAsync(STEEM_TRANS_KEY_POSTING, author, permlink, STEEM_TRANS_AUTHOR, permlink+'-wtag', title, message, jsonMetadata));
	// wlog.info({
	// 		reply:reply,
	// 		err:err
	// 	},'reply');

	if(!err){
		// 로깅 - 호출한 사람의 정보를 기록
		wlog.info({
			url:`https://steemit.com/@${author}/${permlink}`,
			permlink:permlink,
			author:author
		},'wtag_reply_done');

		return Promise.resolve(message);
	}
}

module.exports = fn;