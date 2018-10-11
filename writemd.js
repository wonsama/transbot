/*
* 필요한 process.env 설정 값
*
* AUTHOR : 계정명 
* AUTHOR_POSTING_KEY : 포스팅키 
* FILE_NAME : 파일명
*
* 파일에 필요한 값 정보
* line 1: 제목(title)
* line 2: 카테고리(parent_permlink)
* line 3: 태그(tags) ,로 구분(카테고리에 해당하는 태그는 넣어도 않넣어도 무관함)
* line 4~: 본문(body)
*/
let wlib = require('./writemdlib');

// 글쓰기용 
wlib.write('write-with-md.md');

// 글 다운로드용
// wlib.download('https://steemit.com/dclick/@wonsama/dev-windows10-64bit-cassandra--1539238365600').then(console.log).catch(console.log);