export const urlRE = /^(https?|ftp):\/\/([\d.A-Za-z-]+(:[\d$%&.A-Za-z-]+)*@)*((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d?)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}|([\dA-Za-z-]+\.)*[\dA-Za-z-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[A-Za-z]{2}))(:\d+)*(\/($|[\w#$%&'+,.=?\\~-]+))*$/;
export const emailRE = /^([\w.-])+@(([\dA-Za-z-])+\.)+([\dA-Za-z]{2,4})+$/;
export const letterRE = /^[A-Za-z]+$/;
export const idcardRE = /(^\d{15}$)|(^\d{17}([\dXx])$)/;
/**
 * [\u4E00-\u9FFF] 网络上
 * [\u4e00-\u9fa5] ant-design
 *
 */
export const chineseRE = /[\u4E00-\u9FA5]/;
/**
 * ES2015 版本以后使用 /^\p{Unified_Ideograph}{2}$/u
 */
export const chinese2015RE = /^\p{Unified_Ideograph}{2}$/u;
export const mobileRE = /^1([3-578])(\d{9})/;
