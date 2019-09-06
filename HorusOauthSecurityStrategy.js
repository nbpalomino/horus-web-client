const axios = require('axios');
var jp = require('jsonpath');
var HorusRestClient = require('./client/HorusRestClient.js');

function HorusOauthSecurityStrategy(expressServer, options) {

  var _this = this;
  var horusRestClient = new HorusRestClient(options.horusBaseUrl);

  // this endpoint will be called by external platforms sending us the code
  expressServer.get(options.express.callbackRoute, function(req, res) {

    var authorizationCode = req.query.code;

    if (!authorizationCode || (typeof authorizationCode === 'undefined')) {
      console.log("oauth authorization code is undefined. This is very rare. Is the earth planet alive?");
      res.redirect(options.express.failureRedirectRoute);
      return;
    }

    //get login redirect url
    var queryParameters = {
      idTypeLogin: options.oauth.idTypeLogin,
      clientId: options.oauth.clientId,
      clientSecret: options.oauth.clientSecret,
      code: authorizationCode,
      username: ''
    };

    console.log("Requesting new token");
    horusRestClient.getAccessTokenAndSubject(queryParameters, function(getAccessTokenAndSubjectErr, accessTokenAndSubject) {
      if (getAccessTokenAndSubjectErr) {
        console.log(getAccessTokenAndSubjectErr);
        res.redirect(options.express.failureRedirectRoute);
        return;
      }

      //get login redirect url
      var bodyParameters = {
        accessToken: accessTokenAndSubject.accessToken,
        typeOptionId: 'ROUTE'
      };

      console.log("Requesting route options");
      horusRestClient.getOptions(bodyParameters,function(getOptionsErr, webOptions){
        if (getOptionsErr) {
          console.log(getOptionsErr);
          res.redirect(options.express.failureRedirectRoute);
          return;
        }

        if(webOptions.length == 0){
          console.log("warning: Options are empty");
        }

        var userLogguedInfo = {};
        userLogguedInfo.accessToken = accessTokenAndSubject.accessToken;
        userLogguedInfo.subject = accessTokenAndSubject.subject;
        userLogguedInfo.routes = webOptions;

        req.session.userLogguedIn = userLogguedInfo;
        req.session.save();

        if (req.session.originalUrl) {
          res.redirect(req.session.originalUrl);
        } else {
          res.redirect(options.express.defaultSuccessLoginRoute);
        }

      });
    });
  });

  this.ensureAuthenticated = function(req, res, next) {

    if (!req.session || (typeof req.session === 'undefined')) {
      throw new Error("Session is not properly configured");
    }

    if (req.session.userLogguedIn) {
      //User is already logued in
      return next();
    } else {
      console.log("user not logged in");

      //get login redirect url
      var queryParameters = {
        idTypeLogin: options.oauth.idTypeLogin,
        clientId: options.oauth.clientId,
        clientSecret: options.oauth.clientSecret
      };

      horusRestClient.getAuthorizeUrl(queryParameters, function(getAuthorizeUrlErr, authorizeUrl) {
        if (getAuthorizeUrlErr) {
          console.log(getAuthorizeUrlErr);
          res.redirect(options.express.failureRedirectRoute);
          return;
        }

        console.log("Redirect url: " + authorizeUrl);
        res.redirect(authorizeUrl);
        return;

      });

    }

  }

}

module.exports = HorusOauthSecurityStrategy;
