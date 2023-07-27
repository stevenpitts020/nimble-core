#!/bin/bash

TMPLS="AccountRequestApproved AccountRequestDeclined inviteeSignupEmail inviteeSignupReminderEmail magicLinkEmail prospectPendingSignersEmail signerEmailVerificationEmail userLockedEmail welcomeEmail notification"
AWS_PROFILE='erin2'
ASSETS_HOST='https://cdn.nimblefi.com'

for tmpl in ${TMPLS}; do
  TMP=$(mktemp)
  FILE=$(cat "${tmpl}.ses.json")
  echo "${FILE//\$ASSETS_HOST/${ASSETS_HOST}}" > ${TMP}
  echo "creating email template ${tmpl}"
  aws ses delete-template --profile ${AWS_PROFILE} --region ${AWS_DEFAULT_REGION:-us-east-2} --template-name "${tmpl}"
  aws ses create-template --profile ${AWS_PROFILE} --region ${AWS_DEFAULT_REGION:-us-east-2} --cli-input-json "file://${TMP}"
  rm -f ${TMP}
done
