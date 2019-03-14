#!/bin/bash

# 사용방법
#
# nohup /bin/bash undead_bot.sh &
#
# 로그 안남기는 형식 
# nohup node $APP_NAME >/dev/null 2>&1 &
#
# 로그를 남김 nohup.out
# nohup node $APP_NAME &

# SETTINGS

NAME_APP_1=transbot
NAME_CHK_1=[t]ransbot

# HEART BEAT CHECK : sleep 은 초단위 임

while [ : ]
do

# APP1
RES=$(ps -ef | grep $NAME_CHK_1 | wc -l)
RES="$(echo -e "${RES}" | tr -d '[:space:]')"
if [ "$RES" = "0" ]; then
    nohup node $NAME_APP_1 >/dev/null 2>&1 &
    #echo 1-1
else
	#echo 1-2__"$RES"__ 
fi

sleep 10
done