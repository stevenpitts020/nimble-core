exports.up = knex => knex.schema.raw(`UPDATE institutions SET public_metadata = (public_metadata ||
  '{
    "bsa": {
      "_": {
        "thresholds": [
          {"op": ">=", "val": 7, "risk": "High"},
          {"op": ">=", "val": 5, "risk": "Moderate"},
          {"risk": "Low"}
        ]
      },
      "usCitizen": {
        "order": 0,
        "text": "Are all account owners US citizens\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"no": 2},
        "required": true,
        "default": ""
      },
      "countryOfOrigin": {
        "order": 1,
        "text": "What is your country of origin\\?",
        "type": "string",
        "subtype": "country",
        "dependsOn": {"usCitizen": "no"},
        "required": true,
        "score": {
          "US": 0,
          "default": 0
        },
        "default": ""
      },
      "milesAway": {
        "order": 2,
        "text": "Does at least one account owner live within 50 miles of a Central Bank office\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"no": 2},
        "required": true,
        "default": ""
      },
      "hearAbout": {
        "order": 3,
        "text": "How did you hear about Central Bank\\?",
        "type": "string",
        "subtype": "text",
        "dependsOn": {"milesAway": "no"},
        "required": true,
        "default": null,
        "maxLength": 255,
        "regex": "^[a-zA-Z0-9- '']*$"
      },
      "individualIncome": {
        "order": 4,
        "text": "Is your individual income greater than $35,000\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"no": 1},
        "required": true,
        "default": ""
      },
      "householdIncome": {
        "order": 5,
        "text": "Is your household income greater than $50,000\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"no": 1},
        "required": true,
        "default": ""
      },
      "wireTransfersDomestic": {
        "order": 6,
        "text": "Do you anticipate 2 or more domestic wire transfers per month\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"yes": 2},
        "required": true,
        "default": ""
      },
      "wireTransfersInternational": {
        "order": 7,
        "text": "Do you anticipate 1 or more international wire transfers per month\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"yes": 2},
        "required": true,
        "default": ""
      },
      "cashTransactions": {
        "order": 8,
        "text": "Do you expect cash transactions in excess of $2,500 per month\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"yes": 2},
        "required": true,
        "default": ""
      },
      "anotherBank": {
        "order": 9,
        "text": "Will you maintain a checking account at another bank\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"yes": 1},
        "required": true,
        "default": ""
      },
      "otherBankName": {
        "order": 10,
        "dependsOn": {"anotherBank": "yes"},
        "text": "What is the name of the bank\\?",
        "type": "string",
        "subtype": "text",
        "dependsOn": {"anotherBank": "yes"},
        "required": true,
        "default": null,
        "maxLength": 100,
        "regex": "^[a-zA-Z0-9- '']*$"
      },
      "mobileOrATMDeposit": {
        "order": 11,
        "text": "Are you planning on using Mobile or ATM Deposits\\?",
        "type": "string",
        "subtype": "enum",
        "enum": ["yes", "no"],
        "score": {"yes": 1},
        "required": true,
        "default": ""
      }
    }
  }'::jsonb
);`)

exports.down = knex => {
  // noop, "bsa" is non-destructive
}
