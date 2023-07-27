// TODO: field regex validations, dependent fields/fieldsets validations, field value whitelisting and blacklisting, add bignumber or other number type for number values that need decimal precision and calculation, and validation monitoring (for possible attack alerts)

const Joi = require('@hapi/joi')

const schema = Joi.object({
  // User input
	intentToApplyJointly: Joi.object({
		jointApplicationRequired: Joi.boolean(),
		includesIncomeOrAssetsFromOtherPerson: Joi.boolean(),
		borrowerSignature: Joi.string().dataUri(),
		coborrowerSignature: Joi.string().dataUri()
	}),
  // User input
	mortgageType: Joi.string().valid('Conventional', 'FHA', 'Other', 'USDA/Rural Housing Service', 'VHA'),
	// User input
  mortgageTypeOther: Joi.string(),
	// User input
  agencyCaseNumber: Joi.string(),
	// User input
  lenderCaseNumber: Joi.string(),
	// Have it - Attom
  amount: Joi.number(),
  // Need it - Business Logic / Admin Panel
	interestRate: Joi.number(),
  // User input
	numberOfMonths: Joi.number(),
  // User input
	amortizationType: Joi.string().valid('ARM', 'Fixed Rate', 'GPM', 'Other'),
  // User input
	amortizationTypeOther: Joi.string(),
  // User input
	amortizationTypeARM: Joi.string(),
  // User input
	subjectPropertyAddress: Joi.string(),
  // Not sure - Attom
	numberOfUnits: Joi.number(),
  // Not sure - Attom
	legalDescriptionOfSubject: Joi.string(),
  // Not sure - Attom
	yearBuilt: Joi.number(),
  // User input
	purposeOfLoan: Joi.string().valid('Construction', 'Construction-Permanent', 'Other', 'Purchase', 'Refinance'),
	// User input
  purposeOfLoanOther: Joi.string(),
	// User input
  usageOfProperty: Joi.string().valid('Primary Residence', 'Secondary Residence', 'Investment'),
  constructionDetails: Joi.object({
    // Not sure - Attom
		yearLotAcquired: Joi.number(),
    // Not sure - Attom
		originalCost: Joi.number(),
    // Not sure - Attom
		amountExistingLiens: Joi.number(),
    // Not sure - Attom
		presentValueOfLot: Joi.number(),
    // User input
		costOfImprovements: Joi.number(),
    // Calculated
		total: Joi.number()
	}),
	refinanceDetails: Joi.object({
    // Not sure - Attom
		yearLotAcquired: Joi.number(),
    // Not sure - Attom
		originalCost: Joi.number(),
    // Not sure - Attom
		amountExistingLiens: Joi.number(),
    // User
		purposeOfRefinance: Joi.string(),
    // User
		improvementsType: Joi.string().valid('made', 'to be made'),
    // User
		improvementsCost: Joi.number()
	}),
  // User
	titleHeldInName: Joi.string(),
  // User
	titleHeldInManner: Joi.string(),
  // User
	estateHeldIn: Joi.string().valid('Fee Simple', 'Leasehold'),
  // User
	sourceOfPayments: Joi.string(),
	applicantDetails: Joi.array().items(
		Joi.object({
      // User
			applicant: Joi.string().valid('Borrower', 'Co-Borrower'),
      // Have it - Microblink
			name: Joi.string(),
      // Have it - Microbilt
			ssn: Joi.string(),
      // Not sure - Microbilt
			homePhone: Joi.string(),
      // Have it - Microblink
			dob: Joi.string(),
      // Not sure - Microbilt
			yearsOfSchool: Joi.number(),
      // Not sure - Microbilt
			maritalStatus: Joi.string().valid('Married', 'Unmarried', 'Separated'),
      // Not sure - Microbilt
			numberOfDependents: Joi.number(),
      // Not sure - Microbilt
			dependentAges: Joi.array().items(Joi.number()),
      // Not sure - Microbilt/Attom
			presentAddressType: Joi.string().valid('Own', 'Rent'),
      // For Own - Deduce from Attom - property/expandedProfile or salesHistory/expandedHistory
      // For Rent - Unknown
			presentAddressNumberOfYearsOccupied: Joi.number(),
      // Have it - Microblink
			presentAddress: Joi.string(),
      // Not sure - Microbilt - Enhanced People Search?
			mailingAddress: Joi.string(),
      // Not sure - Microbilt/Attom
			formerAddressType: Joi.string().valid('Own', 'Rent'),
      // For Own - Deduce from Attom - property/expandedProfile or salesHistory/expandedHistory
      // For Rent - Unknown
			formerAddressNumberOfYears: Joi.number(),
      // Not sure - Microbilt - Enhanced People Search
			formerAddress: Joi.string(),
      // Microbilt - Payroll Verification Service (contains employer info, employee info, employee earnings info)
			employment: Joi.object({
				current: Joi.object({
          // Microbilt - Secretary of State - Only if DBA or established business entity
          // Won't apply to 1099s
					selfEmployed: Joi.boolean(),
          // Microbilt - Payroll Verification Service
					employerName: Joi.string(),
          // Microbilt - Payroll Verification Service
					employerAddress: Joi.string(),
          // Not sure - Microbilt - Employment Search
					yearsOnJob: Joi.number(),
          // Not sure - User input
					yearsInProfession: Joi.number(),
          // Not sure - Data Axle - fill rate may be low though (meaning the percentage of people they have this info for) - Data Axle - primaryContactManagementLevel
					positionOrTypeOfBusiness: Joi.string(),
          // Not sure - Data Axle - fill rate may be low though
					businessPhone: Joi.string()
				}),
        // Same as above
				previous: Joi.array().items(
					Joi.object({
						selfEmployed: Joi.boolean(),
						employerName: Joi.string(),
						employerAddress: Joi.string(),
            // Not Sure - Data Axle - near primaryContactManagementLevel
            // Not Sure - Microbilt - Payroll Verification Service - 	Date of Check
						startDate: Joi.string(),
            // Same as startDate
						endDate: Joi.string(),
            // Microbilt - Payroll Verification Service
						monthlyIncome: Joi.number(),
						positionOrTypeOfBusiness: Joi.string(),
						businessPhone: Joi.string()
					})
				)
			}),
      // Not sure - I think Mark has mentioned some options - I have used The Work Number (https://theworknumber.com/) for income verification in the past, but I have no idea if Mark has used or wants to use them
      // Microbilt - Payroll Verification Service
			monthlyIncome: Joi.object({
        // Microbilt - Payroll Verification Service
				basePay: Joi.number(),
        // Microbilt - Payroll Verification Service - AdditionalIncomeType / AdditionalIncomeAmt
				overtime: Joi.number(),
        // Microbilt - Payroll Verification Service - AdditionalIncomeType / AdditionalIncomeAmt
				bonuses: Joi.number(),
        // Microbilt - Payroll Verification Service - AdditionalIncomeType / AdditionalIncomeAmt
				commissions: Joi.number(),
        // Not Sure - User Input - Stock Exchange API?
				dividendsAndInterest: Joi.number(),
        // Not Sure - Attom (estimated rental income?) - Verix (Tax Return - Would only be current as of most recent tax return)
				netRentalIncome: Joi.number(),
        // Not Sure - Many possible other income types - Further research needed
				otherIncome: Joi.array().items(
					Joi.object({
						description: Joi.string(),
						monthlyAmount: Joi.number()
					})
				),
        // Calculated
				otherTotal: Joi.number(),
				total: Joi.number()
			})
		})
	),
  // Not sure - https://plaid.com/docs/transactions/ - It's not clear to me how bank accounts are linked or whether we can link bank accounts from other financial institutions
	combinedMonthlyExpenses: Joi.object({
		present: Joi.object({
      // Not sure - User input
			rent: Joi.number(),
      // Not sure - User input - Microbilt UCC (will only apply for loans that have gone to collections)
			firstMortgagePAndI: Joi.number(),
			otherFinancingPAndI: Joi.number(),
      // Not sure - User input
			hazardInsurance: Joi.number(),
      // Attom - /property/expandedProfile - addressVerification/taxes
      // Or calculate based on estimated market value and pull tax rate for state from government website/database/api
			realEstateTaxes: Joi.number(),
      // Not sure - User input
			mortgageInsurance: Joi.number(),
      // Not sure - User input (check Attom ?)
			homeownerAssociationDues: Joi.number(),
      // Calculated values
			otherTotal: Joi.number(),
			total: Joi.number()
		}),
    // Not sure - User
		proposed: Joi.object({
			firstMortgagePAndI: Joi.number(),
			otherFinancingPAndI: Joi.number(),
			hazardInsurance: Joi.number(),
			realEstateTaxes: Joi.number(),
			mortgageInsurance: Joi.number(),
			homeownerAssociationDues: Joi.number(),
			otherTotal: Joi.number(),
			total: Joi.number()
		})
	}),
	assetsAndLiabilities: Joi.object({
		completedJointly: Joi.boolean(),
		assets: Joi.object({
			cashDepositTowardPurchaseHeldBy: Joi.string(),
			cashDepositAmount: Joi.number(),
      // Have it - https://developer.microbilt.com/bankaccountsearch/apis/post/GetReport
			checkingAndSavingsAccounts: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					financialInstitutionName: Joi.string(),
					financialInstitutionAddress: Joi.string(),
					accountNumber: Joi.string(),
					balance: Joi.number()
				})
			),
      // Not sure - user
			stocks: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					companyName: Joi.string(),
					tickerSymbol: Joi.string(),
					exchange: Joi.string(),
					quantity: Joi.number(),
					currentMarketValue: Joi.number(),
					totalMarketValue: Joi.number()
				})
			),
      // Calculated
			stocksTotalMarketValue: Joi.number(),
      // Not sure - user
			bonds: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					issuer: Joi.string(),
					quantity: Joi.number(),
					totalPresentValue: Joi.number()
				})
			),
      // Calculated
			bondsTotalPresentValue: Joi.number(),
      // Not sure - user
			lifeInsurance: Joi.object({
				owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
				faceAmount: Joi.number(),
				netCashValue: Joi.number()
			}),
      // Calculated
			lifeInsuranceTotalNetCashValue: Joi.number(),
      // Calculated
			subtotalLiquidAssets: Joi.number(),
      // Not sure - https://developer.microbilt.com/propertysearch/apis/post/GetReport
			realEstateOwned: Joi.object({
				owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
				marketValue: Joi.number()
			}),
      // Calculated
			realEstateOwnedTotalMarketValue: Joi.number(),
      // Not sure - User
			vestedInterestInRetirementFund: Joi.object({
				owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
				marketValue: Joi.number()
			}),
      // Calculated
			vestedInterestInRetirementFundTotalMarketValue: Joi.number(),
      // Not sure - Microbilt may be able to provide us with Secretary of State records for finding what businesses the user owns. Mark sent us an API for finding private business financial data, but I can't remember what it's called. May be in an email he sent
			newWorthOwnedBusinesses: Joi.object({
				owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
				marketValue: Joi.number()
			}),
			newWorthOwnedBusinessesTotalMarketValue: Joi.number(),
      // Have it - Microbilt
			automobilesOwned: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
          // Microbilt - Vehicle Search
					make: Joi.string(),
					year: Joi.number(),
          // Microbilt - Vehicle Pricing - Seems pretty inaccurate from my initial assessment
					marketValue: Joi.number()
				})
			),
			automobilesOwnedTotalMarketValue: Joi.number(),
      // Not sure - User
			otherAssets: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					type: Joi.string(),
					description: Joi.string(),
					marketValue: Joi.number()
				})
			),
			otherAssetsTotalMarketValue: Joi.number(),
      // Not sure - Microbilt property search / Attom sales history
			ownedRealEstateSchedule: Joi.object({
				properties: Joi.array().items(
					Joi.object({
						address: Joi.string(),
						saleStatus: Joi.string().valid('Sold', 'Pending Sale', 'Rental'),
						propertyType: Joi.string(),
						presentMarketValue: Joi.number(),
						mortgageAndLiensAmount: Joi.number(),
						grossRentalIncome: Joi.number(),
						mortgagePayments: Joi.number(),
						insuranceMaintenanceTaxesAndMiscellaneous: Joi.number(),
						netRentalIncome: Joi.number()
					})
				),
				totalPresentMarketValue: Joi.number(),
				totalGrossRentalIncome: Joi.number(),
				totalMortgagePayments: Joi.number(),
				totalMortgageAndLiensAmount: Joi.number(),
				totalInsuranceMaintenanceTaxesAndMiscellaneous: Joi.number(),
				totalNetRentalIncome: Joi.number()
			}),
			totalAssetsBorrower: Joi.number(),
			totalAssetsCoborrower: Joi.number(),
			totalAssetsJoint: Joi.number()
		}),
    // Not sure - https://developer.microbilt.com/uccsearchreport/apis/post/GetReports
		liabilities: Joi.object({
			creditAliases: Joi.array().items(
				Joi.object({
					alternateName: Joi.string(),
					creditorName: Joi.string(),
					accountNumber: Joi.string()
				})
			),
			liabilities: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					companyName: Joi.string(),
					companyAddress: Joi.string(),
					accountNumber: Joi.number(),
					monthlyPayment: Joi.number(),
					monthsLeftToPay: Joi.number(),
					unpaidBalance: Joi.number()
				})
			),
			alimonyChildSupportAndSeparateMaintenancePayments: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					type: Joi.string().valid('Alimony', 'Child Support', 'Separate Maintenance'),
					paymentsOwedTo: Joi.string(),
					monthlyPayment: Joi.number()
				})
			),
			jobRelatedExpenses: Joi.array().items(
				Joi.object({
					owner: Joi.string().valid('Borrower', 'Co-Borrower', 'Joint'),
					type: Joi.string(),
					monthlyPayment: Joi.number()
				})
			),
			totalMonthlyPaymentsBorrower: Joi.number(),
			totalMonthlyPaymentsCoborrower: Joi.number(),
			totalMonthlyPaymentsJoint: Joi.number(),
			totalLiabilitiesBorrower: Joi.number(),
			totalLiabilitiesCoborrower: Joi.number(),
			totalLiabilitiesJoint: Joi.number()
		}),
		netWorthBorrower: Joi.number(),
		netWorthCoborrower: Joi.number(),
		netWorthJoint: Joi.number()
	}),
	detailsOfTransaction: Joi.object({
		purchasePrice: Joi.number(),
		alterationsImprovementsAndRepairs: Joi.number(),
		land: Joi.number(),
		refinance: Joi.number(),
		estimatedPrepaidItems: Joi.number(),
		estimatedClosingCosts: Joi.number(),
		PMIAndMIPAndFundingFee: Joi.number(),
		discount: Joi.number(),
		totalCosts: Joi.number(),
		subordinateFinancing: Joi.number(),
		borrowersClosingCostsPaidBySeller: Joi.number(),
		otherCredits: Joi.array().items(
			Joi.object({
				description: Joi.string(),
				cashValue: Joi.number()
			})
		),
		otherCreditsTotal: Joi.number(),
		loanAmount: Joi.number(),
		PMIAndMIPAndFundingFeeFinanced: Joi.number(),
		totalLoanAmount: Joi.number(),
		cashFromOrToBorrower: Joi.number()
	}),
	declarations: Joi.array().items(
		Joi.object({
			declarer: Joi.string().valid('Borrower', 'Co-Borrower'),
			outstandingJudgments: Joi.boolean(),
			bankruptcyInPast7Years: Joi.boolean(),
			foreclosureOrEquivalentInPast7Years: Joi.boolean(),
			partyToLawsuit: Joi.boolean(),
			priorLoanResultedInForeclosureOrEquivalentOrJudgment: Joi.boolean(),
			presentlyDelinquentOrInDefault: Joi.boolean(),
			alimonyChildSupportOrSeparateMaintenance: Joi.boolean(),
			anyPartOfDownPaymentBorrowed: Joi.boolean(),
			comakerOrEndorserOnNote: Joi.boolean(),
			usCitizen: Joi.boolean(),
			permanentResidentAlien: Joi.boolean(),
			willOccupyPropertyAsPrimaryResidence: Joi.boolean(),
			propertyOwnershipInPast3YearsDetails: Joi.array().items(
				Joi.object({
					propertyOwnershipInPast3Years: Joi.boolean(),
					typeOfProperty: Joi.string().valid('Principal Residence', 'Second Home', 'Investment Property'),
					mannerTitleHeld: Joi.string().valid(
						'By Yourself',
						'Jointly With Spouse',
						'Jointly With Another Person'
					)
				})
			)
		})
	),
	acknowledgmentAndAgreement: Joi.object({
		signatures: Joi.array().items(
			Joi.object({
				signer: Joi.string().valid('Borrower', 'Co-Borrower'),
				signature: Joi.string().dataUri(),
				date: Joi.string()
			})
		),
		loanOrigination: Joi.object({
			originatorSignature: Joi.string().dataUri(),
			originatorSignatureDate: Joi.string(),
			originatorName: Joi.string(),
			originatorIdentifier: Joi.string(),
			originatorPhoneNumber: Joi.string(),
			companyName: Joi.string(),
			companyIdentifier: Joi.string(),
			companyAddress: Joi.string()
		})
	}),
	continuationSheet: Joi.object({
		borrowerName: Joi.string(),
		coborrowerName: Joi.string(),
		agencyCaseNumber: Joi.string(),
		lenderCaseNumber: Joi.string(),
		signatures: Joi.array().items(
			Joi.object({
				signer: Joi.string().valid('Borrower', 'Co-Borrower'),
				signature: Joi.string().dataUri(),
				date: Joi.string()
			})
		),
		attachedSheets: Joi.array().items(
			Joi.object({
				applicant: Joi.string().valid('Borrower', 'Co-Borrower'),
				attachedSheet: Joi.string().dataUri()
			})
		)
	}),
	loanNumber: Joi.string()
})

const mockUniformResidentialLoanApplication = {
	intentToApplyJointly: {
		jointApplicationRequired: true,
		includesIncomeOrAssetsFromOtherPerson: true,
		borrowerSignature:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABA4AAAE4CAYAAADbxbFXAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Q+QJNdd2PHfm5lFSoKtk6sM2NjW3s2bsyxVkM52TGyT6ERIQhmMTgY7JJjcqiq2EztYJ6ooQ4pEp6IKbCqFVhA7WJDcCccYMKA7MAUVQ3QX8L8YobsKsk+aN9IeKDa2wL7zn5Qv2zsv9RteH32t2Z3p3vnT3e87VVer0/brfu/z+nZnfv17v2eEFwIIIIAAAggggAACCCCAAAIIILCNgEEGAQQQQAABBBBAAAEEEEAAAQQQ2E6AwAH3BgIIIIAAAggggAACCCCAAAIIbCtA4ICbAwEEEEAAAQQQQAABBBBAAAEECBxwDyCAAAIIIIAAAggggAACCCCAQHEBMg6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAA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Y54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAmC0fSYAAAhqSURBVAgggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCPx/rCihdJbYhSYAAAAASUVORK5CYII=',
		coborrowerSignature:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABA4AAAE4CAYAAADbxbFXAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Q+QJNdd2PHfm5lFSoKtk6sM2NjW3s2bsyxVkM52TGyT6ERIQhmMTgY7JJjcqiq2EztYJ6ooQ4pEp6IKbCqFVhA7WJDcCccYMKA7MAUVQ3QX8L8YobsKsk+aN9IeKDa2wL7zn5Qv2zsv9RteH32t2Z3p3vnT3e87VVer0/brfu/z+nZnfv17v2eEFwIIIIAAAggggAACCCCAAAIIILCNgEEGAQQQQAABBBBAAAEEEEAAAQQQ2E6AwAH3BgIIIIAAAggggAACCCCAAAIIbCtA4ICbAwEEEEAAAQQQQAABBBBAAAEECBxwDyCAAAIIIIAAAggggAACCCCAQHEBMg6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAA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Y54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAmC0fSYAAAhqSURBVAgggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCPx/rCihdJbYhSYAAAAASUVORK5CYII='
	},
	mortgageType: 'Conventional',
	agencyCaseNumber: '0987123456',
	lenderCaseNumber: '7123456',
	amount: 500000,
	interestRate: 0.03,
	numberOfMonths: 360,
	amortizationType: 'Fixed Rate',
	subjectPropertyAddress: '100 Main St, Suite 330, Boston, MA 02111-1307',
	numberOfUnits: 1,
	legalDescriptionOfSubject: 'BOSTON PARK LOT 21',
	yearBuilt: 1980,
	purposeOfLoan: 'Construction',
	usageOfProperty: 'Primary Residence',
	constructionDetails: {
		yearLotAcquired: 2020,
		originalCost: 100000,
		amountExistingLiens: 0,
		presentValueOfLot: 99999,
		costOfImprovements: 50000,
		total: 149999
	},
	titleHeldInName: 'Bob Smith',
	titleHeldInManner: 'Joint Tenancy',
	estateHeldIn: 'Fee Simple',
	sourceOfPayments: 'Checking and Savings Accounts',
	applicantDetails: [
		{
			applicant: 'Borrower',
			name: 'Bob Smith',
			ssn: '012345678',
			homePhone: '1112223333',
			dob: '1980-01-20',
			yearsOfSchool: 16,
			maritalStatus: 'Married',
			numberOfDependents: 2,
			dependentAges: [ 1, 2 ],
			presentAddressType: 'Own',
			presentAddressNumberOfYearsOccupied: 6,
			presentAddress: '200 Main St, Suite 310, Boston, MA 02111-1307',
			employment: {
				current: {
					selfEmployed: false,
					employerName: 'ACME',
					employerAddress: '300 Main St, Boston, MA 02111-1307',
					yearsOnJob: 3,
					yearsInProfession: 10,
					positionOrTypeOfBusiness: 'Auditor',
					businessPhone: '2221113333'
				}
			},
			monthlyIncome: {
				basePay: 8000,
				dividendsAndInterest: 200,
				otherIncome: [
					{
						description: 'Gifts',
						monthlyAmount: 100
					}
				],
				otherTotal: 100,
				total: 8300
			}
		},
		{
			applicant: 'Co-Borrower',
			name: 'Alice Smith',
			ssn: '012345679',
			homePhone: '1112223333',
			dob: '1980-01-20',
			yearsOfSchool: 16,
			maritalStatus: 'Married',
			presentAddressType: 'Own',
			presentAddressNumberOfYearsOccupied: 6,
			presentAddress: '200 Main St, Suite 310, Boston, MA 02111-1307',
			employment: {
				current: {
					selfEmployed: false,
					employerName: 'ACME',
					employerAddress: '300 Main St, Boston, MA 02111-1307',
					yearsOnJob: 3,
					yearsInProfession: 10,
					positionOrTypeOfBusiness: 'Auditor',
					businessPhone: '2221113333'
				}
			},
			monthlyIncome: {
				basePay: 8000,
				dividendsAndInterest: 200,
				total: 8200
			}
		}
	],
	combinedMonthlyExpenses: {
		present: {
			firstMortgagePAndI: 2000,
			realEstateTaxes: 100,
			homeownerAssociationDues: 150,
			total: 2250
		},
		proposed: {
			firstMortgagePAndI: 2500,
			realEstateTaxes: 125,
			homeownerAssociationDues: 180,
			total: 2805
		}
	},
	assetsAndLiabilities: {
		completedJointly: true,
		assets: {
			cashDepositTowardPurchaseHeldBy: 'Titles And Escrow LLC',
			cashDepositAmount: 100000,
			checkingAndSavingsAccounts: [
				{
					owner: 'Joint',
					financialInstitutionName: 'Bank of America',
					financialInstitutionAddress: '100 Main St, New York, NY, 10001',
					accountNumber: '012345678912',
					balance: 1000000
				}
			],
			stocks: [
				{
					owner: 'Borrower',
					companyName: 'Bank Of America',
					exchange: 'NYSE',
					tickerSymbol: 'BAC',
					quantity: 100,
					currentMarketValue: 40,
					totalMarketValue: 4000
				},
				{
					owner: 'Co-Borrower',
					companyName: 'Bank Of America',
					exchange: 'NYSE',
					tickerSymbol: 'BAC',
					quantity: 100,
					currentMarketValue: 40,
					totalMarketValue: 4000
				}
			],
			stocksTotalMarketValue: 8000,
			subtotalLiquidAssets: 1108000,
			automobilesOwned: [
				{
					owner: 'Joint',
					make: 'Toyota',
					year: 2010,
					marketValue: 9000
				}
			],
			automobilesOwnedTotalMarketValue: 9000,
			totalAssetsBorrower: 4000,
			totalAssetsCoborrower: 4000,
			totalAssetsJoint: 1117000
		},
		liabilities: {
			liabilities: [
				{
					owner: 'Joint',
					companyName: 'Bank Of America',
					companyAddress: '100 Main St, New York, NY, 10001',
					accountNumber: '012345678912',
					monthlyPayment: 10000,
					monthsLeftToPay: 1,
					unpaidBalance: 10000
				}
			],
			jobRelatedExpenses: [
				{
					owner: 'Joint',
					type: 'Childcare',
					monthlyPayment: 2200
				}
			],
			totalMonthlyPaymentsJoint: 12200,
			totalLiabilitiesJoint: 10000
		},
		netWorthBorrower: 4000,
		netWorthCoborrower: 4000,
		netWorthJoint: 1107000
	},
	detailsOfTransaction: {
		purchasePrice: 500000,
		estimatedPrepaidItems: 2500,
		estimatedClosingCosts: 25000,
		PMIAndMIPAndFundingFee: 5000,
		totalCosts: 532500,
		loanAmount: 527500,
		totalLoanAmount: 527500,
		cashFromOrToBorrower: 5000
	},
	declarations: [
		{
			declarer: 'Borrower',
			outstandingJudgments: false,
			bankruptcyInPast7Years: false,
			foreclosureOrEquivalentInPast7Years: false,
			partyToLawsuit: false,
			priorLoanResultedInForeclosureOrEquivalentOrJudgment: false,
			presentlyDelinquentOrInDefault: false,
			alimonyChildSupportOrSeparateMaintenance: false,
			anyPartOfDownPaymentBorrowed: false,
			comakerOrEndorserOnNote: false,
			usCitizen: true,
			permanentResidentAlien: false,
			willOccupyPropertyAsPrimaryResidence: true,
			propertyOwnershipInPast3YearsDetails: [
				{
					propertyOwnershipInPast3Years: true,
					typeOfProperty: 'Principal Residence',
					mannerTitleHeld: 'Jointly With Spouse'
				}
			]
		},
		{
			declarer: 'Co-Borrower',
			outstandingJudgments: false,
			bankruptcyInPast7Years: false,
			foreclosureOrEquivalentInPast7Years: false,
			partyToLawsuit: false,
			priorLoanResultedInForeclosureOrEquivalentOrJudgment: false,
			presentlyDelinquentOrInDefault: false,
			alimonyChildSupportOrSeparateMaintenance: false,
			anyPartOfDownPaymentBorrowed: false,
			comakerOrEndorserOnNote: false,
			usCitizen: true,
			permanentResidentAlien: false,
			willOccupyPropertyAsPrimaryResidence: true,
			propertyOwnershipInPast3YearsDetails: [
				{
					propertyOwnershipInPast3Years: true,
					typeOfProperty: 'Principal Residence',
					mannerTitleHeld: 'Jointly With Spouse'
				}
			]
		}
	],
	acknowledgmentAndAgreement: {
		signatures: [
			{
				signer: 'Borrower',
				signature:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABA4AAAE4CAYAAADbxbFXAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Q+QJNdd2PHfm5lFSoKtk6sM2NjW3s2bsyxVkM52TGyT6ERIQhmMTgY7JJjcqiq2EztYJ6ooQ4pEp6IKbCqFVhA7WJDcCccYMKA7MAUVQ3QX8L8YobsKsk+aN9IeKDa2wL7zn5Qv2zsv9RteH32t2Z3p3vnT3e87VVer0/brfu/z+nZnfv17v2eEFwIIIIAAAggggAACCCCAAAIIILCNgEEGAQQQQAABBBBAAAEEEEAAAQQQ2E6AwAH3BgIIIIAAAggggAACCCCAAAIIbCtA4ICbAwEEEEAAAQQQQAABBBBAAAEECBxwDyCAAAIIIIAAAggggAACCCCAQHEBMg6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAA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Y54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAmC0fSYAAAhqSURBVAgggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCPx/rCihdJbYhSYAAAAASUVORK5CYII=',
				date: '2021-08-20'
			},
			{
				signer: 'Co-Borrower',
				signature:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABA4AAAE4CAYAAADbxbFXAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Q+QJNdd2PHfm5lFSoKtk6sM2NjW3s2bsyxVkM52TGyT6ERIQhmMTgY7JJjcqiq2EztYJ6ooQ4pEp6IKbCqFVhA7WJDcCccYMKA7MAUVQ3QX8L8YobsKsk+aN9IeKDa2wL7zn5Qv2zsv9RteH32t2Z3p3vnT3e87VVer0/brfu/z+nZnfv17v2eEFwIIIIAAAggggAACCCCAAAIIILCNgEEGAQQQQAABBBBAAAEEEEAAAQQQ2E6AwAH3BgIIIIAAAggggAACCCCAAAIIbCtA4ICbAwEEEEAAAQQQQAABBBBAAAEECBxwDyCAAAIIIIAAAggggAACCCCAQHEBMg6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAA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Y54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAmC0fSYAAAhqSURBVAgggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCPx/rCihdJbYhSYAAAAASUVORK5CYII=',
				date: '2021-08-20'
			}
		],
		loanOrigination: {
			originatorSignature:
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABA4AAAE4CAYAAADbxbFXAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Q+QJNdd2PHfm5lFSoKtk6sM2NjW3s2bsyxVkM52TGyT6ERIQhmMTgY7JJjcqiq2EztYJ6ooQ4pEp6IKbCqFVhA7WJDcCccYMKA7MAUVQ3QX8L8YobsKsk+aN9IeKDa2wL7zn5Qv2zsv9RteH32t2Z3p3vnT3e87VVer0/brfu/z+nZnfv17v2eEFwIIIIAAAggggAACCCCAAAIIILCNgEEGAQQQQAABBBBAAAEEEEAAAQQQ2E6AwAH3BgIIIIAAAggggAACCCCAAAIIbCtA4ICbAwEEEEAAAQQQQAABBBBAAAEECBxwDyCAAAIIIIAAAggggAACCCCAQHEBMg6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAAgWgECBxEM9UMFAEEEEAAAQQQQAABBBBAAIHiAgQOipvRAgEEEEAAAQQQQAABBBBAAIFoBAgcRDPVDBQBBBBAAAEEEEAAAQQQQACB4gIEDoqb0QIBBBBAAAEEEEAAAQQQQACBaAQIHEQz1QwUAQQQQAABBBBAAAEEEEAAgeICBA6Km9ECAQQQQAABBBBAAAEEEEAA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Y54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAmC0fSYAAAhqSURBVAgggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCBA4iGOeGSUCCCCAAAIIIIAAAggggAACpQQIHJRioxECCCCAAAIIIIAAAggggAACcQgQOIhjnhklAggggAACCCCAAAIIIIAAAqUECByUYqMRAggggAACCCCAAAIIIIAAAnEIEDiIY54ZJQIIIIAAAggggAACCCCAAAKlBAgclGKjEQIIIIAAAggggAACCCCAAAJxCPx/rCihdJbYhSYAAAAASUVORK5CYII=',
			originatorSignatureDate: '2021-08-20',
			originatorName: 'Carlos Vendez',
			originatorIdentifier: '01234567',
			originatorPhoneNumber: '2223334444',
			companyName: 'Remax',
			companyIdentifier: '012345678',
			companyAddress: '5075 S Syracuse St, Denver, CO 80237'
		}
	},
	loanNumber: '0987654321'
}

const validate = value => {
  const { error } = schema.validate(value)
  return [error || null, (error) ? null : 'Validation successful.']
}

module.exports = {
  mockUniformResidentialLoanApplication,
  validate
}
