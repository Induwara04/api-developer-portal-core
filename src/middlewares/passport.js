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
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const jwt = require('jsonwebtoken');
const https = require('https');
const constants = require('../utils/constants');
const config = require(process.cwd() + '/config.json');

function configurePassport(authJsonContent, claimNames) {

    const agent = new https.Agent({
        rejectUnauthorized: false
    });    
    //set scopes to call API Manager REST apis
    const requestedScopes = "openid profile apim:subscribe admin dev";
    let scope = requestedScopes.split(" ");
    scope.push(...(authJsonContent.scope ? authJsonContent.scope.split(" ") : ""));
    const strategy = new OAuth2Strategy({
        issuer: authJsonContent.issuer,
        authorizationURL: authJsonContent.authorizationURL,
        tokenURL: authJsonContent.tokenURL,
        userInfoURL: authJsonContent.userInfoURL,
        clientID: authJsonContent.clientId,
        callbackURL: authJsonContent.callbackURL,
        scope: scope,
        passReqToCallback: true,
        state: true,
        pkce: true
    }, (req, accessToken, refreshToken, params, profile, done) => {
        if (!accessToken) {
            console.error('No access token received');
            return done(new Error('Access token missing'));
        }
        const decodedJWT = jwt.decode(params.id_token);
        const name = decodedJWT['given_name'] ? decodedJWT['given_name'] : decodedJWT['nickname'];
        const organizationID = decodedJWT[claimNames[constants.ROLES.ORGANIZATION_CLAIM]] ? decodedJWT[config.orgIDClaim] : '';
        const roles = decodedJWT[claimNames[constants.ROLES.ROLE_CLAIM]] ? decodedJWT[config.roleClaim] : '';
        const groups = decodedJWT[claimNames[constants.ROLES.GROUP_CLAIM]] ? decodedJWT[config.groupsClaim] : '';
        let isAdmin, isSuperAdmin = false;
        if (roles.includes(constants.ROLES.SUPER_ADMIN) || roles.includes(constants.ROLES.ADMIN)) {
            isAdmin = true;
        }
        if (roles.includes(constants.ROLES.SUPER_ADMIN)) {
            isSuperAdmin = true;
        }
        profile = {
            'name': name,
            'idToken': params.id_token,
            'email': decodedJWT['email'],
            [constants.ROLES.ORGANIZATION_CLAIM]: organizationID,
            'returnTo': req.session.returnTo,
            accessToken,
            [constants.ROLES.ROLE_CLAIM]: roles,
            [constants.ROLES.GROUP_CLAIM]: groups,
            'isAdmin': isAdmin,
            'isSuperAdmin': isSuperAdmin
        };
        return done(null, profile);
    });
    strategy._oauth2.setAgent(agent);

    const originalGetOAuthAccessToken = strategy._oauth2.getOAuthAccessToken;
    strategy._oauth2.getOAuthAccessToken = function (code, params, callback) {
        originalGetOAuthAccessToken.call(this, code, params, (err, accessToken, refreshToken, results) => {
            if (err) {
                console.error('Error during token exchange:', err);
            }
            callback(err, accessToken, refreshToken, results);
        });
    };
    passport.use(strategy);

}

module.exports = configurePassport;
