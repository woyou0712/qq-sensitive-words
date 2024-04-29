const axios = require("axios");

class QQ {
  /**
   * APPID
   * @type {string}
   */
  appid = null;
  /**
   * 小程序秘钥
   * @type {string}
   */
  secret = null;
  accessToken = {
    access_token: "",
    endTime: 0,
  };
  constructor(appid, secret) {
    this.appid = appid;
    this.secret = secret;
  }

  // 获取access_token
  getAccessToken() {
    return new Promise((resolve, reject) => {
      if (this.accessToken.endTime > Date.now()) {
        resolve(this.accessToken.access_token);
        return;
      }
      axios
        .get(
          `https://api.q.qq.com/api/getToken?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
        )
        .then(({ data }) => {
          if (data.errcode !== 0) {
            reject("getAccessToken:errmsg-->" + data.errmsg);
            return;
          }
          this.accessToken.access_token = data.access_token;
          this.accessToken.endTime = Date.now() + data.expires_in;
          resolve(this.accessToken.access_token);
        })
        .catch((err) => reject(err));
    });
  }

  // 获取用户openid
  getOpenid(code) {
    return new Promise(async (resolve, reject) => {
      axios
        .get(
          `https://api.q.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`
        )
        .then(({ data }) => {
          if (data.errcode !== 0) {
            return reject("getOpenid:errmsg-->" + data.errmsg);
          }
          resolve(data.openid);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * 敏感词检测
   * @param {String} content 需检测的文本内容，文本字数的上限为2500字，需使用UTF-8编码
   * @returns
   */
  sensitiveWords(content) {
    return new Promise(async (resolve, reject) => {
      const access_token = await this.getAccessToken();
      axios
        .post(
          `https://api.q.qq.com/api/json/security/MsgSecCheck?access_token=${access_token}`,
          {
            access_token,
            content,
            appid: this.appid,
          }
        )
        .then(({ data }) => {
          if (data.errCode === 0) {
            resolve({ bool: false, message: "内容正常" });
            return;
          }
          resolve({
            bool: true,
            message: "内容含有违法违规内容" + data.errMsg,
          });
        })
        .catch((err) => reject(err));
    });
  }
  /**
   * 获取小程序二维码
   * @param {String} path
   * @returns {Promise<buffer>}
   */
  getAppletQrCode(path) {
    return new Promise(async (resolve, reject) => {
      if (!path) {
        reject("path is null");
        return;
      }
      const access_token = await this.getAccessToken();
      axios
        .post(
          `https://api.q.qq.com/api/json/qqa/CreateMiniCode?access_token=${access_token}`,
          {
            access_token,
            path,
            appid: this.appid,
          },
          { responseType: "arraybuffer" }
        )
        .then(({ data }) => {
          const res = data.toString();
          if (res.indexOf("errmsg") >= 0) {
            reject(JSON.parse(res).errmsg);
            return;
          }
          resolve(data);
        })
        .catch((e) => reject(e));
    });
  }
}

module.exports = QQ;
