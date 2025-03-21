/* eslint-disable no-undef */
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
const { invokeApiRequest } = require('../utils/util');
const config = require(process.cwd() + '/config');
const controlPlaneUrl = config.controlPlane.url;
const util = require('../utils/util');
const passport = require('passport');
const { Strategy: CustomStrategy } = require('passport-custom');


const unsubscribeAPI = async (req, res) => {
    try {
        const subscriptionId = req.params.subscriptionId;
        res.send(await invokeApiRequest(req, 'DELETE', `${controlPlaneUrl}/subscriptions/${subscriptionId}`, {}, {}));
    } catch (error) {
        console.error("Error occurred while unsubscribing from API", error);
        util.handleError(res, error);
    }
}

const subscribeAPI = async (req, res) => {
    try {
        res.send(await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/subscriptions`, {}, req.body));
    } catch (error) {
        console.error("Error occurred while subscribing to API", error);
        util.handleError(res, error);
    }
}

// ***** POST / DELETE / PUT Functions ***** (Only work in production)

// ***** Save Application *****

const saveApplication = async (req, res) => {
    try {
        let { name, throttlingPolicy, description } = req.body;

        if (!throttlingPolicy) {
            throttlingPolicy = 'Unlimited';
        }

        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications`, {
            'Content-Type': 'application/json'
        }, {
            name,
            throttlingPolicy,
            description,
            tokenType: 'JWT',
            groups: [],
            attributes: {},
            subscriptionScopes: []
        });
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error occurred while creating the application", error);
        util.handleError(res, error);
    }
};

// ***** Update Application *****

const updateApplication = async (req, res) => {
    try {
        const { name, throttlingPolicy, description } = req.body;
        const applicationId = req.params.applicationId;
        const responseData = await invokeApiRequest(req, 'PUT', `${controlPlaneUrl}/applications/${applicationId}`, {
            'Content-Type': 'application/json',
        }, {
            name,
            throttlingPolicy,
            description,
            tokenType: 'JWT',
            groups: [],
            attributes: {},
            subscriptionScopes: []
        });
        res.status(200).json({ message: responseData.message });
    } catch (error) {
        console.error("Error occurred while updating the application", error);
        util.handleError(res, error);
    }
};

// ***** Delete Application *****

const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const responseData = await invokeApiRequest(req, 'DELETE', `${controlPlaneUrl}/applications/${applicationId}`, null, null);
        res.status(200).json({ message: responseData.message });
    } catch (error) {
        console.error("Error occurred while deleting the application", error);
        util.handleError(res, error);
    }
}

// ***** Save Application *****

const resetThrottlingPolicy = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const { userName } = req.body;
        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications/${applicationId}/reset-throttle-policy`, {
            'Content-Type': 'application/json'
        }, {
            userName
        });
        res.status(200).json({ message: responseData.message });
    } catch (error) {
        console.error("Error occurred while resetting the application", error);
        util.handleError(res, error);
    }
};

// ***** Generate API Keys *****

const generateAPIKeys = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const environment = req.params.env;
        const { validityPeriod, additionalProperties } = req.body;
        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications/${applicationId}/api-keys/${environment}/generate`, {
            'Content-Type': 'application/json'
        }, {
            validityPeriod, additionalProperties
        });
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while deleting the application", error);
        util.handleError(res, error);
    }
};

const generateApplicationKeys = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications/${applicationId}/generate-keys`, {}, req.body);
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while generating the application keys", error);
        util.handleError(res, error);
    }
};

const generateOAuthKeys = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const keyMappingId = req.params.keyMappingId;
        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications/${applicationId}/oauth-keys/${keyMappingId}/generate-token`, {}, req.body);
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while generating the OAuth keys", error);
        util.handleError(res, error);
    }
};

const revokeOAuthKeys = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const keyMappingId = req.params.keyMappingId;
        const responseData = await invokeApiRequest(req, 'DELETE', `${controlPlaneUrl}/applications/${applicationId}/oauth-keys/${keyMappingId}`, {}, {});
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while generating the OAuth keys", error);
        util.handleError(res, error);
    }
};

const cleanUp = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const keyMappingId = req.params.keyMappingId;
        const responseData = await invokeApiRequest(req, 'POST', `${controlPlaneUrl}/applications/${applicationId}/oauth-keys/${keyMappingId}/clean-up`, {}, req.body);
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while generating the OAuth keys", error);
        util.handleError(res, error);
    }
};

const updateOAuthKeys = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const keyMappingId = req.params.keyMappingId;
        const responseData = await invokeApiRequest(req, 'PUT', `${controlPlaneUrl}/applications/${applicationId}/oauth-keys/${keyMappingId}`, {}, req.body);
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error occurred while generating the OAuth keys", error);
        util.handleError(res, error);
    }
};

const login = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const defaultUser = config.defaultAuth.users.find(user => user.username === username && user.password === password);
    passport.use(
        'default-auth',
        new CustomStrategy((req, done) => {
            if (defaultUser) {
                const user = { ...defaultUser };
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid credentials' });
            }
        })
    );

    passport.authenticate('default-auth', (err, user, info) => {
        if (err) {
            console.error("Error occurred while logging in", err);
            return util.handleError(res, err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return util.handleError(res, err);
            }
            console.log("Login successful", req.user);
            res.status(200).json({ message: 'Login successful' });
        });
    })(req, res);
};

module.exports = {
    unsubscribeAPI,
    subscribeAPI,
    saveApplication,
    updateApplication,
    deleteApplication,
    resetThrottlingPolicy,
    generateAPIKeys,
    generateApplicationKeys,
    generateOAuthKeys,
    revokeOAuthKeys,
    updateOAuthKeys,
    cleanUp,
    login
};