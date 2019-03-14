const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const {getCommand} = require ('../util/wlangs');		// Extract Commands
const {rndInt} = require ('../util/wutil');				// get random int value
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api
const wsteem = require('../util/wsteem');

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_KEY_POSTING = process.env.STEEM_TRANS_KEY_POSTING;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 3 * 1000;
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;

const MONITOR_COMMAND = STEEM_TRANS_IS_TEST?'#testdice':'#wdice';

let fn = {};

fn.name = MONITOR_COMMAND;

let ad_idx = 0;
const ADS_LIST = [
	{
		text:'안녕하세요, happyberrysboy 입니다', 
		link:'https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmU8hwnAWm29BmczzrLHGfxPhDsUyr8VQwF8UiFdRrFgjY/%EC%83%88%20%ED%8C%8C%EC%9D%BC%202019-02-27%2017.53.44_2.jpg', 
		author:'happyberrysboy'
	},
	{
		text:'엘지그린마트 - 경기도 시흥시 정왕동 1499-6, 104호', 
		link:'http://naver.me/FiNg2ubB', 
		author:'kgbinternational'
	},
	{
		text:'[wdice] 광고주 대 모집', 
		link:'https://steemit.com/wdice/@wonsama/6dqbxi-wdice', 
		author:'wonsama'
	},
];
let get_ad = () => {
	let ad = ADS_LIST[ad_idx];
	ad_idx++;
	if(ad_idx>=ADS_LIST.length){
		ad_idx=0;
	}
	return ad;
}


/*
eceived from happyberrysboy1.000 STEEM

20 hours ago

안녕하세요~ [happyberrysboy](/@happyberrysboy)입니다. // 링크 : https://steemitimages.com/640x0/https://cdn.steemitimages.com/DQmU8hwnAWm29BmczzrLHGfxPhDsUyr8VQwF8UiFdRrFgjY/%EC%83%88%20%ED%8C%8C%EC%9D%BC%202019-02-27%2017.53.44_2.jpg

Received from kgbinternational1.000 STEEM

20 hours ago

엘지그린마트 경기도 시흥시 정왕동 1499-6, 104호
*/

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

	// CHECK BANNED ACCOUNT
	// manimoa, simmania, simmanis 계정 차단 해제 요청
	const BANNED = [
		// "manimoa",
		// "sbdbackpay",
		// "sbdex",
		// "simmania",
		// "simmanis",
		// "merona",
		// "wonsama",
	];
	if(BANNED.length>0 && BANNED.includes(item.author)){
		return Promise.reject(`author (${item.author}) is banned from wdice`);		
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
		let num = rndInt(start,end);
		let body = `@${item.author}님께서 🎲주사위를 굴려 ${num} 이(가) 나왔습니다.`;
		let voteWeight = 0;	// 10000 = 100%
		const P100 = 10000;
		if(start==1 && end==100){
			if(num==7 || num==77){
				// 정수가 아닌 형태가 나오면 오류가 발생함. floor 처리를 통해 cut 시켜주도록 하자
				voteWeight = Math.floor(P100 * 0.777);
				body+='\n럭키넘버에 당첨되어 보너스 보팅(77.7%)을 받았습니다.';
			}
			else if(num==18){
				voteWeight = Math.floor(P100 * 0.81);
				body+='\n럭키넘버에 당첨되어 보너스 보팅(81%)을 받았습니다.';
			}
			else if(num==1||num==100){
				voteWeight = Math.floor(P100 * 1);
				body+='\n럭키넘버에 당첨되어 보너스 보팅(100%)을 받았습니다.';
			}
			else if(num==11 || num==22 || num==33 || num==44 || num==55 || num==66 || num==77 || num==88 || num==99){
				voteWeight = Math.floor(P100 * 0.5);
				body+='\n럭키넘버에 당첨되어 보너스 보팅(50%)을 받았습니다.';
			}
		}

		// 광고 추가하기
		// let op = await wsteem.getRecentComment(item.author);
		// if(op){
		// 	let ads = `\n[${op.title}](https://steemit.com/${op.parent_permlink}/@${op.author}/${op.permlink}) from @${op.author}`;
		// 	body+=ads;
		// }

		// 광고 추가
		let ad_now = get_ad();
		let ads = `\n[${ad_now.text}](${ad_now.link}) from @${ad_now.author}`;
		body+=ads;

		
		let wif = STEEM_TRANS_KEY_POSTING;
		let author = STEEM_TRANS_AUTHOR;
		let permlink = `${item.author.replace(/\./gi,'')}-wdice-${time}`;	// make permlink same way, permlink에는 .이 포함되면 안됨

		let title = '';
		let jsonMetadata = {
			tags:['wonsama','wdice'],
			app: STEEM_TRANS_APP,
			format: 'markdown'
		};
		[err, reply] = await to(steem.broadcast.commentAsync(wif, item.author, item.permlink, author, permlink, title, body, jsonMetadata));

		if(!err){
			wlog.info({
				url:`https://steemit.com/@${author}/${permlink}`,
				permlink:permlink,
				author:item.author,
				num:num
			},'wdice_reply_wait');

			// wait for 3 sec.
			await to(sleep(WAIT_FOR_REPLY));
		}
		if(!err&&voteWeight!=0){
			// 상위 댓글 보너스 보팅 수행
			let vote;
			let voter = STEEM_TRANS_AUTHOR;
			author = item.author;
			permlink = item.permlink;

			[err, vote] = await to(steem.broadcast.voteAsync(wif, voter, author, permlink, voteWeight));

			if(!err){
					wlog.info({
					url:`https://steemit.com/@${author}/${permlink}`,
					permlink:permlink,
					author:author,
					num:num
				},'wdice_bonus_voting_wait');

				// wait for 3 sec.
				await to(sleep(WAIT_FOR_REPLY));
			}
		}
		if(!err){
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