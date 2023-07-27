# docker run --name localstack -p 4566:4566 -p 8055:8080 localstack/localstack:0.12.6
echo "sleeping 15 seconds..."
sleep 15

# create fake buckets
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket local-uploads --region us-east-1
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket test-uploads --region us-east-1
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket local-ftp --region us-east-1
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket test-ftp --region us-east-1

# create fake ACLs
aws --endpoint-url=http://localhost:4566 s3api put-bucket-acl --bucket local-uploads --acl public-read --region us-east-1
aws --endpoint-url=http://localhost:4566 s3api put-bucket-acl --bucket test-uploads --acl public-read --region us-east-1

# create SES stuff
aws ses verify-email-identity --email-address no-reply@test.nimblefi.com --region us-west-1 --endpoint-url=http://localhost:4566
aws ses verify-email-identity --email-address no-reply@nimblefi.com --region us-west-1 --endpoint-url=http://localhost:4566
aws ses verify-email-identity --email-address test@localhost --region us-west-1 --endpoint-url=http://localhost:4566

# create aws sqs queues
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-local-signers-compliance --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-tst-signers-compliance --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-local-signers-identity --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-tst-signers-identity --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-local-account-requests --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-tst-account-requests --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-local-signers-credit-report --region us-east-1
aws sqs create-queue --endpoint-url=http://localhost:4566 --queue-name core-tst-signers-credit-report --region us-east-1


# create aws sns topic
aws sns create-topic --endpoint-url=http://localhost:4566 --name core-local-signers --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-local-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-local-signers-compliance --attributes RawMessageDelivery=true --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-local-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-local-signers-identity --attributes RawMessageDelivery=true --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-local-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-local-signers-credit-report --attributes RawMessageDelivery=true --region us-east-1


aws sns create-topic --endpoint-url=http://localhost:4566 --name core-tst-signers --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-tst-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-tst-signers-compliance --attributes RawMessageDelivery=true --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-tst-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-tst-signers-identity --attributes RawMessageDelivery=true --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-tst-signers  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-tst-signers-credit-report --attributes RawMessageDelivery=true --region us-east-1


aws sns create-topic --endpoint-url=http://localhost:4566 --name core-local-account-requests --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-local-account-requests --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-local-account-requests --attributes RawMessageDelivery=true --region us-east-1

aws sns create-topic --endpoint-url=http://localhost:4566 --name core-tst-account-requests --region us-east-1
aws sns subscribe --endpoint-url=http://localhost:4566 --topic-arn arn:aws:sns:us-east-1:000000000000:core-tst-account-requests  --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:core-tst-account-requests --attributes RawMessageDelivery=true --region us-east-1
