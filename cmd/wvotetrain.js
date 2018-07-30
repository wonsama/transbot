const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const wlog = require('../util/wlog');							// logs

const steem = require('steem');											// steem api

const STEEM_KEY_POSTING = process.env.STEEM_KEY_POSTING;
const STEEM_VOTES_LIST = process.env.STEEM_VOTES_LIST;
const WAIT_FOR_REPLY = 3 * 1000; // 보팅은 3초만 기다리면 됨

let fn = {};

/*
* Do it Jan Ken Po & Make reply
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
      operations.push([
      'vote',
        {
          voter : _voter,
          author : item.author,
          permlink : item.permlink,
          weight : item.weight
        }
      ]);
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