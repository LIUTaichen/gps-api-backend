
const tenantName    = 'dempseywood.co.nz';
const clientID      = '1fa7f23e-341d-40d8-b624-7e0ac2c329a9';
const serverPort = 3001;

module.exports.serverPort = serverPort;

module.exports.credentials = {
    identityMetadata:`https://login.microsoftonline.com/dempseywood.co.nz/.well-known/openid-configuration`,
  //identityMetadata: `https://login.microsoftonline.com/${tenantName}/.well-known/openid-configuration`, 
  clientID: clientID
};