/*
 * Copyright (c) 2024, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable no-undef */
const { renderGivenTemplate, loadLayoutFromAPI } = require('../utils/util');
const fs = require('fs');
const path = require('path');
const adminDao = require('../dao/admin');
const IdentityProviderDTO = require("../dto/identityProvider");
const config = require(process.cwd() + '/config.json');
const constants = require('../utils/constants');
const adminService = require('../services/adminService');
const filePrefix = config.pathToContent;


const loadSettingPage = async (req, res) => {

    let orgID;
    const completeTemplatePath = path.join(require.main.filename, '..', 'pages', 'configure', 'page.hbs');
    const layoutPath = path.join(require.main.filename, '..', 'pages', 'layout', 'main.hbs');

    let templateContent = {
        baseUrl: req.params.orgName,
        orgContent: true
    }
    let layoutResponse = "";
    let views;
    try {
        if (config.mode === constants.DEV_MODE) {
            const retrievedIDP = await getMockIdentityProvider();
            templateContent.idp = retrievedIDP;
            views = [{
                'name': 'Default'
            }]
            templateContent.createIDP = true
            templateContent.content = true;
            templateContent.orgContent = true;
            templateContent.views = views;
            templateContent.apiProviders = getMockAPIProviders();
        } else {
            //retrieve orgID from the user object
            if (req.user) {
                orgID = req.user[constants.ORG_ID];
            } else {
                let orgName = req.params.orgName;
                orgID = await adminDao.getOrgId(orgName);
                const templatePath = path.join(require.main.filename, '..', 'pages', 'error-page', 'page.hbs');
                const templateResponse = fs.readFileSync(templatePath, constants.CHARSET_UTF8);
                const layoutResponse = await loadLayoutFromAPI(orgID);
                let html = await renderGivenTemplate(templateResponse, layoutResponse, {});
                return res.send(html);
            }
            templateContent.orgID = orgID;
            const retrievedIDP = await adminDao.getIdentityProvider(orgID);
            if (retrievedIDP.length > 0) {
                templateContent.idp = new IdentityProviderDTO(retrievedIDP[0]);
            } else {
                templateContent.createIDP = true;
            }
            //TODO: fetch view names from DB
            const file = await adminService.getOrgContent(orgID, 'layout', 'main.hbs', 'layout');
            if (file !== null) {
                views = [{
                    'name': 'Default'
                }]
                templateContent.content = true;
                templateContent.views = views;
                templateContent.orgContent = false;
            }
            //get api providers
            const apiProviders = await getAPIProviders(orgID);
            if (apiProviders.length > 0) {
                templateContent.apiProviders = apiProviders;
            }
            layoutResponse = await loadLayoutFromAPI(orgID);
        }
        if (layoutResponse === "") {
            layoutResponse = fs.readFileSync(layoutPath, constants.CHARSET_UTF8);
        }
        const templateResponse = fs.readFileSync(completeTemplatePath, constants.CHARSET_UTF8);
        let html = await renderGivenTemplate(templateResponse, layoutResponse, templateContent);
        res.send(html);
    } catch (error) {
        console.error(`Error while loading content from DB: ${error}`);
    }
}

async function getMockAPIProviders() {

    const mockAPIProvidersDataPath = path.join(process.cwd(), filePrefix + '../mock/APIProviders/APIProviders.json');
    const mockAPIProvidersData = JSON.parse(fs.readFileSync(mockAPIProvidersDataPath, 'utf-8'));
    return mockAPIProvidersData;
}

async function getAPIProviders(orgID) {

    const apiProviders = await adminService.getAllProviders(orgID);
    return apiProviders;
}

async function getMockIdentityProvider() {

    const mockIdentityProviderDataPath = path.join(process.cwd(), filePrefix + '../mock/IdentityProvider/identityProvider.json');
    const mockIDPaData = JSON.parse(fs.readFileSync(mockIdentityProviderDataPath, 'utf-8'));
    return mockIDPaData;
}

const createOrganization = async (req, res) => {

    let templateContent = {};
    try {
        if (config.mode === constants.DEV_MODE) {
            const organizations = await getMockOrganizations();
            templateContent.organizations = organizations;
        } else {
            templateContent = {
                'orgID': req.user[constants.ORG_ID],
                'profile': req.user
            }
            //fetch all created organizations
            const organizations = await adminService.getAllOrganizations();
            let orgs = organizations.length;
            if (orgs !== 0) {
                templateContent.organizations = organizations;
            }
        }
        const completeTemplatePath = path.join(require.main.filename, '..', 'pages', 'portal', 'page.hbs');
        const layoutPath = path.join(require.main.filename, '..', 'pages', 'layout', 'main.hbs');
        const templateResponse = fs.readFileSync(completeTemplatePath, constants.CHARSET_UTF8);
        const layoutResponse = fs.readFileSync(layoutPath, constants.CHARSET_UTF8);
        const html = await renderGivenTemplate(templateResponse, layoutResponse, templateContent);
        res.send(html);

    } catch (error) {
        console.error(`Error while loading setting page: ${error}`);
    }
}

async function getMockOrganizations() {

    const mockOrganizationPath = path.join(process.cwd(), filePrefix + '../mock/Organization',
        '/organizations.json');
    const mockOrgData = JSON.parse(fs.readFileSync(mockOrganizationPath, 'utf-8'));
    return mockOrgData;
}

module.exports = {
    loadSettingPage,
    createorganization: createOrganization
};