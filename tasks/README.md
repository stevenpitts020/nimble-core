# Tasks

This directory contains scripts that can be used to perform recurrent tasks in the system.

## Unlock user

This task allow's the unlock of a user and trigger a reset password workflow for that user.

    NODE_ENV=development npm run task/unlock-user -- --e <email>

    - email is the email of the user to unlock
