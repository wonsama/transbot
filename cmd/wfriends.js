const {to} = require ('../util/wutil');						// async 
const {sleep} = require ('../util/wutil');				// sleep
const {toBoolean} = require ('../util/wutil');			// is true ?
const wlog = require('../util/wlog');							// logs
const {removeSpace} = require ('../util/wstring');
const parser = require('./parser/padefault');

const axios = require('axios');
const cheerio = require('cheerio');
const dateFormat = require('dateformat');
const steem = require('steem');											// steem api

const STEEM_TRANS_APP = process.env.STEEM_TRANS_APP?process.env.STEEM_TRANS_APP:'wtrans/v1.0.0';
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);
const WAIT_FOR_REPLY = 20 * 1000;

const STEEM_AUTHOR = process.env.STEEM_AUTHOR;
const STEEM_TRANS_FRIENDS = process.env.STEEM_TRANS_FRIENDS;
const STEEM_TRANS_FRIENDS_AUTHOR = process.env.STEEM_TRANS_FRIENDS_AUTHOR;
const STEEM_KEY_POSTING = process.env.STEEM_KEY_POSTING;	// STEEM_TRANS_FRIENDS_AUTHOR 포스팅키 아니면 위임자의 포스팅 키


const DEFAULT_TAG = 'kr-friends';  // 1개만 설정 가능 - category로도 사용되기 때문
const DEFAULT_BODY_LEN = 200;
const DEFAULT_UNIQUE_LEN = 15;


let fn = {};

fn.name = removeSpace(STEEM_TRANS_FRIENDS).split(',');

/*
* 친구 새글 알림
* @param reply
*/
fn.command = async (item) =>{

	let err;
	let account = STEEM_TRANS_FRIENDS_AUTHOR;
	let wif = STEEM_KEY_POSTING;
  
  // medium 사이트는 accept 가 반드시 존재해야 됨에 유의
  const AXIOS_CONFIG = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
      'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  };

  // { parent_author: '',
  // parent_permlink: 'test',
  // author: 'doctor.strange',
  // permlink: 'test-title',
  // title: 'test-title',
  // body: 'test-body',
  // json_metadata: '{"tags":["test"],"app":"steemit/0.1","format":"markdown"}' }

  let category = '';
  try{category = JSON.parse(item.json_metadata).tags[0];}catch(e){}
  
  let link = `https://steemit.com/${category}/@${item.author}/${item.permlink}`;
  let linkInfo;
  [err, linkInfo] = await to(axios.request(link, AXIOS_CONFIG));
  if(!err){
    $ = cheerio.load(linkInfo.data);
    context = parser($, link, DEFAULT_TAG, DEFAULT_BODY_LEN, DEFAULT_UNIQUE_LEN);
  }

  // 글쓰기 - 하루에 하나만 쓰도록 PERMLINK를 고정
  let today = dateFormat(new Date(),'yyyy-mm-dd');
  
  // 글쓰기 이력 정보 확인
  let cont;
  if(!err){
    let permlink = `${account}-${today}`;
    permlink = permlink.replace(/\./gi, '-'); // permlink에는 .이 포함되면 안됨에 유의
    context.parentLink = `https://steemit.com/${DEFAULT_TAG}/@${account}/${permlink}`;
    [err, cont] = await to(steem.api.getContentAsync(account, permlink));
  }

  // 글쓰기
  if(!err && cont && cont.id==0){
    
    // 비지로 작성하고 싶은 경우는 아래 구문의 주석을 해제하면 된다.
    // let jsonMetadata = {
    //   community:"busy",
    //   app:"busy/2.5.4",
    //   format:"markdown",
    //   tags:['kr-scrap','busy']
    // };
    let jsonMetadata = {
      app:"steemit/0.1",
      format:"markdown",
      tags:[ DEFAULT_TAG ]
    };

    let title = `${today} 친구들의 새소식 알림`;
    let body = `### 친구들의 새글 정보를 공유합니다.\n\n자세한 내용은 댓글을 참조 바랍니다.`;
    let permlink = `${account}-${today}`;
    permlink = permlink.replace(/\./gi, '-'); // permlink에는 .이 포함되면 안됨에 유의

    // 설정 값에 STEEM_AUTHOR 가 존재하면 해당 계정으로 베니피셔리(수익자)를 설정한다. 수익은 스팀파워로 수령하게 됨
    if(STEEM_AUTHOR){
      let beneficiaries = [
        /* weight : 10000 => 100% */
        { account: STEEM_AUTHOR, weight: 10000 }
      ];
      const operations = [
        ['comment',
            {
              parent_author: '',
              parent_permlink: DEFAULT_TAG,
              author: account,
              permlink:permlink,
              title: title,
              body: body,
              json_metadata: JSON.stringify(jsonMetadata)
            }
        ],
        ['comment_options', {
            author: account,
            permlink:permlink,
            max_accepted_payout: '1000000.000 SBD',
            percent_steem_dollars: 10000,
            allow_votes: true,
            allow_curation_rewards: true,
            extensions: [
                [0, {
                    beneficiaries: beneficiaries
                }]
            ]
        }]
      ];
      [err, cont] = await to(steem.broadcast.sendAsync({ operations, extensions: [] }, { posting: wif }));
    }else{
      [err, cont] = await to(steem.broadcast.commentAsync(wif, '', DEFAULT_TAG, account, permlink, title, body, JSON.stringify(jsonMetadata) ));  
    }
    
    if(!err){
      // 20초간 대기를 수행한다. 글 쓴 이후 댓글을 20초 이후 작성 가능
      await sleep(20000); 
    }
  }

  // 댓글쓰기
  if(!err){
    let image = `https://steemitimages.com/300x0/${context.image}`;
    let jsonMetadata = {
      app:"steemit/0.1",
      format:"markdown",
      tags:context.tags,
      image:[image],
      links:[context.url]
    };
    let body = [];
    body.push(`<img src='${image}' />`);
    body.push(`#### [${context.title}](${context.url})`);
    body.push(`> <i>${context.body}</i>`);

    let parentPermlink = `${account}-${today}`;
    parentPermlink = parentPermlink.replace(/\./gi, '-'); 

    // permlink에는 .이 포함되면 안됨에 유의
    // permlink에는 대문자가 포함되면 안됨에 유의
    let permlink = `${account}-${today}-${context.unique}`;
    permlink = permlink.replace(/\./gi, '-').toLowerCase();
    [err, cont] = await to(steem.broadcast.commentAsync(wif, account, parentPermlink, account, permlink, '', body.join('\n\n'), JSON.stringify(jsonMetadata) ));
  }

  // 글쓰기
  if(!err){
    return Promise.resolve(context);
  }

  // 오류처리
  if(err){
    return Promise.reject(err.toString());
  }

}

module.exports = fn;