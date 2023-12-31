const successResponse = {
  code: 'OK',
  summary: 'The results have been successfully retrieved!',
  executionId: 'a74f9092-5889-430a-9c19-6712f9f68383',
  DEBUG: {
    EXECUTION_STARTED: 0,
    IMAGE_LOAD_FROM_URL: '248ms',
    IMAGE_PREPARATION_FINISHED: 248,
    OCR_PROCESS_STARTED: 250,
    TASK_ON_WORKER: '536ms',
    OCR_PROCESS_FINISHED: 786,
    BEFORE_RESPONSE: 789,
  },
  data: {
    recognizer: 'BLINK_ID',
    version: '2.8.1',
    startTime: '2019-11-20T12:13:05.052Z',
    finishTime: '2019-11-20T12:13:05.587Z',
    durationTimeInSeconds: 0.535,
    taskId: 132,
    workerId: 0,
    result: {
      firstName: 'SAMPLE',
      lastName: 'SPECIMEN',
      fullName: '',
      address: '123 MAIN STREET APT. 1\nORLANDO, FL 17101-0000',
      dateOfBirth: {
        day: 18,
        month: 3,
        year: 1990,
        originalString: '03/18/1990',
      },
      dateOfIssue: {
        day: 18,
        month: 3,
        year: 2018,
        originalString: '03/18/2018',
      },
      dateOfExpiry: {
        day: 18,
        month: 3,
        year: 2025,
        originalString: '03/18/2025',
      },
      documentNumber: 'S123-456-78-123-0',
      sex: 'M',
      additionalNameInformation: '',
      additionalAddressInformation: '',
      placeOfBirth: '',
      nationality: '',
      race: '',
      religion: '',
      profession: '',
      maritalStatus: '',
      residentialStatus: '',
      employer: '',
      personalIdNumber: '',
      documentAdditionalNumber: '',
      issuingAuthority: '',
      conditions: '',
      type: 'BLINK_ID',
    }
  }
}

const successUSDLAAMVABack = {
  "code": "OK",
  "summary": "The results have been successfully retrieved!",
  "executionId": "13a03e74-0902-4b1c-9445-75b02467775f",
  "data":     {
    "recognizer": "USDL",
    "result": {
        "documentType": "AAMVA",
        "standardVersionNumber": "3",
        "customerFamilyName": "MICROBLINK",
        "customerFirstName": "SAMPLE",
        "customerFullName": "MICROBLINK,SAMPLE",
        "dateOfBirth": "07011980",
        "sex": "1",
        "eyeColor": "BRO",
        "addressStreet": "4151 WEST YOAKUM AVE",
        "addressCity": "KINGSVILLE",
        "addressJurisdictionCode": "TX",
        "addressPostalCode": "78363",
        "fullAddress": "4151 WEST YOAKUM AVE, KINGSVILLE, TX, 78363",
        "height": "64 in",
        "heightIn": "64",
        "heightCm": "163",
        "customerMiddleName": null,
        "hairColor": "BRO",
        "nameSuffix": null,
        "AKAFullName": null,
        "AKAFamilyName": null,
        "AKAGivenName": null,
        "AKASuffixName": null,
        "weightRange": null,
        "weightPounds": null,
        "weightKilograms": null,
        "customerIdNumber": "24255226",
        "familyNameTruncation": null,
        "firstNameTruncation": null,
        "middleNameTruncation": null,
        "placeOfBirth": null,
        "addressStreet2": null,
        "raceEthnicity": null,
        "namePrefix": null,
        "countryIdentification": "USA",
        "residenceStreetAddress": null,
        "residenceStreetAddress2": null,
        "residenceCity": null,
        "residenceJurisdictionCode": null,
        "residencePostalCode": null,
        "residenceFullAddress": null,
        "under18": null,
        "under19": null,
        "under21": null,
        "socialSecurityNumber": null,
        "AKASocialSecurityNumber": null,
        "AKAMiddleName": null,
        "AKAPrefixName": null,
        "organDonor": null,
        "veteran": null,
        "AKADateOfBirth": null,
        "issuerIdentificationNumber": "636015",
        "documentExpirationDate": "07012020",
        "jurisdictionVersionNumber": "0",
        "jurisdictionVehicleClass": "C",
        "jurisdictionRestrictionCodes": "NONE",
        "jurisdictionEndorsementCodes": "NONE",
        "documentIssueDate": "07092014",
        "federalCommercialVehicleCodes": "NONE",
        "issuingJurisdiction": "ZT",
        "standardVehicleClassification": null,
        "issuingJurisdictionName": "Texas",
        "standardEndorsementCode": null,
        "standardRestrictionCode": null,
        "jurisdictionVehicleClassificationDescription": null,
        "jurisdictionEndorsmentCodeDescription": null,
        "jurisdictionRestrictionCodeDescription": null,
        "inventoryControlNumber": null,
        "cardRevisionDate": null,
        "documentDiscriminator": "52365214412589652478",
        "limitedDurationDocument": null,
        "auditInformation": null,
        "complianceType": null,
        "issueTimestamp": null,
        "permitExpirationDate": null,
        "permitIdentifier": null,
        "permitIssueDate": null,
        "numberOfDuplicates": null,
        "HAZMATExpirationDate": null,
        "medicalIndicator": null,
        "nonResident": null,
        "uniqueCustomerId": null,
        "dataDiscriminator": null,
        "documentExpirationMonth": null,
        "documentNonexpiring": null,
        "securityVersion": null,
        "type": "USDL"
    }
  }
}



const successMRTD = {
  "code": "OK",
  "summary": "The results have been successfully retrieved!",
  "executionId": "13a03e74-0902-4b1c-9445-75b02467775f",
  "data":     {
    "recognizer": "MRTD",
    "version": "2.10.0",
    "startTime": "2020-03-05T17:08:49.533Z",
    "finishTime": "2020-03-05T17:08:49.661Z",
    "durationTimeInSeconds": 0.128,
    "taskId": 299,
    "workerId": 1,
    "result": {
      "primaryID": "BOND",
      "secondaryID": "JAMES MICHAEL",
      "documentCode": "I<",
      "documentNumber": "123928201ZY8",
      "documentType": "IDENTITY_CARD",
      "issuer": "PRT",
      "sex": "M",
      "nationality": "PRT",
      "dateOfBirth": {
        "day": 16,
        "month": 6,
        "year": 1982,
        "originalString": "820616"
      },
      "dateOfExpiry": {
        "day": 9,
        "month": 4,
        "year": 2020,
        "originalString": "200409"
      },
      "alienNumber": "",
      "applicationReceiptNumber": "",
      "immigrantCaseNumber": "",
      "mrtdVerified": true,
      "opt1": "<<<<<<<<<<",
      "opt2": "<<<<<<<<<<<",
      "rawMRZString": "SOMETHING SOMETHING\n",
      "type": "MRTD"
    }
  }
}


const failedMRTD = {
  "code": "OK",
  "summary": "The results have been successfully retrieved!",
  "executionId": "13a03e74-0902-4b1c-9445-75b02467775f",
  "data": [
    {
      "recognizer": "MRTD",
      "version": "2.10.0",
      "startTime": "2020-03-05T17:08:49.533Z",
      "finishTime": "2020-03-05T17:08:49.661Z",
      "durationTimeInSeconds": 0.128,
      "taskId": 299,
      "workerId": 1,
      "result": null
    }
  ]
}

const invalidImageResponse = {
  code: 'IMAGE_IS_NOT_VALID_BASE64_STRING',
  summary: 'Error, imageBase64 is not able to decode!',
}

module.exports = {successResponse, successMRTD, invalidImageResponse, failedMRTD, successUSDLAAMVABack}
