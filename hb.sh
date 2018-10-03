#!/bin/bash

# SETTINGS
NODE_APP_PATH=/home/bc/dev/transbot
CHECK_NAME=[t]ransbot

# HEART BEAT CHECK
RES=$(ps -ef | grep $CHECK_NAME | wc -l)
while [ : ]
do
if [ "$RES" = "0" ]; then
	echo restart $CHECK_NAME at `date`
	nohup node $NODE_APP_PATH &
else
	echo `date` $CHECK_NAME is live
fi
sleep 10
done

# HOW TO RUN
#
# nohup /bin/bash /home/bc/dev/transbot/hb.sh &
#
# REF DOC
#
# CLI 결과를 변수에 할당하는 방법
# https://stackoverflow.com/questions/4651437/how-to-set-a-variable-to-the-output-of-a-command-in-bash
# BASH 에서 간단한 IF 사용방법
# http://tldp.org/HOWTO/Bash-Prog-Intro-HOWTO-6.html
# BASH 에서 SLEEP 시간 설정방법
# https://www.cyberciti.biz/faq/linux-unix-sleep-bash-scripting/