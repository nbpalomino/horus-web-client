const axios = require('axios');
var jp = require('jsonpath');

function HorusRestClient(horusBaseUrl) {

  var horusGetAuthorizeUrlEndpoint = horusBaseUrl + '/oauth/security/authorize/url';
  var horusGetAccesstokenEndpoint = horusBaseUrl + '/oauth/security/token';
  var horusGetOptionsEndpoint = horusBaseUrl + '/oauth/security/option/access';


  this.getAuthorizeUrl = function(params, callback) {

    try {
      axios({
          method: 'get',
          url: horusGetAuthorizeUrlEndpoint,
          params: params
        })
        .then(function(horusResponse) {
          if (!horusResponse || (typeof horusResponse === 'undefined')) {
            return callback("Horus " + horusGetAuthorizeUrlEndpoint + " http response is wrong.", null)
          }

          if (!horusResponse.data || (typeof horusResponse.data === 'undefined')) {
            return callback("Horus " + horusGetAuthorizeUrlEndpoint + " http response.data is wrong.", null);
          }

          if (!horusResponse.data.status || (typeof horusResponse.data.status === 'undefined')) {
            return callback("Horus " + horusGetAuthorizeUrlEndpoint + " http response status is undefined.", null);
          }

          if (horusResponse.data.status != "200") {
            return callback("Horus " + horusGetAuthorizeUrlEndpoint + " http response status " + horusResponse.data.status + " is different to 200:" + JSON.stringify(horusResponse.data), null);
          }

          if (!horusResponse.data.content || (typeof horusResponse.data.content === 'undefined')) {
            return callback("Horus " + horusGetAuthorizeUrlEndpoint + " http response content is undefined. Redirect url was expected :" + horusResponse.data.content, null);
          }

          return callback(null, horusResponse.data.content);

        })
        .catch(function(err) {
          console.error(err.stack);
          return callback("Horus is down or " + horusGetAuthorizeUrlEndpoint + " does not respond: " + err.message, null);
        });
    } catch (globalErr) {
      console.error(globalErr.stack);
      return callback("Error when consuming Horus service:" + globalErr.message, null);
    }

  }

  this.getAccessTokenAndSubject = function(params, callback) {

    try {
      axios({
          method: 'get',
          url: horusGetAccesstokenEndpoint,
          params: params
        })
        .then(function(horusResponse) {

          if (!horusResponse || (typeof horusResponse === 'undefined')) {
            return callback("Horus " + horusGetAccesstokenEndpoint + " http response is wrong.", null);
          }

          if (!horusResponse.data || (typeof horusResponse.data === 'undefined')) {
            return callback("Horus " + horusGetAccesstokenEndpoint + " http response body is null, empty or wrong.", null);
          }

          var status = jp.query(horusResponse.data, '$.status');

          if (status != "200") {
            return callback("Horus " + horusGetAccesstokenEndpoint + " json response contains [status] different to 200:" + JSON.stringify(horusResponse.data), null);
          }

          //jsonpath return an array instead unique value : https://stackoverflow.com/a/23624178/3957754
          var accessToken = jp.value(horusResponse.data, '$.content.accessToken');

          if (!accessToken || (typeof accessToken === 'undefined')) {
            return callback("Horus " + horusGetAccesstokenEndpoint + " json response dos not contain [content.accessToken] or is empty:" + JSON.stringify(horusResponse.data), null);
          }

          //jsonpath return an array instead unique value : https://stackoverflow.com/a/23624178/3957754
          var subject = jp.value(horusResponse.data, '$.content.nickName');

          if (!subject || (typeof subject === 'undefined')) {
            return callback("Horus " + horusGetAccesstokenEndpoint + " json response dos not contain [content.nickName] or is empty:" + JSON.stringify(horusResponse.data), null);
          }

          return callback(null, {
            "accessToken": accessToken,
            "subject": subject
          });

        })
        .catch(function(err) {
          console.error(err.stack);
          console.log(err.response.data);
          return callback("Horus is down or " + horusGetAccesstokenEndpoint + " does not respond: " + err.message, null);
        });
    } catch (globalErr) {
      console.error(globalErr.stack);
      return callback("Error when consuming Horus service:" + globalErr.message, null);
    }

  }

  this.getOptions = function(params, callback) {

    try {
      axios({
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          url: horusGetOptionsEndpoint,
          data: {
            accessToken: params.accessToken,
            typeOptionId: 'ROUTE',
          },
        })
        .then(function(horusResponse) {

          if (!horusResponse || (typeof horusResponse === 'undefined')) {
            return callback("Horus " + horusGetOptionsEndpoint + " http response is wrong.", null);
          }

          if (!horusResponse.data || (typeof horusResponse.data === 'undefined')) {
            return callback("Horus " + horusGetOptionsEndpoint + " http response body is null, empty or wrong.", null);
          }

          var status = jp.query(horusResponse.data, '$.status');

          if (status != "200") {
            return callback("Horus " + horusGetOptionsEndpoint + " json response contains [status] different to 200:" + JSON.stringify(horusResponse.data), null);
          }

          if (Object.prototype.toString.call(horusResponse.data.content) !== '[object Array]') {
            return callback("Horus " + horusGetOptionsEndpoint + " json response contains [content] which is not an array:" + JSON.stringify(horusResponse.data), null);
          }

          return callback(null, horusResponse.data.content);

        })
        .catch(function(err) {
          console.error(err.stack);
          console.log(err.response.data);
          return callback("Horus is down or " + horusGetOptionsEndpoint + " does not respond: " + err.message, null);
        });
    } catch (globalErr) {
      console.error(globalErr.stack);
      return callback("Error when consuming Horus service " + horusGetOptionsEndpoint + ":" + globalErr.message, null);
    }

  }

}


module.exports = HorusRestClient

