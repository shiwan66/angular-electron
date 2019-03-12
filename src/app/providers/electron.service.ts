import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as adm_zip from 'adm-zip';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, zip } from 'rxjs';

@Injectable()
export class ElectronService {

  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  path: typeof path;
  adm_zip: typeof adm_zip;
  _path: string;

  constructor(
    private http: HttpClient) {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.path = window.require('path');
      this.adm_zip = window.require('adm-zip');

      this.emptyTmpDir();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

  registry(ip, code): Observable<any> {
    let url = `http://${ip}/api/tenant/registry`;
    return this.http.post(url, { code: code });
  }

  emptyTmpDir() {
    if(this.isElectron) {
      var that = this;
      var _path = this._path = this.path.join(__dirname, '/tmp');
      if (this.fs.existsSync(_path)) {
        that.deleteall(_path);
      }
      this.fs.mkdirSync(_path);
    }
  }

  /**
   * 删除文件夹下所有文件
   * @param path 文件夹路径
   */
  deleteall(path) {
    var that = this;
    var files = [];
    if (this.fs.existsSync(path)) {
      files = this.fs.readdirSync(path);
      files.forEach(function (file, index) {
        var curPath = path + "/" + file;
        if (that.fs.statSync(curPath).isDirectory()) { // recurse
          this.deleteall(curPath);
        } else { // delete file
          that.fs.unlinkSync(curPath);
        }
      });
      this.fs.rmdirSync(path);
    }
  }

  /**
   * base64转blob
   * @param base64Data 
   */
  dataURItoBlob(base64Data) {
    var byteString;
    if (base64Data.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(base64Data.split(',')[1]);
    else
      byteString = unescape(base64Data.split(',')[1]);
    var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {
      type: mimeString
    });
  }

  /**
   * 将base64转换为文件
   * @param dataurl 
   * @param filename 
   */
  dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Blob转为base64
   * @param blob 
   * @param callback 
   */
  blobToDataURL(blob, callback) {
    let a = new FileReader();
    a.onload = function (e) { callback((<any>e).target.result); }
    a.readAsDataURL(blob);
  }

  repFileStrTobase(ex1:RegExp, rp1: string, ex2: RegExp, rp2: string, filename: string): Buffer {
    var path = __dirname+'/assets/source'+`/${filename}`;
    var data = this.fs.readFileSync(path, 'utf8');
    var result = data.replace(ex1, rp1).replace(ex2, rp2);
    return new Buffer(result);
  }

  saveFile(buffer: Buffer, filename: string) {
    this.fs.writeFileSync(this._path+`/${filename}`, buffer);
  }

  saveZip(dirname, callback) {
    var that = this;
    var zip = new this.adm_zip();
    zip.addLocalFolder(dirname);
    zip.writeZip(that.path.join(dirname, '..', 'resouce.zip'), function() {
      callback(that.path.join(dirname, '..', 'resouce.zip'));
    });
  }
}
