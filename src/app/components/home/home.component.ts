import { Component, OnInit } from '@angular/core';
import { AddressDataChinaService } from 'ngx-address/data/china';

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
  value = 'Techiediaries';

  constructor(private china: AddressDataChinaService) {
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
}
