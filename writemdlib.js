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

// 기본 라이브러리 로딩
const steem = require('steem');
const fs = require('fs');
const readline = require('readline');

// 설정 정보를 읽어들인다 
require('dotenv').config();
const AUTHOR = process.env.AUTHOR;
const AUTHOR_POSTING_KEY = process.env.AUTHOR_POSTING_KEY;
const FILE_NAME = process.env.FILE_NAME;

// 상수값 설정
const SEP = require('path').sep;
const HOME_DIR = require('os').homedir();
const DESKTOP = `${HOME_DIR}${SEP}Desktop${SEP}`;
const DEFAULT_FOLDER = `${DESKTOP}steemit${SEP}`;
const FILE_CHARSET = 'utf8';
const SPLITER = require('os').platform()=='win32'?'\r\n':'\r';
const MD_EXT = '.md';

/*
* 텍스트 파일 정보를 읽어들인다(UTF8)
* 실패 시 null 반환
* @param path 파일경로
* @return 읽어들인 파일 정보
*/
function readFile (path) {
	try{
		return fs.readFileSync(path, FILE_CHARSET);	
	}catch(e){
		console.error(e);
		return null;
	}
}

/*
* 폴더 기준 파일 목록정보 읽어들이기
* fname : 전체경로, name : 파일명, ctimeMs : 생성시간 밀리초, mtimeMs : 수정시간 밀리초
* @param dir 폴더경로
* @return 폴더 내부에 존재하는 파일 목록 정보
*/
function getFolerFiles (dir, files_=[]){
    let files = fs.readdirSync(dir);
    for (let i in files){
        let name = dir + files[i];
        let stat = fs.statSync(name);
        if (stat.isDirectory()){
            getFolerFiles(name, files_);
        } else {
            files_.push({fname:name, name : name.split(SEP).pop(), ctimeMs:stat.ctimeMs, mtimeMs:stat.mtimeMs });
        }
    }
    // 최근 수정시간 역순 정렬 반환
    files_.sort((a,b)=>b.mtimeMs-a.mtimeMs);
    return files_;
}

/*
* Promise 개체에서 err정보와 처리(data)정보를 동시에 읽어 들인다
* @param promise Promise 개체
* @return [err,data] 형태의 정보
*/
function asyncTo (promise) {
  return promise
  .then(data=>[null,data])
  .catch(err=>[err]);
}

/*
* 주소 정보에서 스팀잇에 사용되는 주소 정보를 분할 반환
* @param 주소창의 주소
* @return 정제된 주소 정보
*/
function getInfoFromLink(link) {

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
* 폴더가 없는 경우 폴더를 생성
* @param path 폴더경로
*/
function makeFolder (path) {
	const folders = path.split(SEP);
	// check path is exist
	if(!fs.existsSync(path)){
		let paths = [];
		try{
			// make folder with recursivly
			for(let f of folders){
				paths.push(f);
				let p = paths.join(SEP);
				if(p!='' && !fs.existsSync(p)){
					fs.mkdirSync(p);
				}
			}
		}catch(e){
			console.error(e);
		}
	}
}

/*
* 유니크한 대상을 반환하는 필터
* @param value 값
* @param index 인덱스
* @param self 자기자신
*/
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

/*
* 질문을 수행한다 
* @parma msg 질문
* @return 답
*/
async function question (msg){
  return new Promise((resolve, reject)=>{
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try{
      rl.question(msg, answer=>{
          rl.close();
          resolve(answer);
      });
    }catch(e){
      reject(e);
    }
  });
}



let fn = {};

fn.DESKTOP = DESKTOP;
fn.DEFAULT_FOLDER = DEFAULT_FOLDER;

fn.test = async (path) =>{
	return getFolerFiles(path);
}

/*
* 해당 URL의 MARKDOWN 파일을 다운로드 받는다
*/
fn.download = async (url, filefolder=DEFAULT_FOLDER) =>{
	let info = getInfoFromLink(url);
	if(!info.ok){
		return Promise.reject(info.msg);
	}

	let cont = await steem.api.getContentAsync(info.data.author, info.data.permlink);
	let title = cont.title;
	let body = cont.body;
	let category = cont.parent_permlink;
	let json = cont.json_metadata?JSON.parse(cont.json_metadata):'';
	let tags = json.tags;
	tags = tags.filter(x=>x!=category);
	let author = cont.author;
	let permlink = cont.permlink;

	// 확인용 컨텐츠 정보 출력
	// console.log('title', title);
	// console.log('body', body.substr(0,100));
	// console.log('category', category);
	// console.log('tags', tags);
	// console.log('author', author);
	// console.log('permlink', permlink);

	// 정보 생성
	let msg = [];
	msg.push(title);			// 제목
	msg.push(category);			// 카테고리(분류 parent_permlink)
	msg.push(tags.join(','));	// 태그목록 / 첫번째 태그는 변경 불가함. 카테고리
	msg.push(body);				// 내용 

	// 파일 쓰기
	makeFolder(filefolder);
	fs.writeFileSync( filefolder+permlink+MD_EXT, msg.join(SPLITER), FILE_CHARSET);
	return Promise.reject(true);
}

/*
* 파일 읽어들여 글쓰기를 수행한다
* @permlink_md_file 마크다운 파일명 (생략 시 filefolder 에서 최신 수정된 정보를 기반으로 처리한다 )
* @filefolder 폴더 경로 
*/
fn.write = async (permlink_md_file='', filefolder=DEFAULT_FOLDER)=>{

	// permlink가 '' 일 경우 filefolder 에서 최신 수정된 파일 정보를 가져와 해당 정보를 확인한다
	if(permlink_md_file==''){
		let files = getFolerFiles(filefolder);
		if(files.length>0){
			// permlink는 대쉬 숫자 영소문자로만 구성됨
			permlink_md_file = files[0].name;
		}else{
			return Promise.reject(`${filefolder} has no files.`);
		}
	}

	// 읽어들일 파일은 markdown 형식으로 작성 하며 (steemit 기준)
	// 1째줄 : 타이틀
	// 2째줄 : 태그목록 , 구분
	// 3째줄 : 내용
	let data = readFile(filefolder+permlink_md_file);
	if(data==null){
		return Promise.reject(`${filefolder+permlink_md_file} file not found.`);
	}

	// 기본 정보 확인
	let splits = data.split(SPLITER);
	let permlink = permlink_md_file.split('.')[0];
	let title = splits[0];
	let category = splits[1];	// 글 수정 시 parent_permlink 첫번째 태그(카테고리)는 변경 할 수 없다
	let tags = splits[2].split(',').map(x=>x.replace(/ /gi, ''));
	tags.splice(0,0,category);
	tags = tags.filter(onlyUnique);
	let body = splits.splice(3).join(SPLITER);
	let jsonMetadata = {"tags":tags,"app":"steemit/0.1","format":"markdown"};
	
	// 확인용 컨텐츠 정보 출력
	console.log('\ntitle ::::\n', title);
	console.log('\ntags ::::\n', tags);
	console.log('\npermlink ::::\n', permlink);
	console.log('\ncategory ::::\n', category);
	console.log('\njsonMetadata ::::\n', jsonMetadata);
	console.log('\nbody ::::\n', body.substr(0,100)+"...");

	// 확인 및 작업진행
	let q = await question('\n글 쓰기/수정 작업을 진행하겠습니까 (y/n) ? ');
	if(q && q.toLowerCase()=='y'){
		// 글쓰기 
		return steem.broadcast.commentAsync(
			AUTHOR_POSTING_KEY, // wif
			'', // parentAuthor
			category, // parentPermlink
			AUTHOR, // author
			permlink, // permlink
			title, // title
			body, // body
			jsonMetadata // jsonMetadata
			);
	}
	return Promise.reject(`Entered [ ${q} ] : canceled action !`);
	
}


/*
* @param filepath md 파일 경로 또는 수정할 URL 주소
*/
module.exports = fn;
