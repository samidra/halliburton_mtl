import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { AllApiServiceService } from '../../../Services/all-api-service.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonServiceService } from '../../../Services/common-service.service';
import { MatSliderModule } from '@angular/material/slider';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

// interface ChannelOption {
//   name: string;

// }
@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, FormsModule, MatSliderModule],
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss'],
})
export class DataComponent implements OnInit {
  startDate = '';
  endDate = '';
  fileExport = false;
  sliderValue = 0;
  channelOptions: any = [];
  selectedChannelOptions: any = [];
  selected_channel = '';
  searchChannel = '';
  chartOption: any;
  resource: any;
  task_id: any
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  showlistchannelOptions: boolean = false;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {

    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target)
    const clickedInsideDropdown = this.dropdownContainer.nativeElement.contains(event.target)
    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showlistchannelOptions = false
    }

  }
  constructor(private api_service: AllApiServiceService,
    private commonservice: CommonServiceService,
    private route: ActivatedRoute
  ) {
    this.task_id = this.route.snapshot.paramMap.get('taskNumber');
    this.resource = history.state.resource?.toLowerCase();
    this.resource?.includes('pressure') ? this.get_dataChannelPressure() : this.get_dataChannelNonPressure()
  }

  ngOnInit() {
    this.setCurrentMonthDates();
  }

  setCurrentMonthDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(lastDay);
  }

  private formatDate(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  show(): void {
    if (this.channelOptions.length === 0) {
      this.commonservice.displayWarning('No channel options available');
      return;
    }
    this.showlistchannelOptions = true;
    this.resource?.includes('pressure') ? this.channelOptions = this.pressure_api_data : this.channelOptions = this.api_data
    console.log(this.channelOptions);
  }

  filteredAutocomplete(): void {
    const searchTerm = this.searchChannel.trim().toLowerCase();
    if (searchTerm === '') {
      this.channelOptions = this.api_data;
      return;
    }
    let filtered = this.api_data.filter((option: any) => {
      return option.toLowerCase().includes(searchTerm)
    })

    this.channelOptions = filtered.length
      ? filtered
      : ['No data with this search'];

  }

  filterData(value: any): void {
    this.searchChannel = value;
    this.showlistchannelOptions = false;
  }

  errorMessage(field: any) {
    this.commonservice.displayWarning(`Please select valid ${field}`)
    this.searchChannel = ''
  }


  toggleSelection(option: string) {
    if (option === 'No data with this search') {
      this.errorMessage('Channel')
      return
    };

    const index = this.selectedChannelOptions.indexOf(option);

    if (index > -1) {
      this.selectedChannelOptions.splice(index, 1);
    } else {
      this.selectedChannelOptions.push(option);
      const data = this.selectedChannelOptions.join(', ');
      this.selected_channel = data;
      console.log(this.selected_channel);
    }
  }

  removechargeCode(item: any) {
    const index = this.selectedChannelOptions.indexOf(item);
    if (index !== -1) {
      this.selectedChannelOptions.splice(index, 1);
      this.selected_channel = this.selectedChannelOptions.join(', ');
    }
  }

  api_data: any
  pressure_api_data = ["PRESSURE01_PSI", "PRESSURE02_PSI", "TEMP01_DEGF", "TEMP02_DEGF", "Vessel08_SCRCurrent_Zone1_Ckt1_Line1", "Vessel08_SCRCurrent_Zone1_Ckt1_Line2", "Vessel08_SCRCurrent_Zone1_Ckt1_Line3", "Vessel08_SCRCurrent_Zone1_Ckt2_Line1", "Vessel08_SCRCurrent_Zone1_Ckt2_Line2", "Vessel08_SCRCurrent_Zone1_Ckt2_Line3", "Vessel08_SCRCurrent_Zone1_Ckt3_Line1", "Vessel08_SCRCurrent_Zone1_Ckt3_Line2", "Vessel08_SCRCurrent_Zone1_Ckt3_Line3", "Vessel08_SCRCurrent_Zone2_Ckt1_Line1", "Vessel08_SCRCurrent_Zone2_Ckt1_Line2", "Vessel08_SCRCurrent_Zone2_Ckt1_Line3", "Vessel08_SCRCurrent_Zone2_Ckt2_Line1", "Vessel08_SCRCurrent_Zone2_Ckt2_Line2", "Vessel08_SCRCurrent_Zone2_Ckt2_Line3", "Vessel08_SCRCurrent_Zone2_Ckt3_Line1", "Vessel08_SCRCurrent_Zone2_Ckt3_Line2", "Vessel08_SCRCurrent_Zone2_Ckt3_Line3", "Vessel08_SCRCurrent_Zone3_Ckt1_Line1", "Vessel08_SCRCurrent_Zone3_Ckt1_Line2", "Vessel08_SCRCurrent_Zone3_Ckt1_Line3", "Vessel08_SCRCurrent_Zone3_Ckt2_Line1", "Vessel08_SCRCurrent_Zone3_Ckt2_Line2", "Vessel08_SCRCurrent_Zone3_Ckt2_Line3", "Vessel08_SCRCurrent_Zone3_Ckt3_Line1", "Vessel08_SCRCurrent_Zone3_Ckt3_Line2", "Vessel08_SCRCurrent_Zone3_Ckt3_Line3", "Vessel08_SCRCurrent_Zone4_Ckt1_Line1", "Vessel08_SCRCurrent_Zone4_Ckt1_Line2", "Vessel08_SCRCurrent_Zone4_Ckt1_Line3", "Vessel08_SCRCurrent_Zone4_Ckt2_Line1", "Vessel08_SCRCurrent_Zone4_Ckt2_Line2", "Vessel08_SCRCurrent_Zone4_Ckt2_Line3", "Vessel08_SCRCurrent_Zone4_Ckt3_Line1", "Vessel08_SCRCurrent_Zone4_Ckt3_Line2", "Vessel08_SCRCurrent_Zone4_Ckt3_Line3", "P8_RELAY_01", "P8_RELAY_02", "P8_RELAY_03", "P8_RELAY_04", "P8_RELAY_05", "P8_RELAY_06", "P8_RELAY_07", "P8_RELAY_08", "P8_RELAY_09", "P8_RELAY_10", "P8_RELAY_11", "P8_RELAY_12", "P8_RELAY_13", "P8_RELAY_14", "P8_RELAY_15", "P8_RELAY_16", "P8_RELAY_17", "P8_RELAY_18", "P8_RELAY_19", "P8_RELAY_20", "P8_RELAY_21", "P8_RELAY_22", "P8_RELAY_23", "P8_RELAY_24", "Vessel03_SCRCurrent_Zone1_SC1_Line1", "Vessel03_SCRCurrent_Zone1_SC1_Line2", "Vessel03_SCRCurrent_Zone1_SC1_Line3", "Vessel03_SCRCurrent_Zone1_SC2_Line1", "Vessel03_SCRCurrent_Zone1_SC2_Line2", "Vessel03_SCRCurrent_Zone1_SC2_Line3", "Vessel03_SCRCurrent_Zone2_SC3_Line1", "Vessel03_SCRCurrent_Zone2_SC3_Line2", "Vessel03_SCRCurrent_Zone2_SC3_Line3", "Vessel03_SCRCurrent_Zone2_SC4_Line1", "Vessel03_SCRCurrent_Zone2_SC4_Line2", "Vessel03_SCRCurrent_Zone2_SC4_Line3", "Vessel03_SCRCurrent_Zone3_SC5_Line1", "Vessel03_SCRCurrent_Zone3_SC5_Line2", "Vessel03_SCRCurrent_Zone3_SC5_Line3", "Vessel03_SCRCurrent_Zone3_SC6_Line1", "Vessel03_SCRCurrent_Zone3_SC6_Line2", "Vessel03_SCRCurrent_Zone3_SC6_Line3", "Vessel04_SCRCurrent_Line1", "Vessel04_SCRCurrent_Line2", "Vessel04_SCRCurrent_Line3", "Vessel05_SCRCurrent_Line1", "Vessel05_SCRCurrent_Line2", "Vessel05_SCRCurrent_Line3", "Vessel08Cooling_Duct_Temp_DEGF", "Vessel08Cooling_Outside_Temp_DEGF", "Vessel08Cooling_Duct_Pressure_Inch",]
  get_dataChannelNonPressure() {
    this.isLoading = true;
    this.api_service.get_dataChannelNonPressure(this.task_id).subscribe({
      next: (res) => {

        this.api_data = res;
        this.channelOptions = this.api_data;
        this.isLoading = false;
        console.log(res);
      }, error: (err) => {
        console.error(err);
      }
    })
  }
  get_dataChannelPressure() {
    this.api_service.get_dataChannelPressure(this.task_id).subscribe({
      next: (res) => {
        this.api_data = res;
        this.channelOptions = this.pressure_api_data;
        console.log(res);
      }, error: (err) => {
        console.error(err);
      }
    })
  }

  // loadGraph() {

  //   if (!this.data_dummy || this.data_dummy.length === 0) {
  //     return;
  //   }
  //   const keys = Object.keys(this.data_dummy[0]).filter(
  //     key => key !== 'TimeStamp'
  //   );
  //   const series = keys.map((key, index) => {

  //     const data = this.data_dummy.map((d: any) => [
  //       new Date(d.TimeStamp),
  //       parseFloat(d[key])
  //     ]);

  //     return {
  //       name: key,
  //       type: 'line',
  //       showSymbol: false,
  //       smooth: false,
  //       data: data
  //     };
  //   });

  //   this.chartOption = {
  //     title: {
  //       text: this.resource?.includes('pressure') ? 'Pressure Graph' : 'Data Graph',
  //       left: 'center'
  //     },

  //     tooltip: {
  //       trigger: 'axis'
  //     },

  //     legend: {
  //       data: keys,
  //       top: 30,
  //       type: 'scroll',
  //       orient: 'vertical',
  //       left: 'right',
  //     },

  //     toolbox: {
  //       feature: {
  //         saveAsImage: {}
  //       }
  //     },

  //     dataZoom: [
  //       {
  //         type: 'inside'
  //       },
  //       {
  //         type: 'slider'
  //       }
  //     ],

  //     grid: {
  //       left: '5%',
  //       right: '5%',
  //       bottom: '10%',
  //       containLabel: true
  //     },

  //     xAxis: {
  //       type: 'time',
  //       boundaryGap: false
  //     },

  //     yAxis: {
  //       type: 'value',
  //       name: 'Value'
  //     },

  //     series: series
  //   };
  //   this.isLoading = false;
  // }

  //   loadGraph() {
  //   if (!this.data_dummy || this.data_dummy.length === 0) {
  //     return;
  //   }

  //   // Get all keys except TimeStamp
  //   const keys = Object.keys(this.data_dummy[0]).filter(key => key !== 'TimeStamp');

  //   // Separate keys into left (pressure/current) and right (temperature) axes
  //   const leftKeys = keys.filter(key => !key.toLowerCase().includes('temp'));
  //   const rightKeys = keys.filter(key => key.toLowerCase().includes('temp'));

  //   // Build series data
  //   const series = keys.map(key => {
  //     const data = this.data_dummy.map((d: any) => [
  //       new Date(d.TimeStamp),
  //       parseFloat(d[key])
  //     ]);

  //     return {
  //       name: key,
  //       type: 'line',
  //       showSymbol: false,
  //       smooth: false,
  //       yAxisIndex: key.toLowerCase().includes('temp') ? 1 : 0,
  //       data: data
  //     };
  //   });

  //   this.chartOption = {
  //     title: {
  //       text: this.resource?.includes('pressure') ? 'Pressure Graph' : 'Data Graph',
  //       left: 'center',
  //       top: -5
  //     },

  //     tooltip: {
  //       trigger: 'axis'
  //     },

  //     legend: {
  //       data: keys,
  //       top: 10,
  //       bottom: 150,
  //       type: 'scroll',
  //       orient: 'horizontal',
  //       left: 'right',
  //       itemGap: 15,
  //       padding: [10, 5, 10, 5]
  //     },

  //     toolbox: {
  //       feature: {
  //         saveAsImage: {
  //           title: this.resource?.includes('pressure') ? 'Pressure Graph Image' : 'Data Graph Image',
  //           top: -15
  //         },
  //       }
  //     },

  //     dataZoom: [
  //       { type: 'inside' },
  //       { type: 'slider' }
  //     ],

  //     grid: {
  //       left: '5%',
  //       right: '5%',
  //       bottom: '10%',
  //       containLabel: true
  //     },

  //     xAxis: {
  //       type: 'time',
  //       boundaryGap: false
  //     },

  //     yAxis: [
  //       {
  //         type: 'value',
  //         name: 'Pressure / Current',
  //         position: 'left',
  //         scale: true
  //       },
  //       {
  //         type: 'value',
  //         name: 'Temperature',
  //         position: 'right',
  //         scale: true,
  //         min: (value: { min: number; }) => value.min - 1,
  //         max: (value: { max: number; }) => value.max + 1
  //       }
  //     ],

  //     series: series
  //   };

  //   this.isLoading = false;
  // }


  loadGraph() { 
    if (!this.data_dummy || this.data_dummy.length === 0) {
      return;
    }
    const downsampleFactor = Math.max(1, Math.floor(this.data_dummy.length / 2000));
    const keys = Object.keys(this.data_dummy[0]).filter(key => key !== 'TimeStamp');
    const leftKeys = keys.filter(key => !key.toLowerCase().includes('temp'));
    const rightKeys = keys.filter(key => key.toLowerCase().includes('temp'));
    const series = keys.map(key => {
      const data = this.data_dummy
        .filter((_: any, index: number) => index % downsampleFactor === 0)
        .map((d: { [x: string]: string; TimeStamp: any; }) => [new Date(d.TimeStamp), parseFloat(d[key])]);

      return {
        name: key,
        type: 'line',
        showSymbol: false,
        smooth: false,
        yAxisIndex: key.toLowerCase().includes('temp') ? 1 : 0,
        data,
        large: true,
        largeThreshold: 1000
      };
    });

    this.chartOption = {
      title: {
        text: this.resource?.includes('pressure') ? 'Pressure Graph' : 'Data Graph',
        left: 'center',
        top: -5
      },

      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: false
        }
      },

      legend: {
        data: keys,
        top: 10,
        bottom: 150,
        type: 'scroll',
        orient: 'horizontal',
        left: 'right',
        itemGap: 15,
        padding: [10, 5, 10, 5]
      },

      toolbox: {
        feature: {
          saveAsImage: {
            title: this.resource?.includes('pressure') ? 'Pressure Graph Image' : 'Data Graph Image',
            top: -15
          }
        }
      },

      dataZoom: [
        { type: 'inside' },
        { type: 'slider' }
      ],

      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        containLabel: true
      },

      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: function (value: number) {
            const date = new Date(value);
            const year = date.getFullYear();
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const day = ('0' + date.getDate()).slice(-2);
            return `${year}-${month}-${day}`;
          }
        }
      },

      yAxis: [
        {
          type: 'value',
          name: 'Pressure / Current',
          position: 'left',
          scale: true
        },
        {
          type: 'value',
          name: 'Temperature',
          position: 'right',
          scale: true,
          min: (value: { min: number; }) => value.min - 1,
          max: (value: { max: number; }) => value.max + 1
        }
      ],

      series: series
    };

    this.isLoading = false;
  }

  validateForm(): boolean {
    let isValid = true;
    if (
      !this.selectedChannelOptions ||
      this.selectedChannelOptions.length === 0
    ) {
      isValid = false;
    }
    if (!this.startDate) {
      isValid = false;
    }
    if (!this.endDate) {
      isValid = false;
    }
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);

      if (start > end) {
        this.commonservice.displayWarning('Start date cannot be greater than End date');
        isValid = false;
      }
    }

    return isValid;
  }

  isSubmitted: boolean = false;
  showGraph: boolean = false;
  submitForm(
    channelModel: any,
    startCtrl: any,
    endCtrl: any
  ) {

    if (!this.validateForm()) {
      channelModel.control.markAsTouched();
      startCtrl.control.markAsTouched();
      endCtrl.control.markAsTouched();
      return;
    }
    this.isSubmitted = true;
    this.showGraph = true;
    console.log('Form Submitted');
    this.resource?.includes('pressure') ? this.get_PressureGraphData() : this.get_GraphData()
  }

  apidata: any;
  data_dummy: any;
  isLoading: boolean = false;
  get_PressureGraphData() {

    const body = {
      taskID: this.task_id,
      channels: this.selectedChannelOptions,
      startDate: this.startDate.replace('T', ' '),
      endDate: this.endDate.replace('T', ' ')
    };
    this.isLoading = true;
    this.api_service.get_PressureGraphData(body).subscribe({
      next: (res) => {
        this.apidata = res;
        if (!this.apidata || this.apidata.length === 0) {
          this.commonservice.displayWarning('No data available for the selected channels');
          this.showGraph = false;
          this.isLoading = false;
          return;
        }
        this.data_dummy = this.apidata;
        if (this.fileExport) {
          this.downloadExcel();
        }
        this.loadGraph();
      },

      error: (err) => {
        this.isLoading = false;
        this.showGraph = false;
        console.error(err);
      }

    });
  }

  get_GraphData() {
    const body = {
      taskID: this.task_id,
      channels: this.selectedChannelOptions,
      startDate: this.startDate.replace('T', ' '),
      endDate: this.endDate.replace('T', ' ')
    };
    this.isLoading = true;
    this.api_service.get_GraphData(body).subscribe({
      next: (res) => {
        this.apidata = res;
        if (!this.apidata || this.apidata.length === 0) {
          this.commonservice.displayWarning('No data available for the selected channels');
          this.showGraph = false;
          this.isLoading = false;
          return;
        }
        this.data_dummy = this.apidata;
        if (this.fileExport) {
          this.downloadExcel();
        }
        this.loadGraph();
      }, error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.showGraph = false;
      }
    })
  }

  downloadExcel() {
    this.isLoading = true;
    const worksheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(this.apidata);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Data': worksheet },
      SheetNames: ['Data']
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    const data: Blob = new Blob(
      [excelBuffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      }
    );

    FileSaver.saveAs(data, `${this.task_id} - Export Data - ${this.resource}.xlsx`);
    this.isLoading = false;
  }

  toggleSelectionAll() {
    // 1. Filter out the error message option if it exists
    const validOptions = this.channelOptions.filter(
      (option: string) => option !== 'No data with this search'
    );

    // 2. If all are already selected, clear the selection (Deselect All)
    if (this.selectedChannelOptions.length === validOptions.length) {
      this.selectedChannelOptions = [];
      this.selected_channel = '';
    } else {
      // 3. Otherwise, select all valid options
      this.selectedChannelOptions = [...validOptions];
      this.selected_channel = this.selectedChannelOptions.join(', ');
    }

    console.log(this.selected_channel);
  }

}