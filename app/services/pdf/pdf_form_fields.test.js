const getPdfFormFields = () => {
	const fieldsForPDF = {
		// type of mortgage and terms of loan
		amount: '500000',
		borrower: 'Bob Smith',
		borrowerDOB: '1980-01-20',
		borrowerAddress: '200 Main St, Suite 310, Boston, MA 02111-1307',
		borrowerEmployerName: 'ACME',
		borrowerEmployerAddress: '300 Main St, Boston, MA 02111-1307',
		// borrowerSelfEmployed: fields.borrowerSelfEmployed, // checkbox

		coborrower: 'Alice Smith',
		coborrowerDOB: '1980-01-20',
		coborrowerAddress: '200 Main St, Suite 310, Boston, MA 02111-1307',
		coborrowerEmployerName: 'ACME',
		coborrowerEmployerAddress: '300 Main St, Boston, MA 02111-1307',
		// coborrowerSelfEmployed: fields.coborrowerSelfEmployed, // checkbox
		// property information and purpose of loan
		subjectPropertyAddress: '100 Main St, Suite 330, Boston, MA 02111-1307',
		subjectLegalDescription: 'BOSTON PARK LOT 21',
		yearBuilt: 'BOSTON PARK LOT 21',
		ownerTitleName: 'Bob Smith',
		loanAmount: '527500'
		// presentAddress: fullAddress,
		// construction or construction-permanent loan
		/*
    Not needed for personal loan real estate demo
    yearAcquired: data.assessments.year,
    originalCost: data.salePrice,
    valueLot: data.assessments.land,
    valueImprovements: data.assessments.improvements,
    valueLotAndImprovements: data.assessments.land + data.assessments.improvements,
     */

		// details transaction
		// purchasePrice: data.salePrice,
		// alterationValue: data.assessments.improvements,
		// landValue: data.assessments.land,
	}

	return Object.keys(fieldsForPDF).map((key) => {
		return {
			key,
			value: '' + fieldsForPDF[key],
			readOnly: false
		}
	})
}

module.exports = { getPdfFormFields }
