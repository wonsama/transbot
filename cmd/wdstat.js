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
const WAIT_FOR_REPLY = 3 * 1000;
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testdstat':'#wdstat';

let fn = {};

fn.name = MONITOR_COMMAND;

async function getReplies(author, permlink, output=[]){
    let items = await steem.api.getContentRepliesAsync(author, permlink);
    let children = [];
    for(let item of items){
        output.push(item);
        if(item.children!=0){
            item.c = [];
            children.push(getReplies(item.author, item.permlink, item.c));
        }
    }
    await Promise.all(children);
    return output;
} 

async function getRepliesFlat(author, permlink, output=[]){
    let items = await steem.api.getContentRepliesAsync(author, permlink);
    let children = [];
    for(let item of items){
        output.push(item);
        if(item.children!=0){
            children.push(getReplies(item.author, item.permlink, output));
        }
    }
    await Promise.all(children);
    return output;
} 

function getNum(arr){
    for(let a of arr){
        if(!isNaN(a)){
            return Number(a);
        }    
    }
    return 0;
}

/*
* run dice
* @param item replies
*/
fn.command = async (item) =>{

	// { parent_author: 'centering',
 //      parent_permlink: 're-leeyh-re-centering-rc-20180927t141525955z',
 //      author: 'leeyh',
 //      permlink: 're-centering-re-leeyh-re-centering-rc-20180927t142406026z',
 //      title: '',
 //      body: '네 SMT로 스팀 대박날거 같은 조짐으로 받아들이려고요^^',
 //      json_metadata: '{"tags":["kr"],"app":"steemit/0.1"}' }

 	// STEP 0 : 현재 글 정보를 가져온다
	let err;
	let res;
	let cur;
	[err, cur] = await to(steem.api.getContentAsync(item.author, item.permlink));
	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wdstat_error_1');
		return Promise.reject(err);
	}
	let author = cur.root_author;
	let permlink = cur.root_permlink;

	// STEP 1 : 글의 전체 댓글 목록을 가져온다
	[err, res] = await to(getRepliesFlat(author, permlink));
	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wdstat_error_2');
		return Promise.reject(err);
	}

	res = res.filter(x=>x.author=='wdev');
	let out = [];
	for(let r of res){
		let time = new Date(r.created);
		let num = getNum(r.body.split(' '));
		out.push({
			time: time.getTime(),
			timet : dateformat(time, 'yyyy-mm-dd HH:MM:ss'),
			num : num,
			nump : num.toString().padStart(3, ' '),
			author : r.parent_author
		});
	}

	// 결과 값 정렬 처리
	out.sort((a,b)=>{
		if(b.num==a.num){
			// 먼저 주사위 굴린 사람 순서로 정렬
			return a.time - b.time;
		}
			// 번호 큰 순서대로 정렬 
			return b.num-a.num;
		}
	);

	let textout = [];
	textout.push(`"${res[0].root_title}" 의 주사위 통계`);
	textout.push(``);
	textout.push(`|rank|author|dice|time|`);
	textout.push(`|-|-|-|-|`);
	let no = 1;
	for(let o of out){
		textout.push(`|${no}|${o.author}|${o.num}|${o.timet}|`);
		no++;
	}
	textout.push(``);
	console.log(textout.join('\n'));
	console.log(`last update time : ${dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss')}`);

	if(!err){
		return Promise.resolve(reply);
	}
}

module.exports = fn;