# iSoftPull Credit Bureau

## Other information

See: https://gitlab.com/wearesingular/clients/nimble/nimble-lab/-/issues/3

## Error Codes for api response

List of error codes for API from https://secure.isoftpull.com/index.php?m=prequal&a=api:

- 1000	1	Request was received successfully, but we could not find the user's credit file. It is recommended to reattempt while including the user's DOB or SSN.
- 1015	1	Request was received successfully, but we could not find the user's credit file. It is recommended to reattempt while including the user's SSN.
- 1016	1	Request was received successfully, but we could not find the user's credit file. It is recommended to reattempt while including the user's DOB.
- 1017	1	Request was received successfully, but we could not find the user's credit file. The user likely does not have a credit file.
- 1014	1	We found the credit file but we are unable to open it due to it being either frozen or locked.
- 1020	1	Request was received successfully, but we could not find the user's credit file due to an issue with the submitted address.
- 1021	1	Request was received successfully, but we could not find the user's credit file due to an issue with the submitted name.
- 1022	2	A lenderid must be included in all requests.
- 1008	2	Lender ID not found or this account is currently disabled.
- 1011	2	email and email-confirm must be identical.
- 1012	2	ssn and ssn2 must be identical.
- 1001	2	accepttos must be set to 1.
- 1002	2	One or more required parameters was not set.
- 1013	2	If mla=1 then date of birth must be provided.
- 1005	2	accepttos2 must be set to 1 when requesting a hard-pull.
- 1009	2	MLA requested but is not allowed.
- 1010	2	Hard-Pull requested but is not allowed.
- 1018	2	The provided lenderid does not belong to this account.
- 1019	2	If hard=1 then date of birth and SSN must be provided.
- 1004	3	User does not qualify for any offers at this time.
- 1006	3	Via hard-pull: User does not qualify for any offers at this time.
- 1003	4	User qualified for one or more offers.
- 1007	4	Via hard-pull: User qualified for one or more offers.