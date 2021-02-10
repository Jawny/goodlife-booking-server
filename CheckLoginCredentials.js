const axios = require("axios");
const FormData = require("form-data");
const GOODLIFE_URL = "https://www.goodlifefitness.com/";

const CheckLoginCredentials = async (username, password) => {
  const loginFormData = new FormData();
  loginFormData.append("login", username);
  loginFormData.append("passwordParameter", password);

  const loginResult = await axios({
    method: "post",
    url:
      GOODLIFE_URL +
      "content/experience-fragments/goodlife/header/master/jcr:content/root/responsivegrid/header.AuthenticateMember.json",
    data: loginFormData,
    headers: {
      "content-type": `multipart/form-data; boundary=${loginFormData._boundary}`,
    },
  }).catch((err) => {
    return err.response.status;
  });

  if (Number.isInteger(loginResult)) {
    console.log("returning:", loginResult);
    return 401;
  } else {
    console.log(("returning:", loginResult.data.map.statusCode));
    return loginResult.data.map.statusCode;
  }
};

module.exports = {
  CheckLoginCredentials,
};
