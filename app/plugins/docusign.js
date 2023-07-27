const { base64Decode } = require('./codec')
const config = require('../../config')
const jwt = require('./jwt')
const moment = require('moment')
const docusign = require('docusign-esign')
const _ = require('lodash')
const logger = require('./logger').getLogger('app.plugins.docusign')

/**
 * Sends documents using docusign
 */
class Docusign {
  constructor() {
    this.docusignApiService = new docusign.ApiClient()
    this.templatesApi = new docusign.TemplatesApi()
    this.envelopesApi = new docusign.EnvelopesApi()

    this.templatesApi.setApiClient(this.docusignApiService)
    this.envelopesApi.setApiClient(this.docusignApiService)

    // map roles from docusign
    this.docusignRoles = {
      Admin: 'admin',
      signer1: 'signer',
      signer2: 'signer2',
      signer3: 'signer3',
      signer4: 'signer4'
    }

    // These templates are now fetched from db on contract.send
    this.docusignTemplates = {}

    this.productTemplates = {
      // checkings
      'simple-checking': ['Terms', 'TIS Simple Checking', 'Fees', 'EFT', 'FundsAvail', 'Privacy', 'AccountApplication'],
      'shamrock-checking': ['Terms', 'TIS Shamrock', 'Fees', 'EFT', 'FundsAvail', 'Privacy', 'AccountApplication'],
      'platinum-checking': ['Terms', 'TIS Platinum Checking', 'Fees', 'EFT', 'FundsAvail', 'Privacy', 'AccountApplication'],
      // savings
      'classic-savings': ['Terms', 'TIS Classing Savings', 'Fees', 'EFT', 'Privacy', 'AccountApplication'],
      'money-market-savings': ['Terms', 'TIS Money Market', 'Fees', 'EFT', 'Privacy', 'AccountApplication'],
      'platinum-savings': ['Terms', 'TIS Platinum Money Market', 'Fees', 'EFT', 'Privacy', 'AccountApplication'],
      // certificates of deposit TODO
      'fixed-rate-certificates-of-deposit': [],
      'cd-plus-certificates-of-deposit': [],
      'rule-breaker-certificates-of-deposit': []
    }
  }

  setDocusignTemplates(templates = {}) {
    return this.docusignTemplates = templates
  }

  /**
   * This is a method that sends a composite document with docusign from registration
   * we can extend this in the future to add more documents
   *
   * @param {string} accountRequestId - the id for the account request
   * @param {Array} signers - Array with personal information about each signer
   * @param { institutionName: '', productName: '', ownership: '', productConfigurations: [], openingAmount: '', createRecipientView: false } options - Information about the chosen products, amount
   * @param { fullName: '', email: '' } ccRecipient - Information about the copy carbon recipient
   *
   **/
  async sendEnvelopeWithMultipleDocuments(contractData = {
    accountRequestId: '',
    signers: [],
    accountOptions: { institutionName: '', productName: '', ownership: '', productConfigurations: [], openingAmount: '', createRecipientView: false },
    ccRecipient: { fullName: '', email: '' }
  }) {

    this._validateContractData(contractData)

    // destructure arguments
    const { accountRequestId, signers, ccRecipient, accountOptions } = contractData

    try {
      logger.debug(`[sendEnvelopeWithMultipleDocuments] starting authentication called for account request [${accountRequestId}]`)
      await this._setDocusignAuthorizationAndSetHeader()
    } catch(err) {
      logger.error(err, `[sendEnvelopeWithMultipleDocuments] authentication error for account request [${accountRequestId}]`)
      throw new Error(err)
    }

    try {
      // get ids for templates we need
      const templateIDs = this._getTemplateForProduct(accountOptions.productConfigurations[0].product.sku)

      const compositeTemplates = await Promise.all(_.map(templateIDs, async(templateID, index) => {
        return await this.buildCompositeTemplate(signers, accountOptions, ccRecipient, templateID, index)
      }))
      logger.info(`[sendEnvelopeWithMultipleDocuments] created templates for SKU ${accountOptions.productConfigurations[0].product.sku}`)

      // create the envelope definition
      const envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
        emailSubject: this._buildSubject(accountOptions.institutionName, accountOptions.productName),
        status: 'sent',
        compositeTemplates: compositeTemplates,
        eventNotification: this._buildEventNotification(accountRequestId)
      })

      logger.info(`[sendEnvelopeWithMultipleDocuments] createEnvelope start for account request [${accountRequestId}]`)

      const results = await this.envelopesApi.createEnvelope(
        config.get('docusign').accountID,
        { envelopeDefinition }
      )

      logger.info({ envelopeId: results.envelopeId }, `[sendEnvelopeWithMultipleDocuments] createEnvelope success for account request [${accountRequestId}]`)

      return { results }
    } catch(err) {
      logger.error(err, `[sendEnvelopeWithMultipleDocuments] error for account request [${accountRequestId}]`)
      throw new Error(err)
    }
  }

  /**
   * Update Recipient and Tabs information for a envelope and signer
   *
   * @param { institutionName: '', productName: '', ownership: '', productConfigurations: [], openingAmount: '' } options - Information about the chosen products, amount
   * @param {string} envelopeId - the id for the account request
   *
   **/
  async updateEnvelopeRecipients(contractData = {
    accountRequestId: '',
    signers: [],
    accountOptions: { institutionName: '', productName: '', ownership: '', productConfigurations: [], openingAmount: '' }
  }, envelopeId, signerId) {

    logger.debug(`[updateEnvelopeRecipients] called for account request [${contractData.accountRequestId}]`)

    this._validateContractData(contractData)

    if (_.isEmpty(envelopeId))
      throw new Error('Cannot update envelope without envelopeId.')

    if (_.isEmpty(signerId))
      throw new Error('Cannot update envelope without signerId.')

    const { signers } = contractData

    try {
      const accountId = config.get('docusign').accountID
      await this._setDocusignAuthorizationAndSetHeader()

      // Update all the tabs the recipient with new information
      const indexOfSigner = _.findIndex(signers, { id: signerId })
      const updatedSigner = await this._getUpdatedRecipientAndTabs(signers[indexOfSigner], accountId, envelopeId, indexOfSigner + 1)

      // one big update all signers with tabs
      const objRecipients = docusign.Recipients.constructFromObject({
        signers: [updatedSigner]
      })

      // Now we need to update the recipient information as well (fullname and email)
      // because the embed method uses the fullname and email as identifier
      // IF WE DONT UPDATE THIS INFORMATION, THEN THE EMBED WILL FAIL
      const results = await this.envelopesApi.updateRecipients(
        accountId,
        envelopeId,
        { recipients: objRecipients }
      )

      logger.info(results, `[updateEnvelopeRecipients] finished with success for account request [${contractData.accountRequestId}]`)
      return results

    } catch(err) {
      logger.error(err, `[updateEnvelopeRecipients] error for account request [${contractData.accountRequestId}]`)
      throw new Error(err)
    }
  }

  /**
   * Update Tabs for a specific Recipient
   * Returns signer obj
   *
   * @param {Signer} signer - a nimble Signer
   * @param {uuid} accountId - docusign account id
   * @param {uuid} envelopeId - envelope identitifer
   * @param {integer} position - which signer (0-4). also used as recipientId
   */
  async _getUpdatedRecipientAndTabs(signer, accountId, envelopeId, position) {
    try {
      // 1. get our mapped personal information
      const signerMap = this._mapSignerInformationToTextLabels(signer)

      // 2. get tabs for this envelope AND recipient
      const templateTabs = await this.envelopesApi.listTabs(accountId, envelopeId, position)

      logger.debug(`[_getUpdatedRecipientAndTabs] updatedTextTabs for signer [${signer.id}] on position ${position}`)

      // 3. all the tab labels from the API have this format "label#suffix", like "name#3" or "email#2"
      // so we need to take care of that
      // we cannot use the _prepopulateTextTabs method because of that
      const updatedTextTabs = []
      templateTabs.textTabs.forEach((tab) => {
        // clean the tabLabel so we can find it in our signerMapped key/values
        const tabValue = signerMap[tab.tabLabel.substring(0, tab.tabLabel.indexOf('#'))]
        // if we find a value, we update for that label
        if (tabValue) {
          updatedTextTabs.push({
            tabId: tab.tabId,
            value: tabValue
          })
        }
      })

      if (_.isEmpty(updatedTextTabs)) {
        logger.debug(`[_getUpdatedRecipientAndTabs] updatedTextTabs is empty for signer [${signer.id}] on position ${position}`)
        return null
      }

      const tabs = {
        textTabs: updatedTextTabs
      }

      // we update all the individual tabs for this recipient
      await this.envelopesApi.updateTabs(
        accountId,
        envelopeId,
        position.toString(),
        { tabs }
      )

      logger.info(`[_getUpdatedRecipientAndTabs] updateTabs success for signer [${signer.id}] on position ${position}`)

      // return a signer obj
      return this._buildSigner(signer, position, tabs)

    } catch(err) {
      logger.error(err, `[_getUpdatedRecipientAndTabs] found a error for signer [${signer.id}] on position ${position}`)
      return null
    }
  }

  /**
   * Create a url for creating a embed view for a envelope and signer.
   *
   * @param {string} envelopeId - the id for the envelope
   * @param {signer} signer - Signer personal information. At least, email, full name and id
   * @param {string} institutionDomain - Domain for a institution
   *
   **/
  async createRecipientView(envelopeId, signer, institutionDomain) {
    if (_.isEmpty(envelopeId))
      throw new Error('Cannot send envelope without envelopeId.')

    if (_.isEmpty(signer))
      throw new Error('Cannot send envelope without signer.')

    if (_.isEmpty(institutionDomain))
      throw new Error('Cannot send envelope without institutionDomain.')

    logger.info(`[createRecipientView] started for envelope [${envelopeId}] and signer [${signer.id}]`)
    await this._setDocusignAuthorizationAndSetHeader()

    const viewRequest = new docusign.RecipientViewRequest()

    viewRequest.authenticationMethod = 'None'
    viewRequest.email = signer.email
    viewRequest.userName = this._fullName(signer)
    viewRequest.clientUserId = signer.id
    viewRequest.xFrameOptions = 'same_origin' // or same_origin
    // viewRequest.securityDomain = "http://localhost:3000"
    viewRequest.returnUrl = this._getReturnURL(institutionDomain)

    logger.debug(`[createRecipientView] request for envelope [${envelopeId}] and signer [${signer.id}]`)

    const embedResults = await this.envelopesApi.createRecipientView(
      config.get('docusign').accountID,
      envelopeId,
      { recipientViewRequest: viewRequest }
    )

    logger.info(`[createRecipientView] finished for envelope [${envelopeId}] and signer [${signer.id}]`)
    return embedResults.url
  }

  /**
   * Build template for savings document
   *
   * @param {Array} signers - Array with personal information about each signer
   * @param { institutionName: '', productName: '', ownership: '', products: [], openingAmount: '' } options - Information about the chosen products, amount
   * @param { fullName: '', email: '' } ccRecipient - Information about the copy carbon recipient
   * @param { string } templateID - docusign template id
   *
   */
  async buildSavingsTemplate(signers, options, ccRecipient, templateId) {
    const accountId = config.get('docusign').accountID
    const documentId = '1' // if we don't remove existing document 1 inside a template and add more, this should be 1

    logger.info(`[buildSavingsTemplate] getDocumentTabs start for template [${templateId}]`)

    // get list of fields for the document template
    const templateTabs = await this.templatesApi.getDocumentTabs(accountId, templateId, documentId)

    // Create a object with all the data for each signer for the contract
    const recipientsData = docusign.Recipients.constructFromObject({
      // / Build a list of cc recipients. We're only adding one now (the institution main responsible)
      carbonCopies: await this._buildCCRecipientsList(ccRecipient),
      // populate docusign fields with user registration infromation
      signers: this._buildAccountSavingsSignersList(signers, options, templateTabs)
    })

    // create a composite template for the Server Template
    const compositeTemplate = docusign.CompositeTemplate.constructFromObject({
      compositeTemplateId: 'base-1',
      serverTemplates: [docusign.ServerTemplate.constructFromObject({ templateId, sequence: '1' })],
      // Add the roles via an inlineTemplate
      inlineTemplates: [
        docusign.InlineTemplate.constructFromObject({ sequence: '1', recipients: recipientsData })
      ]
    })

    logger.info(`[buildSavingsTemplate] - returning composite template for template [${templateId}]`)
    return compositeTemplate
  }

  /**
   * WIP Build template for other templates
   *
   * @param {Array} signers - Array with personal information about each signer
   * @param { institutionName: '', productName: '', ownership: '', products: [], openingAmount: '' } options - Information about the chosen products, amount
   * @param { fullName: '', email: '' } ccRecipient - Information about the copy carbon recipient
   * @param { string } templateId - docusign template id
   * @param { string } uniqueId - compositeTemplateId
   *
   */
  async buildCompositeTemplate(signers, options, ccRecipient, templateId, uniqueId = '1') {
    // check if the templateID is for the Account Application, our only exception
    if (this.docusignTemplates['AccountApplication'] === templateId) {
      logger.info(`[buildCompositeTemplate] return AccountApplication for template [${templateId}]`)
      return await this.buildSavingsTemplate(signers, options, ccRecipient, templateId)
    }

    // At this point, we only need the first signer to sign some pages
    // The other signers don't do anything. If that changes, then we have to add the other signers
    const signersList = signers.map((signer, index) => {
      return this._buildSigner(signer, index + 1)
    })

    const recipientsData = docusign.Recipients.constructFromObject({
      // populate docusign fields with user registration information
      signers: signersList
    })

    const compositeTemplate = docusign.CompositeTemplate.constructFromObject({
      compositeTemplateId: uniqueId,
      serverTemplates: [docusign.ServerTemplate.constructFromObject({ templateId, sequence: '1' })],
      // Overwrite the roles via an inlineTemplate
      inlineTemplates: [
        docusign.InlineTemplate.constructFromObject({ sequence: '2', recipients: recipientsData })
      ]
    })
    logger.info(`[buildCompositeTemplate] finished with compositeTemplateId [${uniqueId}] for template [${templateId}]`)
    return compositeTemplate
  }

  /**
   * Gets the PDF pertaining to a specific envelope ID.
   *
   * @param {Object} envelopeId - the envelope ID
   */
  async getCombinedPDFById(envelopeId) {
    try {
      logger.info(`[getCombinedPDFById] started for envelope [${envelopeId}]`)
      await this._setDocusignAuthorizationAndSetHeader()
      const accountId = config.get('docusign').accountID

      return this.envelopesApi.getDocument(accountId, envelopeId, 'combined', null)
    } catch(err) {
      logger.error(err, `[getCombinedPDFById] error for envelope [${envelopeId}]`)
      throw new Error(err)
    }
  }

  /**
   * Gets the each document from an envelope ID
   *
   * @param {Object} envelopeId - the envelope ID
   */
  async getEnvelopeFileContents(envelopeId, sku) {
    try {
      logger.info(`[getEnvelopeFileContents] started for envelope [${envelopeId}] and sku [${sku}]`)
      await this._setDocusignAuthorizationAndSetHeader()
      const accountId = config.get('docusign').accountID
      // return this.envelopesApi.getDocument(accountId, envelopeId, 'combined', null);
      return Promise.all(this.productTemplates[sku].map(async(templateId, index) => {
        const DocumentIndex = new String(index + 1) // docusign sets documentId to "index" starting at "1"
        const pdf = await this.envelopesApi.getDocument(accountId, envelopeId, DocumentIndex, null)
        return {
          filename: _.camelCase(templateId),
          file: Buffer.from(pdf, 'binary')
        }
      }))

    } catch(err) {
      logger.error(err, `[getEnvelopeFileContents] error for envelope [${envelopeId}] and sku [${sku}] `)
      throw new Error(err)
    }
  }

  /**
   *  Gets a Envelope from Docusign
   *
   * @param {Object} envelopeId - the envelope ID
   */
  async getEnvelopeById(envelopeId) {
    try {
      logger.info(`[getEnvelopeById] started for envelope [${envelopeId}]`)
      await this._setDocusignAuthorizationAndSetHeader()
      const accountId = config.get('docusign').accountID

      return await this.envelopesApi.getEnvelope(accountId, envelopeId, { include: 'recipients' })
    } catch(err) {
      logger.error(err, `[getEnvelopeById] error for envelope [${envelopeId}]`)
      throw new Error(err)
    }
  }

  /**
   * Creates a List of Docusign Signer Objects for the Account Saving Template
   *
   * @param {Array} signers - Array with personal information about each signer
   * @param { institutionName: '', productName: '', ownership: '', products: [], openingAmount: '' } options - Information about the chosen products, amount
   * @param {*} templateTabs - tab object from docusign
   */
  _buildAccountSavingsSignersList(signers, options, templateTabs) {
    logger.debug(`[_buildAccountSavingsSignersList] started`)
    // create a object with all personal information to fill Text Boxes
    const textTabsContent = signers.map(signer => {
      return this._mapSignerInformationToTextLabels(signer)
    })

    const signersList = signers.map((signer, index) => {
      // signer 1 contains extra information
      if (index == 0) {
        return this._buildMainSigner(signers, options, templateTabs)
      }
      const tabs = {
        textTabs: this._populateTextTabs(templateTabs, textTabsContent[index], index + 1)
      }
      return this._buildSigner(signer, index + 1, tabs)
    })

    logger.debug(`[_buildAccountSavingsSignersList] finished`)
    return signersList
  }

  /**
   * TODO Refactor this method. It's doing too much. Responsibility should be shared here.
   * Creates a Docusign Signer Object for the main signer on the Account Savings Template.
   * Maps signer information to document tab fields.
   *
   * @param {Array} signers - Array with personal information about each signer
   * @param { institutionName: '', productName: '', ownership: '', products: [], openingAmount: '' } options - Information about the chosen products, amount
   * @param {*} templateTabs - tab object from docusign
   */
  _buildMainSigner(signers, options, templateTabs) {
    // create a object with all personal information to fill Text Boxes
    let textTabsContent = this._mapSignerInformationToTextLabels(signers[0])
    logger.debug(`[_buildMainSigner] started for signer [${signers[0].id}]`)
    // apply some formatting to the initial deposit amount
    textTabsContent.openingDepositAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(options.openingAmount / 100)

    // Build a list of all radio boxes groups
    const radioGroup = docusign.RadioGroup.constructFromObject({
      groupName: 'radioOwnershipType',
      radios: [
        docusign.Radio.constructFromObject({ value: 'individual', selected: (signers.length == 1 ? true : false) }),
        docusign.Radio.constructFromObject({ value: 'joint_survivor', selected: (signers.length > 1 ? true : false) })
      ]
    })

    // we need to pass the product name to a text field
    textTabsContent.productName = options.productConfigurations[0].product.name

    // product options for the product the account request chose
    const productOptions = options.productConfigurations[0].product.options
    if (productOptions && productOptions.length > 0) {
      // we need to pass the account number to a text field
      if (_.some(productOptions, { key: 'account_number' })) {
        textTabsContent.accountNumber = productOptions.find(option => option.category === 'account_number').value
      }
    }

    // populate the checkboxes for the account agreement
    const checkboxGroup = this._populateCheckBoxTabsForAccountAgreement(options.productConfigurations[0].product.category)

    const tabs = {
      textTabs: this._populateTextTabs(templateTabs, textTabsContent, 1),
      radioGroupTabs: [radioGroup],
      checkboxTabs: checkboxGroup
    }

    logger.debug(`[_buildMainSigner] finished for signer [${signers[0].id}]`)
    return this._buildSigner(signers[0], 1, tabs)
  }

  /**
   * Populate checkboxes in the account agreement document
   *
   * @param {string} productCategory
   */
  _populateCheckBoxTabsForAccountAgreement(productCategory) {
    logger.debug(`[_populateCheckBoxTabsForAccountAgreement] started for product category [${productCategory}]`)
    const checkKeys = {
      'CHECKING': [
        ['checkFunds', true],
        ['checkDebit', true],
        ['checkATM', false]
      ],
      'SAVINGS': [
        ['checkFunds', false],
        ['checkDebit', false],
        ['checkATM', true]
      ]
    }
    const checkboxGroup = checkKeys[productCategory].map(obj => {
      const [tabLabel, selected] = obj
      return docusign.Checkbox.constructFromObject({ tabLabel, selected })
    })

    logger.debug(`[_populateCheckBoxTabsForAccountAgreement] finished for product category [${productCategory}]`)
    return checkboxGroup
  }

  /**
   * Creates a Docusign Signer Object. Maps signer information to document tab fields.
   *
   * @param {Array} signers - Array with personal information about each signer
   * @param {integer} position - position for the suffix
   * @param {any} tabs - tab object from docusign
   */
  _buildSigner(signer, position = 1, tabs = {}) {
    logger.debug(`[_buildSigner] for signer [${signer.id}] at position ${position}`)
    const result = docusign.Signer.constructFromObject({
      email: signer.email,
      name: this._fullName(signer),
      roleName: this.docusignRoles[`signer${position}`],
      recipientId: position.toString(),
      tabs,
      // Specifies whether the recipient is embedded or remote.
      // If the clientUserId property is not null then the recipient is embedded.
      // Use this field to associate the signer with their userId in our app.
      clientUserId: signer.id
    })

    logger.debug(`[_buildSigner] finished for signer [${signer.id}] at position ${position}`)
    return result
  }

  /**
   * Creates an array of textTabs with information from a signer, mapped to the template tabs
   *
   * @param {Object} templateTabs - tab onject from docusign
   * @param {key: value} signerMap - Key, value pairs with text mapped information
   * @param {integer} position - position for the suffix
   */
  _populateTextTabs(templateTabs, signerMap, position = 1) {
    logger.debug(`[_populateTextTabs] started for signer at position ${position}`)
    const prepopulatedTabs = []

    // if we are using this to populate fields for multiple signers,
    // then we need to add a suffix to the tab label
    const suffix = (position > 1 ? `#${position}` : '')

    templateTabs.textTabs.forEach((tab) => {
      if (signerMap[tab.tabLabel]) {
        const tempTab = {
          ...tab,
          tabLabel: `\\*${tab.tabLabel}${suffix}`,
          value: signerMap[tab.tabLabel],
          locked: 'true'
        }
        prepopulatedTabs.push(tempTab)
      }
    })

    logger.debug(`[_populateTextTabs] finished for signer at position ${position}`)
    return prepopulatedTabs
  }

  /**
   * Build a list of carbon copy recipients for the document
   *
   * @param {Object} adminData - an admin to put in copy
   */
  _buildCCRecipientsList(adminRecipient) {
    logger.debug(`[_buildCCRecipientsList] started for [${adminRecipient.email}]`)
    // Create the cc recipients
    const admin = docusign.CarbonCopy.constructFromObject({
      email: adminRecipient.email,
      name: adminRecipient.fullName,
      roleName: this.docusignRoles.Admin,
      recipientId: '5'
    })

    logger.debug(`[_buildCCRecipientsList] finished for [${adminRecipient.email}]`)
    return [admin]
  }

  /**
   *  Create email subject for send document
   *
   * @param {string} institutionName - name for the bank or institution
   */
  _buildSubject(institutionName, productName) {
    if (_.isEmpty(institutionName) || _.isEmpty(productName))
      throw new Error('Missing institutionName or productName')

    return `Your ${institutionName} ${productName} Account Agreement`
  }

  /**
   *  Build a full name from a signer
   *
   * @param {object} signer - a signer
   */
  _fullName(signer) {
    if (_.isEmpty(signer))
      throw new Error('Missing signer')

    if (signer.firstName) {
      // Docusign has a 100 character max length on fullname
      return _.truncate(`${signer.firstName} ${signer.lastName}`, {
        length: 100
      })
    }
    // If the signer does not have firstName it means that it was not onboarded yet
    // so we will use the signer id as name in order to be able to distinguish
    // different signers with the same email
    return `${signer.id}`
  }

  /**
   *  Map common personal information from each signer into a object with keys that match docusign
   *
   * @param {object} signer - a signer
   */
  _mapSignerInformationToTextLabels(signer) {
    return {
      fullName: this._fullName(signer),
      email: signer.email,
      clientUserId: signer.id,
      address1_2: [
        signer.address,
        [
          signer.city,
          signer.state,
          signer.zipCode
        ].join(', ')
      ].join('\n'),
      ssn: signer.ssn,
      birthDate: moment(signer.dateOfBirth).format('M/D/YYYY'),
      phone: signer.phoneNumber,
      presentEmployer: signer.employer,
      govID_type: signer.documentType === 'USDL' ? 'Drivers License' : 'Passport',
      govID_number: signer.documentNumber,
      govID_issued: moment(signer.documentIssuedDate).format('M/D/YYYY'),
      govID_expires: moment(signer.documentExpirationDate).format('M/D/YYYY')
    }
  }

  /**
   *  Build URL to return to when you finish signing a envelope (embedding)
   *
   * @param {string} domain - domain for institution
   */
  _getReturnURL(domain) {
    if (_.isEmpty(domain))
      throw new Error('Missing institutionDomain')

    // get this url example 'http://localhost:3000/:domain/onboarding/:prospect_id/signers/:signer_id?name=:invitedBy&token=:token'
    const baseUrl = config.get('frontend.inviteeOnboardingURI')
      .replace(':protocol', config.get('protocol'))
      .replace(':onboarding_domain', config.get('frontend.onboarding_domain'))
      .replace(':prospect_id', 'sign-contract')
      .replace(':domain', domain)

    // remove text until signers word
    const returnUrl = baseUrl.substring(0, baseUrl.indexOf('signers'))

    return returnUrl
  }

  /**
   *  Get array of docusign templates for a product sku
   *
   * @param {string} sku - a product Sku
   */
  _getTemplateForProduct(sku) {
    if (_.isEmpty(sku))
      throw new Error('Missing sku')

    if (_.isEmpty(this.docusignTemplates))
      throw new Error('Missing templates')

    return Object.values(_.pick(this.docusignTemplates, this.productTemplates[sku]))
  }

  /**
   *  Create Webhook Notification for send document
   *
   * @param {string} accountRequestId - account request id
   */
  _buildEventNotification(accountRequestId) {
    const connectJWT = jwt.encode({ id: accountRequestId })
    const connectUrl = `${config.get('protocol')}://${config.get('domain')}/v1/webhooks/docusign/connect/${accountRequestId}/contract/${connectJWT}`

    return {
      url: connectUrl,
      loggingEnabled: 'true',
      includeCertificateOfCompletion: 'false',
      includeDocuments: 'false',
      includeDocumentFields: 'false',
      requireAcknowledgment: 'false',
      envelopeEvents: [
        { envelopeEventStatusCode: 'sent' },
        { envelopeEventStatusCode: 'delivered' },
        { envelopeEventStatusCode: 'completed' },
        { envelopeEventStatusCode: 'declined' },
        { envelopeEventStatusCode: 'voided' }
      ],
      recipientEvents: [
        { recipientEventStatusCode: 'sent' },
        { recipientEventStatusCode: 'delivered' },
        { recipientEventStatusCode: 'completed' },
        { recipientEventStatusCode: 'declined' }
      ]
    }
  }

  /**
   *  DRY validations on contract data
   */
  _validateContractData(contractData = {
    accountRequestId: '',
    signers: [],
    accountOptions: { institutionName: '', productName: '', ownership: '', productConfigurations: [], openingAmount: '', createRecipientView: false },
    ccRecipient: { fullName: '', email: '' }
  }) {
    const { accountRequestId, signers, accountOptions } = contractData

    if (_.isEmpty(accountRequestId))
      throw new Error('Cannot send envelope without accountRequestId.')

    if (_.isEmpty(this.docusignTemplates))
      throw new Error('Missing templates')

    if (_.isEmpty(signers))
      throw new Error('Cannot send envelope without signers.')

    if (_.isEmpty(accountOptions))
      throw new Error('Cannot send envelope without options.')

    if (signers.length > 4)
      throw new Error('A document only accepts 4 signers max.')

    if (!Number.isInteger(accountOptions.openingAmount))
      throw new Error('Expecting a number for initial Deposit.')

    if (_.isEmpty(accountOptions.productConfigurations))
      throw new Error('Cannot send envelope without products.')

    return true
  }

  /**
   *  Sets docusign header information and authorization for the api
   */
  async _setDocusignAuthorizationAndSetHeader() {
    const oauthPath = config.get('docusign').oauthPath
    const basePath = config.get('docusign').basePath
    this.docusignApiService.setOAuthBasePath(oauthPath)

    const res = await this.docusignApiService.requestJWTUserToken(
      config.get('docusign').clientID,
      config.get('docusign').userID,
      'signature impersonation',
      base64Decode(config.get('docusign.privateKey')),
      900
    )
    const accessToken = res.body.access_token
    this.docusignApiService.addDefaultHeader('Authorization', `Bearer ${accessToken}`)
    // this could posssibilty be fetched from the user but requires a extra call
    this.docusignApiService.setBasePath(basePath)
  }
}

module.exports = new Docusign()
