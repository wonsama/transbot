const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const STEEM_KEY_POSTING = process.env.STEEM_KEY_POSTING;
const STEEM_VOTES_LIST = process.env.STEEM_VOTES_LIST;
const WAIT_FOR_REPLY = 3 * 1000; // 보팅은 3초만 기다리면 됨

const VOTE_START = 3000;
const VOTE_MAX = 10000;

let fn = {};

/*
* 보팅 트레인
* @param reply
*/
fn.command = async (item) =>{

	let err;

	// print replies log
	wlog.info({
		url:`https://steemit.com/@${item.author}/${item.permlink}`
	},'wvotetrain_start');

	let operations = [];
	const votes = STEEM_VOTES_LIST.split(',');
  for(let voter of votes){
    let _voter = voter.trim();
    if(_voter!=''){

    	// VOTE_START 이상으로 보팅한 경우에만 VOTE_MAX
    	if(Number(item.weight)>=VOTE_START){
				operations.push([
	      'vote',
	        {
	          voter : _voter,
	          author : item.author,
	          permlink : item.permlink,
	          weight : VOTE_MAX
	        }
	      ]);
    	}

    }
  }

	// STEP 1 : send vote operations
	let pvote;
	[err,pvote] = await to(steem.broadcast.sendAsync({ operations: operations, extensions: [] },{ posting: STEEM_KEY_POSTING }));
	if(!err){

		wlog.info({
				url:`https://steemit.com/@${item.author}/${item.permlink}`,
				votes : votes.length
			},`wvotetrain_wait ${WAIT_FOR_REPLY} mili sec.`);

		await to(sleep(WAIT_FOR_REPLY));
	}

	if(err){
		// TODO : Consider working manually when an error occurs
		wlog.error(err, 'wvotetrain_error');
		return Promise.reject(err);
	}
}

module.exports = fn;