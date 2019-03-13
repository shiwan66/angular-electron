import { Component, OnInit } from '@angular/core';
import { AddressDataChinaService } from 'ngx-address/data/china';
import { ElectronService } from '../../providers/electron.service';
declare var jQuery: any;
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public code: string;
  public codeName: string;
  public opt: any;
  areaName: string; // 范围区域

  public pystr: string;
  public ipstr: string;

  title = 'app';
  elementType = 'url';
  get value() {
    let str = "";
    if (this.pystr != null && this.pystr != undefined) str += this.pystr;
    if (this.code != null && this.code != undefined) str += this.code;
    if (str) return this.encrypt(str);
    return str;
  };
  isError: boolean = false;
  errorMsg: string = "租户已注册，不可重复注册！";
  loading: boolean = false;
  constructor(private china: AddressDataChinaService, private electronSvc: ElectronService) {
    this.opt = {
      jumps: this.china.getJumps(),
      data: this.china.getData.bind(this.china)
    };
  }

  ngOnInit() {
  }
  /**
 * 加密（需要先加载lib/aes/aes.min.js文件）
 * @param word
 * @returns {*}
 */
  encrypt(word) {
    var key = CryptoJS.enc.Utf8.parse("hnty06080608hnty");
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return encrypted.toString();
  }

  /**
  * 解密
  * @param word
  * @returns {*}
  */
  decrypt(word) {
    var key = CryptoJS.enc.Utf8.parse("hnty06080608hnty");
    var decrypt = CryptoJS.AES.decrypt(word, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
  }

  onCustomSelected(result) {
    if (result && result.paths && result.paths.length) {
      this.areaName = result.paths[0].name;
      this.codeName = result.paths.map(item => item.name).join("");
    }
  }

  registry() {
    if (this.code && this.pystr && this.ipstr) {
      this.loading = true;
      this.electronSvc.registry(this.ipstr, `${this.code}${this.pystr}`).subscribe(
        result => {
          this.loading = false;
        },
        error => {
          this.errorMsg = "ip错误或网络异常！"
          this.isError = true;
          setTimeout(() => { this.isError = false; this.loading = false; }, 2000);
        }
      );
      this.saveFiles();
    }
  }

  saveFiles() {
    var imgbse = jQuery('#qrcodeBox').find('img').eq(0).attr('src');
    //过滤data:URL
    var base64Data = imgbse.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    this.electronSvc.saveFile(dataBuffer, 'qrcode.png');

    var confbuffer = this.electronSvc.repFileStrTobase(/\%ip\%/g, this.ipstr, /\%tenant\%/g, `${this.pystr}${this.code}`, 'http.txt');
    this.electronSvc.saveFile(confbuffer, 'http.conf')

    this.electronSvc.saveFile(new Buffer(this.value), 'security.txt');
    this.download();
  }

  download() {
    this.electronSvc.saveZip(this.electronSvc.path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'tmp'), path => {
      fetch(path).then(res => res.blob().then(blob => {
        var a = document.createElement('a');
        var url = window.URL.createObjectURL(blob);
        var filename = 'srouce.zip';
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }))
    });
  }
}
