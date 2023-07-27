/* eslint-disable no-useless-escape */
const signer = {
  id: "2e31d8c0-1226-4651-8a5d-4bd8aa454722",
  firstName: "George",
  middleName: null,
  lastName: "Constanza",
  email: 'psousa+1@wearesingular.com',
  address: '123 main street apt. 1',
  city: 'Lisbon',
  state: 'CA',
  zipCode: '22222',
  ssn: '333-33-3333',
  phoneNumber: '(233) 555-3333',
  dateOfBirth: '1982-12-06',
  documentNumber: '123213',
  documentExpirationDate: '2021-12-12',
  documentIssuedDate: '2019-12-12',
  employer: 'Singular',
  status: 'SIGNED'
}

const validApplicant = {
  'firstname': 'ADRIENNE',
  'lastname': 'BRAKE',
  'address1': '523 W ALAMAR AVE',
  'city': 'GREENFIELD',
  'state': 'CA',
  'postcode': '931054826',
  'phone': '2335553333',
  'email': 'psousa+test@wearesingular.com',
  "ssn": "666707610",
  "dob": "12061945"
}

const processApplicantSuccess = {
  prequal: {
    response: {
      applicant: {
        consumerid: '227031'
      },
      code: 1004,
      code_type: 3,
      message: ''
    }
  }
}

const processApplicantFailed = {
  prequal: {
    response: {
      applicant: {
        consumerid: '227109'
      },
      code: 1000,
      code_type: 1,
      message: 'additional_info_needed'
    }
  }
}

const resultsSuccess = [
  {
      "firstname": "Adrienne",
      "middlename": "",
      "lastname": "Brake",
      "phone": "54326534",
      "address": "523 W Alamar Ave",
      "city": "Greenfield",
      "state": "Ca",
      "zip": "931054826",
      "email": "bruno@nimblefi.com",
      "response_heading": "Thank you for submitting your info!",
      "response_content": "Although we weren't able to instantly match you with a loan offer, you may contact our office to inquire further about our lending options. And don't worry, this was a 'soft' credit pull so there was no impact to your credit.",
      "consumerid": "227031",
      "pull_type": "soft",
      "result": "Not Qualified",
      "time_created": "1611683214",
      "time_updated": "1611683679",
      "branchid": "0",
      "branchname": "",
      "loanofficerid": "0",
      "loanofficername": "",
      "lenderid": "1426",
      "report_url": "https://secure.prequalsolutions.com/preq/api/viewReport.php?id=227031&t=1611685783&sc=0466566d0d4e99ea9886593ccd6ef1b4e6227e40214e240c901c1d519a70a2ee",
      "report_xml": "<NetConnectResponse xmlns=\"http://www.experian.com/NetConnectResponse\"><CompletionCode>0000</CompletionCode><ReferenceId>227031_1611683214</ReferenceId><TransactionId>117782216</TransactionId><Products xmlns=\"http://www.experian.com/ARFResponse\"><CreditProfile><Header><ReportDate>01262021</ReportDate><ReportTime>114657</ReportTime><Preamble>TCA7</Preamble><ARFVersion>07</ARFVersion><ReferenceNumber>CPR 227031</ReferenceNumber></Header><RiskModel><ModelIndicator code=\"V3\">Vantage Score V3</ModelIndicator><Score>0767</Score><ScoreFactorCodeOne>08</ScoreFactorCodeOne><ScoreFactorCodeTwo>04</ScoreFactorCodeTwo><ScoreFactorCodeThree>32</ScoreFactorCodeThree><ScoreFactorCodeFour>43</ScoreFactorCodeFour><Evaluation code=\"P\">Positive number</Evaluation></RiskModel><ConsumerIdentity><Name><Surname>BRAKE</Surname><First>ADRIENNE</First></Name><YOB>    </YOB></ConsumerIdentity><AddressInformation><FirstReportedDate>10012015</FirstReportedDate><LastUpdatedDate>08112020</LastUpdatedDate><Origination code=\"1\">Reported via A/R Tape, but different from inquiry</Origination><TimesReported>00</TimesReported><LastReportingSubcode>1230206</LastReportingSubcode><DwellingType code=\"A\">Apartment complex</DwellingType><HomeOwnership code=\" \">Unknown</HomeOwnership><StreetPrefix>523 W</StreetPrefix><StreetName>ALAMAR</StreetName><StreetSuffix>AVE</StreetSuffix><UnitType>#</UnitType><UnitID>40</UnitID><City>SANTA BARBARA</City><State>CA</State><Zip>931054826</Zip><CensusGeoCode>       </CensusGeoCode></AddressInformation><AddressInformation><FirstReportedDate>07062019</FirstReportedDate><LastUpdatedDate>07062019</LastUpdatedDate><Origination code=\"1\">Reported via A/R Tape, but different from inquiry</Origination><TimesReported>01</TimesReported><LastReportingSubcode>       </LastReportingSubcode><DwellingType code=\"P\">Post Office Box</DwellingType><HomeOwnership code=\" \">Unknown</HomeOwnership><StreetPrefix>PO BOX 63</StreetPrefix><City>ORIENT</City><State>SD</State><Zip>574670063</Zip><CensusGeoCode>       </CensusGeoCode></AddressInformation><AddressInformation><FirstReportedDate>12222014</FirstReportedDate><LastUpdatedDate>12222014</LastUpdatedDate><Origination code=\"1\">Reported via A/R Tape, but different from inquiry</Origination><TimesReported>00</TimesReported><LastReportingSubcode>       </LastReportingSubcode><DwellingType code=\"S\">Single-family dwelling</DwellingType><HomeOwnership code=\" \">Unknown</HomeOwnership><StreetPrefix>231</StreetPrefix><StreetName>BUTTERFLY</StreetName><StreetSuffix>LN</StreetSuffix><City>SANTA BARBARA</City><State>CA</State><Zip>931082455</Zip><CensusGeoCode>       </CensusGeoCode></AddressInformation><EmploymentInformation><FirstReportedDate>03152009</FirstReportedDate><LastUpdatedDate>03152009</LastUpdatedDate><Origination code=\"2\">Inquiry</Origination><Name>CAIN BROS SHATTUCK</Name><AddressFirstLine> </AddressFirstLine><AddressSecondLine> </AddressSecondLine><AddressExtraLine> </AddressExtraLine><Zip>          </Zip></EmploymentInformation><TradeLine><SpecialComment code=\"19\">ACCOUNT CLOSED AT CONSUMER&apos;S REQUEST</SpecialComment><Evaluation code=\"N\">Closer review is required</Evaluation><OpenDate>08011995</OpenDate><StatusDate>12012019</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"18\">Credit Card, Terms REV</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\"L\">Limit</Qualifier><Value>00002000</Value></Amount><Amount><Qualifier code=\"H\">High balance</Qualifier><Value>00001800</Value></Amount><BalanceDate>12122019</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"C\">Closed</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>99</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>B00000000000</PaymentProfile><Subcode>1233910</Subcode><KOB code=\"BC\">Bank Credit Cards</KOB><SubscriberDisplayName>JPMCB CARD</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>12012019</InitialPaymentLevelDate><AccountCondition code=\"A3\">Closed</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"18\">Credit Card, Terms REV</AccountType><SpecialComment code=\"19\">Account closed at consumer&apos;s request</SpecialComment></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"19\">ACCOUNT CLOSED AT CONSUMER&apos;S REQUEST</SpecialComment><Evaluation code=\"N\">Closer review is required</Evaluation><OpenDate>11251995</OpenDate><StatusDate>01012019</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"18\">Credit Card, Terms REV</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\" \">Unknown</Qualifier><Value> UNKNOWN</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>01032019</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"C\">Closed</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>99</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>B---------000000000000000</PaymentProfile><MonthlyPaymentAmount>        </MonthlyPaymentAmount><MonthlyPaymentType code=\" \">Estimated</MonthlyPaymentType><LastPaymentDate>10072012</LastPaymentDate><Subcode>1280608</Subcode><KOB code=\"BC\">Bank Credit Cards</KOB><SubscriberDisplayName>WELLS FARGO CARD/WB CA</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>01012019</InitialPaymentLevelDate><AccountCondition code=\"A3\">Closed</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"18\">Credit Card, Terms REV</AccountType><SpecialComment code=\"19\">Account closed at consumer&apos;s request</SpecialComment></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>04052012</OpenDate><StatusDate>07012015</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"15\">Check Credit Or Line Of Credit</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\"L\">Limit</Qualifier><Value>00007000</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>07282015</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"12\">Account/paid satisfactorily</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"C\">Closed</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>37</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>B</PaymentProfile><Subcode>1161711</Subcode><KOB code=\"BB\">All Banks -- Non-Specific</KOB><SubscriberDisplayName>BANK</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>07012015</InitialPaymentLevelDate><AccountCondition code=\"A2\">Paid</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"15\">Check Credit Or Line Of Credit</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>04012002</OpenDate><StatusDate>05012014</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"15\">Check Credit Or Line Of Credit</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\" \">Unknown</Qualifier><Value> UNKNOWN</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>05282014</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"12\">Account/paid satisfactorily</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"C\">Closed</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>99</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>B</PaymentProfile><Subcode>1100771</Subcode><KOB code=\"BB\">All Banks -- Non-Specific</KOB><SubscriberDisplayName>BANK</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>05012014</InitialPaymentLevelDate><AccountCondition code=\"A2\">Paid</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"15\">Check Credit Or Line Of Credit</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>03012010</OpenDate><StatusDate>11012020</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"18\">Credit Card, Terms REV</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\"L\">Limit</Qualifier><Value>00015000</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>11282020</BalanceDate><BalanceAmount>00005804</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"O\">Open</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>99</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>CCCCCC-CC-CCC0CCCCCCCCCC</PaymentProfile><MonthlyPaymentAmount>00000094</MonthlyPaymentAmount><MonthlyPaymentType code=\"S\">Scheduled Term</MonthlyPaymentType><LastPaymentDate>11132020</LastPaymentDate><Subcode>1216268</Subcode><KOB code=\"BC\">Bank Credit Cards</KOB><SubscriberDisplayName>CITICARDS CBNA</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>11012020</InitialPaymentLevelDate><AccountCondition code=\"A1\">Open</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"18\">Credit Card, Terms REV</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>08172015</OpenDate><StatusDate>10012020</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"07\">Revolving Charge Account</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\"L\">Limit</Qualifier><Value>00001600</Value></Amount><Amount><Qualifier code=\"H\">High balance</Qualifier><Value>00000161</Value></Amount><BalanceDate>10282020</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"O\">Open</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>59</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>0-0000-000000000000000000</PaymentProfile><MonthlyPaymentAmount>        </MonthlyPaymentAmount><MonthlyPaymentType code=\" \">Estimated</MonthlyPaymentType><LastPaymentDate>01092016</LastPaymentDate><Subcode>1349030</Subcode><KOB code=\"ZR\">Retail, Not Elsewhere Classified</KOB><SubscriberDisplayName>BLOOM/FDSB</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>10012020</InitialPaymentLevelDate><AccountCondition code=\"A1\">Open</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"07\">Revolving Charge Account</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>04282015</OpenDate><StatusDate>06012018</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"18\">Credit Card, Terms REV</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\" \">Unknown</Qualifier><Value> UNKNOWN</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>01182019</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"O\">Open</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>42</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>-------</PaymentProfile><Subcode>3276502</Subcode><KOB code=\"BC\">Bank Credit Cards</KOB><SubscriberDisplayName>DISCOVER FIN SVCS LLC</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>06012018</InitialPaymentLevelDate><AccountCondition code=\"A1\">Open</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"18\">Credit Card, Terms REV</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><TradeLine><SpecialComment code=\"  \"/><Evaluation code=\"P\">No additional review is required</Evaluation><OpenDate>09022018</OpenDate><StatusDate>12012018</StatusDate><MaxDelinquencyDate>        </MaxDelinquencyDate><AccountType code=\"18\">Credit Card, Terms REV</AccountType><TermsDuration code=\"REV\">Revolving</TermsDuration><ECOA code=\"1\">Individual</ECOA><Amount><Qualifier code=\"L\">Limit</Qualifier><Value>00025000</Value></Amount><Amount><Qualifier code=\" \">Unknown</Qualifier><Value>        </Value></Amount><BalanceDate>12222018</BalanceDate><BalanceAmount>00000000</BalanceAmount><Status code=\"11\">This is an account in good standing</Status><AmountPastDue>        </AmountPastDue><OpenOrClosed code=\"O\">Open</OpenOrClosed><RevolvingOrInstallment code=\"R\">Revolving</RevolvingOrInstallment><ConsumerComment> </ConsumerComment><MonthsHistory>01</MonthsHistory><DelinquenciesOver30Days>00</DelinquenciesOver30Days><DelinquenciesOver60Days>00</DelinquenciesOver60Days><DelinquenciesOver90Days>00</DelinquenciesOver90Days><DerogCounter>00</DerogCounter><PaymentProfile>-</PaymentProfile><Subcode>1230206</Subcode><KOB code=\"BC\">Bank Credit Cards</KOB><SubscriberDisplayName>BANK OF AMERICA</SubscriberDisplayName><EnhancedPaymentData><InitialPaymentLevelDate>12012018</InitialPaymentLevelDate><AccountCondition code=\"A1\">Open</AccountCondition><PaymentStatus code=\"11\">Current</PaymentStatus><AccountType code=\"18\">Credit Card, Terms REV</AccountType><SpecialComment code=\"  \"/></EnhancedPaymentData></TradeLine><Inquiry><Date>08112020</Date><Amount> UNKNOWN</Amount><Type code=\"31\">Unknown - Credit Extension, Review, Or Collection</Type><Terms code=\"UNK\"/><Subcode>1156083</Subcode><KOB code=\"BB\">All Banks -- Non-Specific</KOB><SubscriberDisplayName>BANK</SubscriberDisplayName></Inquiry><Inquiry><Date>09242019</Date><Amount> UNKNOWN</Amount><Type code=\"31\">Unknown - Credit Extension, Review, Or Collection</Type><Terms code=\"UNK\"/><Subcode>1100294</Subcode><KOB code=\"BB\">All Banks -- Non-Specific</KOB><SubscriberDisplayName>BANK</SubscriberDisplayName></Inquiry><InformationalMessage><MessageNumber>83</MessageNumber><MessageText>0083 SSN NOT PROVIDED</MessageText></InformationalMessage><InformationalMessage><MessageNumber>57</MessageNumber><MessageText>0335 V384THE NUMBER OF INQUIRIES WAS ALSO A FACTOR, BUT EFFECT WAS NOT SIGNIFICANT</MessageText></InformationalMessage><Statement><Type code=\"06\">Victim statements</Type><DateReported>08222018</DateReported><StatementText><MessageText>06&amp; 08-22-18 3999999 ID FRAUD VICTIM ALERT FRAUDULENT APPLICATIONS MAY BE SUBMITTED IN MY NAME OR MY IDENTITY MAY HAVE BEEN USED WITHOUT MY CONSENT TO FRAUDULENTLY OBTAIN GOODS OR SERVICES. DO NOT EXTEND CREDIT WITHOUT FIRST CONTACTING ME PERSONALLY AND VERIFYING ALL APPLICATION INFORMATION AT DAY 555-555-5100 OR EVENING 555-555-5200. THIS VICTIM ALERT WILL BE MAINTAINED FOR SEVEN YEARS BEGINNING 09-22-13.</MessageText></StatementText></Statement></CreditProfile></Products></NetConnectResponse>",
      "total_debt": 5804,
      "total_debt_excluding_realestate": 5804,
      "total_monthly_payments": 117,
      "total_monthly_payments_excluding_realestate": 117,
      "revolving_credit_limit": 41600,
      "revolving_credit_balance": 5804,
      "dtc_ratio": "13.95",
      "revolving_credit_limit_excluding_secured": 41600,
      "revolving_credit_balance_excluding_secured": 5804,
      "dtc_ratio_excluding_secured": "13.95"
  }
]

const resultsNoScore = [{"firstname":"Alba","middlename":"","lastname":"Markgren","phone":"54326534","address":"24 Magnolia Ter","city":"South Hadley","state":"Ma","zip":"010751789","email":"bruno@nimblefi.com","response_heading":"Thank you for submitting your info!","response_content":"Although we weren't able to instantly match you with a loan offer, you may contact our office to inquire further about our lending options. And don't worry, this was a 'soft' credit pull so there was no impact to your credit.","consumerid":"188278","pull_type":"soft","result":"Not Qualified","time_created":"1603884608","time_updated":"1603884611","branchid":"0","branchname":"","loanofficerid":"0","loanofficername":"","lenderid":"1426","report_url":"https://secure.prequalsolutions.com/preq/api/viewReport.php?id=188278&t=1603885023&sc=896410fd9450d10c1547559fad90d69d320393793af4be6ef3052557949b0a84","report_xml":"<NetConnectResponse xmlns=\"http:\/\/www.experian.com\/NetConnectResponse\"><CompletionCode>0000<\/CompletionCode><ReferenceId>188278_1603884608<\/ReferenceId><TransactionId>113883823<\/TransactionId><Products xmlns=\"http:\/\/www.experian.com\/ARFResponse\"><CreditProfile><Header><ReportDate>10282020<\/ReportDate><ReportTime>063011<\/ReportTime><Preamble>TMA3<\/Preamble><ARFVersion>07<\/ARFVersion><ReferenceNumber>CPR 188278<\/ReferenceNumber><\/Header><RiskModel><ModelIndicator code=\"V3\">Vantage Score V3<\/ModelIndicator><Score>0004<\/Score><ScoreFactorCodeOne>  <\/ScoreFactorCodeOne><ScoreFactorCodeTwo>  <\/ScoreFactorCodeTwo><ScoreFactorCodeThree>  <\/ScoreFactorCodeThree><ScoreFactorCodeFour>  <\/ScoreFactorCodeFour><Evaluation code=\"P\">Positive number<\/Evaluation><\/RiskModel><ConsumerIdentity><Name><Surname>MARKGREN<\/Surname><First>ALBA<\/First><Middle>M<\/Middle><\/Name><YOB>    <\/YOB><\/ConsumerIdentity><ConsumerIdentity><Name><Type code=\"A\">AKA<\/Type><Surname>HACKETT<\/Surname><First>ALBA<\/First><Middle>M<\/Middle><\/Name><YOB>    <\/YOB><\/ConsumerIdentity><ConsumerIdentity><Name><Type code=\"A\">AKA<\/Type><Surname>LEROUX<\/Surname><First>ALBA<\/First><\/Name><YOB>    <\/YOB><\/ConsumerIdentity><ConsumerIdentity><Name><Surname>MARKGREN<\/Surname><First>BASDEN<\/First><\/Name><YOB>    <\/YOB><\/ConsumerIdentity><AddressInformation><FirstReportedDate>10202018<\/FirstReportedDate><LastUpdatedDate>06232020<\/LastUpdatedDate><Origination code=\"2\">Reported via A\/R Tape<\/Origination><TimesReported>00<\/TimesReported><LastReportingSubcode>1349190<\/LastReportingSubcode><DwellingType code=\"S\">Single-family dwelling<\/DwellingType><HomeOwnership code=\" \">Unknown<\/HomeOwnership><StreetPrefix>24<\/StreetPrefix><StreetName>MAGNOLIA<\/StreetName><StreetSuffix>TER<\/StreetSuffix><City>SOUTH HADLEY<\/City><State>MA<\/State><Zip>010751789<\/Zip><CensusGeoCode>       <\/CensusGeoCode><\/AddressInformation><AddressInformation><FirstReportedDate>05042004<\/FirstReportedDate><LastUpdatedDate>12282018<\/LastUpdatedDate><Origination code=\"1\">Reported via A\/R Tape, but different from inquiry<\/Origination><TimesReported>02<\/TimesReported><LastReportingSubcode>       <\/LastReportingSubcode><DwellingType code=\"S\">Single-family dwelling<\/DwellingType><HomeOwnership code=\" \">Unknown<\/HomeOwnership><StreetPrefix>240<\/StreetPrefix><StreetName>LOWER WESTFIELD<\/StreetName><StreetSuffix>RD<\/StreetSuffix><City>HOLYOKE<\/City><State>MA<\/State><Zip>010402715<\/Zip><CensusGeoCode>       <\/CensusGeoCode><\/AddressInformation><AddressInformation><FirstReportedDate>04072016<\/FirstReportedDate><LastUpdatedDate>08282016<\/LastUpdatedDate><Origination code=\"1\">Reported via A\/R Tape, but different from inquiry<\/Origination><TimesReported>00<\/TimesReported><LastReportingSubcode>       <\/LastReportingSubcode><DwellingType code=\"S\">Single-family dwelling<\/DwellingType><HomeOwnership code=\" \">Unknown<\/HomeOwnership><StreetPrefix>10<\/StreetPrefix><StreetName>BAKER<\/StreetName><StreetSuffix>ST<\/StreetSuffix><City>SOUTH HADLEY<\/City><State>MA<\/State><Zip>010752670<\/Zip><CensusGeoCode>       <\/CensusGeoCode><\/AddressInformation><EmploymentInformation><FirstReportedDate>04282013<\/FirstReportedDate><LastUpdatedDate>04282013<\/LastUpdatedDate><Origination code=\"2\">Inquiry<\/Origination><Name>ALLIED SIGNAL<\/Name><AddressFirstLine> <\/AddressFirstLine><AddressSecondLine> <\/AddressSecondLine><AddressExtraLine> <\/AddressExtraLine><Zip>          <\/Zip><\/EmploymentInformation><Inquiry><Date>07232020<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"08\">Real Estate Specific Type Unknown<\/Type><Terms code=\"UNK\"\/><Subcode>3996926<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>CREDCO<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>07162020<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"6D\">Home Equity<\/Type><Terms code=\"UNK\"\/><Subcode>1198453<\/Subcode><KOB code=\"AU\">Automobile Dealers, Used<\/KOB><SubscriberDisplayName>NOWCOM\/OZZYS AUTO CENT<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>05102020<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"92\">Utility Company<\/Type><Terms code=\"UNK\"\/><Subcode>0940725<\/Subcode><KOB code=\"UW\">Wireless Telephone Service Providers<\/KOB><SubscriberDisplayName>VERIZON WIRELESS<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>08162019<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"29\">Rental Agreement<\/Type><Terms code=\"UNK\"\/><Subcode>1904684<\/Subcode><KOB code=\"AU\">Automobile Dealers, Used<\/KOB><SubscriberDisplayName>NOWCOM\/HIGH CLASS AUTO<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>01112019<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"31\">Unknown - Credit Extension, Review, Or Collection<\/Type><Terms code=\"UNK\"\/><Subcode>1204820<\/Subcode><KOB code=\"FZ\">Finance Companies -- Non-Specific<\/KOB><SubscriberDisplayName>ENGS COMMERCIAL FINANC<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>12072018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"08\">Real Estate Specific Type Unknown<\/Type><Terms code=\"UNK\"\/><Subcode>6995966<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>EQUIFAX-LANDAM<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>09082018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"26\">Conventional Real Estate Loan, Including Purchase Money First<\/Type><Terms code=\"UNK\"\/><Subcode>1970173<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>CBCINNOVIS<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>09052018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"29\">Rental Agreement<\/Type><Terms code=\"UNK\"\/><Subcode>1904684<\/Subcode><KOB code=\"AU\">Automobile Dealers, Used<\/KOB><SubscriberDisplayName>NOWCOM\/HIGH CLASS AUTO<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>08162018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"26\">Conventional Real Estate Loan, Including Purchase Money First<\/Type><Terms code=\"UNK\"\/><Subcode>0970159<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>CBCINNOVIS<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>08162018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"31\">Unknown - Credit Extension, Review, Or Collection<\/Type><Terms code=\"UNK\"\/><Subcode>1995759<\/Subcode><KOB code=\"FM\">Mortgage Companies<\/KOB><SubscriberDisplayName>FIRST EASTERN MTG\/FHLM<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>08162018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"08\">Real Estate Specific Type Unknown<\/Type><Terms code=\"UNK\"\/><Subcode>3900614<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>FACTUAL DATA\/0600<\/SubscriberDisplayName><\/Inquiry><Inquiry><Date>08032018<\/Date><Amount> UNKNOWN<\/Amount><Type code=\"08\">Real Estate Specific Type Unknown<\/Type><Terms code=\"UNK\"\/><Subcode>1973062<\/Subcode><KOB code=\"FR\">Mortgage Reporters<\/KOB><SubscriberDisplayName>LANDAMERICA CREDIT SVC<\/SubscriberDisplayName><\/Inquiry><InformationalMessage><MessageNumber>83<\/MessageNumber><MessageText>0083 SSN NOT PROVIDED<\/MessageText><\/InformationalMessage><\/CreditProfile><\/Products><\/NetConnectResponse>","total_debt":0,"total_debt_excluding_realestate":0,"total_monthly_payments":0,"total_monthly_payments_excluding_realestate":0,"revolving_credit_limit":0,"revolving_credit_balance":0,"dtc_ratio":0,"revolving_credit_limit_excluding_secured":null,"revolving_credit_balance_excluding_secured":0,"dtc_ratio_excluding_secured":0}]

module.exports = { signer, validApplicant, processApplicantSuccess, processApplicantFailed, resultsSuccess, resultsNoScore }
