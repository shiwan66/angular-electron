import { Component, OnInit } from '@angular/core';
import { AddressDataChinaService } from 'ngx-address/data/china';
import { ElectronService } from '../../providers/electron.service';
declare var jQuery:any;

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
    if(this.pystr != null && this.pystr != undefined) str+=this.pystr;
    if(this.code != null && this.code != undefined) str+=this.code;
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

  onCustomSelected(result) {
    if(result && result.paths && result.paths.length) {
      this.areaName = result.paths[0].name;
      this.codeName = result.paths.map(item => item.name).join("");
    }
  }

  registry() {
    if(this.code && this.pystr && this.ipstr) {
      this.loading = true;
      this.electronSvc.registry(this.ipstr, `${this.code}${this.pystr}`).subscribe(
        result => {
          this.loading = false;
        },
        error => {
          this.errorMsg = "ip错误或网络异常！"
          this.isError = true;
          setTimeout(()=>{this.isError=false;this.loading = false;},2000);          
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

    var confbuffer = this.electronSvc.repFileStrTobase(/\%ip\%/g, this.ipstr, /\%tenant\%/g, this.value, 'http.txt');
    this.electronSvc.saveFile(confbuffer, 'http.conf')

    this.electronSvc.saveFile(new Buffer(this.value), 'security.txt');
  }

  download() {
    fetch('/assets/background.jpg').then(res => res.blob().then(blob => {
      var a = document.createElement('a');
      var url = window.URL.createObjectURL(blob);
      var filename = 'myfile.jpg';
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }))
  }
}
