const axios = require("axios");
const FormData = require("form-data");
const goodlifeUrl = "https://www.goodlifefitness.com/";

const verifyLoginCredentials = async (username, password) => {
  const loginFormData = new FormData();
  loginFormData.append("login", username);
  loginFormData.append("passwordParameter", password);

  return await axios({
    method: "post",
    url:
      goodlifeUrl +
      "content/experience-fragments/goodlife/header/master/jcr:content/root/responsivegrid/header.AuthenticateMember.json",
    data: loginFormData,
    headers: {
      "content-type": `multipart/form-data; boundary=${loginFormData._boundary}`,
    },
  }).catch((err) => {
    return err.response;
  });
};

module.exports = {
  verifyLoginCredentials,
};
