# 1.5.3

* 버그수정 : 계정명에 . 들어간 경우 주사위 안굴려지는 문제점 수정

# 1.5.2

* 광고 데모 추가 : 자신의 최신글 링크 추가(추후 변경)

# 1.5.1

* 보너스 보팅 영역 추가 11 ~ 99

# 1.5.0

* 신규 : hb.sh :: heartbeat 체킹 프로그램 프로그램이 죽으면 다시 살려준다

# 1.4.9

* 버그수정 : wdstat 에서 대댓글에 대한 정보 못가져오는 부분 수정

# 1.4.8

* 버그수정 10000 * 0.81 = 8100.00000001 이렇게 부동 소숫점 오류가 발생할 수 있음 그래서 Math.floor를 통해 오류 나지 않도록 함. 

# 1.4.7

* 추가 : 이미 읽어들인 블록 같은 경우에 로깅을 남기도록 함

# 1.4.6

* add : wdstat logging

# 1.4.5

* add : block read error catch at wmonitor

# 1.4.4

* add : ban user from hardcoding

# 1.4.3

* add : wdstat subfix

# 1.4.2

* bugfix : body

# 1.4.1

* bugfix : wif

# 1.4.0

* wdstat : 주사위 통계 댓글 기능 추가됨

# 1.3.4

* bugfix : dateformat

# 1.3.3

* wdstat : 주사위 통계 부분 테스트 중
 
# 1.3.2

* 로그 부분 수정
 
# 1.3.1

* 주사위 굴릴 때 누가 굴렸는지 표기

# 1.3.0

* 대기시간 변경처리(일부) 20초 => 3초
* env 기본 값 '' 추가 작업 (오류 방지)
* dotenv 모듈 추가
* wstring : undefined 오류 방어처리
* 이제 번역기능은 제거 - 왜냐하면 RC의 소모량이 증가했기 때문 - 주석처리 됨
* 주사위 보너스 보팅 기능 추가 : 1,100,7,77,18 은 각각 특정요율의 보너스 보팅을 선사함

# 1.2.6

* add wfriends

# 1.2.5

* increase types

# 1.2.4

* do not process modified posts
* check time : created & lastupdate

# 1.2.3

* minor bug fix

# 1.2.2

* do not process modified posts
* start with @@ is except

# 1.2.1

* minor bug fix

# 1.2.0

* added jankenpo
* added cmd folder & change structre

# 1.1.3

* reply wait 20 sec added.

# 1.1.2

* added testmode
* remove stack trace log

# 1.1.1

* added isBoolean
* load env added

# 1.1.0

* added wdice bot

#ㄷ1.0.0

* first commit