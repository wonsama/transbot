/*
* 필요한 process.env 설정 값
*
* AUTHOR : 계정명 
* AUTHOR_POSTING_KEY : 포스팅키 
* FILE_NAME : 파일명
*
* 파일에 필요한 값 정보
* line 1: permlink
* line 2: 제목(title)
* line 3: 태그(tags) ,로 구분
* line 4~: 본문(body)
*/

// 설정 정보를 읽어들인다 
require('dotenv').config();

const steem = require('steem');
const fs = require('fs');
const SEP = require('path').sep;
const HOME_DIR = require('os').homedir();
const DESKTOP = `${HOME_DIR}${SEP}Desktop${SEP}`;

const AUTHOR = process.env.AUTHOR;
const AUTHOR_POSTING_KEY = process.env.AUTHOR_POSTING_KEY;
const FILE_NAME = process.env.FILE_NAME;
const DEFAULT_PATH = DESKTOP+FILE_NAME;
const FILE_CHARSET = 'utf8';
const SPLITER = require('os').platform()=='win32'?'\r\n':'\r';

// 파일 읽어들이기
let readFile = async (path) =>{
	return new Promise((resolve,reject)=>{
		fs.readFile(path, FILE_CHARSET, (err,data)=>{
			if(err){
				reject(err);
			}else{
				resolve(data);	
			}
		});
	});
}

// Promise 개체에서 err정보와 처리(data)정보를 동시에 읽어 들인다
let asyncTo = (promise) =>{
  return promise
  .then(data=>[null,data])
  .catch(err=>[err]);
}

/*
* 주소 정보에서 유용한 정보를 추출한다
* @param 주소창의 주소
*/
let getInfoFromLink = (link)=>{

	// https:// 부분은 cut
  // 이후 구성 [ 도메인 - 태그 - 저자 - 펌링크 ]
  let infos = link.substr(8).split('/');

  if(!infos || infos.length!=4){

  	let msg = [];
  	msg.push(`입력받은 ${link} 는 올바른 주소 형식이 아닙니다.`);
  	msg.push('sample link : https://steemit.com/kr/@wonsama/kr-dev-krob');

  	return {
  		data:{
  			domain: '',
		  	category: '',
		  	author: '',
		  	permlink: ''
  		},
  		ok:false,
  		cd:999,
	  	msg:msg.join('\n')
	  }
  }

  return {
  	data:{
  		domain: infos[0],
	  	category: infos[1],
	  	author: infos[2].substr(1),
	  	permlink: infos[3]
  	},
  	ok:true,
  	cd:0, /* 0 : 정상, 양수 : 비정상, 추후 코드별 분기(로컬라이징, 코드메시지) 필요 */
	  msg:'success'
  }
}

/*
* @param filepath md 파일 경로 또는 수정할 URL 주소
*/
async function main(filepath=DEFAULT_PATH){
	
	// 읽어들일 파일은 markdown 형식으로 작성 하며 (steemit 기준)
	// 1째줄 : 타이틀
	// 2째줄 : 태그목록 , 구분
	// 3째줄 : 내용
	let [err, data] = await asyncTo(readFile(filepath));
	if(err){
		console.log('파일을 찾을 수 없습니다.');
		return false;
	}

	// 기본 정보 확인
	let splits = data.split(SPLITER);
	let url_or_permlink = splits[0];
	let title = splits[1];
	let tags = splits[2].split(',').map(x=>x.replace(/ /gi, ''));
	
	// 유효성 검증
	let permlink = url_or_permlink.indexOf('https')==0?undefined:url_or_permlink;
	let info = getInfoFromLink(url_or_permlink);
	if(!permlink && !info.ok){
		console.log(`주소 정보 [ ${url_or_permlink} ] 을 확인 바랍니다.`);
		return false;	
	}
	if(!permlink && info.data.author!=AUTHOR){
		console.log(`content author : ${author} / ${author} 계정 정보를 확인 바랍니다.`);
		return false;
	}

	// 글쓰기 준비
	let category = info.ok?info.data.category:tags[0];
	permlink = info.ok?info.data.permlink:url_or_permlink;
	
	if(!tags.includes(category)){
		tags.splice(0, 0, category);
	}
	let jsonMetadata = {"tags":tags,"app":"steemit/0.1","format":"markdown"};
	let body = splits.splice(3).join(SPLITER);

	// TEST PRINT PROPERTIES
	console.log('url_or_permlink', url_or_permlink);
	console.log('title', title);
	console.log('tags', tags);
	console.log('permlink', permlink);
	console.log('category', category);
	console.log('jsonMetadata', jsonMetadata);
	console.log('body', body);
	
	// 글쓰기 
	steem.broadcast.commentAsync(
		AUTHOR_POSTING_KEY, // wif
		'', // parentAuthor
		category, // parentPermlink
		AUTHOR, // author
		permlink, // permlink
		title, // title
		body, // body
		jsonMetadata // jsonMetadata
		).then(console.log)
}
main();